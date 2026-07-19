---
title: "Build Resilient PowerShell Logging for Task Scheduler"
date: 2026-07-11T00:00:00Z
lastmod: 2026-07-11T00:00:00Z
description: "Build daily CMTrace-compatible logs with reader-friendly file sharing, serialized append retries, console fallback, and automatic retention."
summary: "A reusable pattern for scheduled PowerShell jobs that keeps one readable log per component per day without letting a transient append failure replace the actual job result."
tags: ["PowerShell", "Automation", "Logging", "Task Scheduler"]
showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
disableShare: false
disableHLJS: false
hideSummary: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
---

While standardizing several scheduled reporting scripts, I wanted the operator experience to be consistent: open today's file, filter warnings and errors in CMTrace, and leave the file open during a rerun. That exposed several details that a basic `Add-Content` helper does not address.

The pattern below writes one log per component and day, permits a compatible viewer such as CMTrace to read the active file, serializes brief writer overlaps through bounded retries, and mirrors each entry to the console. A transient logging problem produces a warning but does not replace the result of the actual job.

Task Scheduler does not retain standard output as a readable job log by default. The console copy mainly helps interactive runs and wrappers that explicitly redirect output; the daily file remains the primary diagnostic record for an unattended task.

## The problem

Task Scheduler changes the conditions around an otherwise ordinary script:

- the working directory may not be the script directory;
- nobody is watching the console when a failure occurs;
- a log viewer or another task instance may have the file open;
- one endlessly growing file becomes slow to inspect and difficult to retain; and
- a multiline exception can break a structured log entry.

For operational scripts, I wanted the logger to meet these requirements:

1. accept only a fully qualified Windows log directory;
2. create a predictable `Component_yyyyMMdd.log` file;
3. populate CMTrace's log text, component, date/time, and thread columns while preserving severity and source metadata in the record;
4. keep the active file readable by a compatible viewer such as CMTrace without allowing simultaneous writers;
5. retry short-lived append conflicts before falling back to the console; and
6. report retention failures without making them fatal.

Microsoft's [CMTrace documentation](https://learn.microsoft.com/en-us/intune/configmgr/core/support/cmtrace) describes the viewer and its default display columns for Configuration Manager-style logs. The same format is useful for custom administration scripts even when Configuration Manager is not involved.

> **Warning:** Structured logging is not secret redaction. Never write passwords, access tokens, connection strings, private keys, complete authorization headers, or other credentials to this log. Hostnames, account names, paths, addresses, and exception text can also be sensitive. Record only what an operator needs to diagnose the job.

## Keep each CMTrace record on one line

CMTrace expects one complete record per line. These helpers remove line breaks and control characters, protect the record terminator, limit unusually long values, and escape the fields used as attributes.

The `context` field is intentionally empty. Automatically recording the Windows identity that runs a task adds little diagnostic value in many environments and creates another identifier to remove before sharing a log.

```PowerShell
function ConvertTo-PlainLogText {
    param(
        [AllowNull()]
        [object] $Value,

        [ValidateRange(256, 32768)]
        [int] $MaximumLength = 12000
    )

    if ($null -eq $Value) {
        return ''
    }

    $text = [string] $Value
    $text = $text.Replace(']LOG]!>', '] LOG ]!>')
    $text = $text -replace "`r`n|`n|`r", ' '
    $text = $text -replace '[\u0000-\u0008\u000B\u000C\u000E-\u001F]', ' '
    $text = $text.Trim()

    if ($text.Length -gt $MaximumLength) {
        return '{0}... [truncated]' -f $text.Substring(0, $MaximumLength)
    }

    return $text
}

function Protect-CmTraceAttribute {
    param([AllowNull()] [object] $Value)

    $plainText = ConvertTo-PlainLogText -Value $Value -MaximumLength 1024
    return [System.Security.SecurityElement]::Escape($plainText)
}

function New-CmTraceRecord {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message,

        [Parameter(Mandatory = $true)]
        [ValidateSet('INFO', 'WARN', 'ERROR', 'DEBUG')]
        [string] $Level,

        [Parameter(Mandatory = $true)]
        [string] $Component,

        [string] $Source = '',

        [datetime] $Timestamp = (Get-Date)
    )

    $now = $Timestamp
    $typeByLevel = @{ INFO = 1; DEBUG = 1; WARN = 2; ERROR = 3 }
    $biasMinutes = -[int][Math]::Round(
        [System.TimeZoneInfo]::Local.GetUtcOffset($now).TotalMinutes
    )
    $bias = if ($biasMinutes -ge 0) {
        '+{0:000}' -f $biasMinutes
    }
    else {
        '-{0:000}' -f [Math]::Abs($biasMinutes)
    }

    $time = $now.ToString(
        'HH:mm:ss.fff',
        [Globalization.CultureInfo]::InvariantCulture
    ) + $bias
    $date = $now.ToString(
        'M-d-yyyy',
        [Globalization.CultureInfo]::InvariantCulture
    )
    $thread = [System.Threading.Thread]::CurrentThread.ManagedThreadId
    $recordMessage = if ($Level -eq 'DEBUG') {
        '[DEBUG] {0}' -f $Message
    }
    else {
        $Message
    }

    return '<![LOG[{0}]LOG]!><time="{1}" date="{2}" component="{3}" context="" type="{4}" thread="{5}" file="{6}">' -f `
        (ConvertTo-PlainLogText -Value $recordMessage),
        (Protect-CmTraceAttribute -Value $time),
        (Protect-CmTraceAttribute -Value $date),
        (Protect-CmTraceAttribute -Value $Component),
        $typeByLevel[$Level],
        $thread,
        (Protect-CmTraceAttribute -Value $Source)
}
```

CMTrace has no separate debug record type. The helper therefore stores `DEBUG` as informational type `1` and prefixes the log text with `[DEBUG]` so the distinction remains visible in the raw file and viewer.

## Serialize append attempts

The writer opens the file with `FileShare.Read` and `FileShare.Delete`, but deliberately omits `FileShare.Write`. A compatible viewer such as CMTrace can read the active file, while a second writer must wait until the first writer closes its handle. A viewer that opens the file with restrictive sharing can still block the writer until the retry limit is reached.

The .NET [`FileShare` documentation](https://learn.microsoft.com/en-us/dotnet/api/system.io.fileshare) describes the access granted to subsequent file opens. The retry loop below uses that behavior as a short serialization window instead of allowing two append handles to write from the same file position.

```PowerShell
function Test-WindowsFullLogPath {
    param([AllowNull()] [string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $false
    }

    $drivePath = $Path -match '^[A-Za-z]:[\\/]'
    $uncPath = $Path -match '^[\\/]{2}[^\\/]+[\\/][^\\/]+'
    return ($drivePath -or $uncPath)
}

function Write-CmTraceLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message,

        [Parameter(Mandatory = $true)]
        [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$')]
        [string] $Component,

        [Parameter(Mandatory = $true)]
        [string] $Directory,

        [ValidateSet('INFO', 'WARN', 'ERROR', 'DEBUG')]
        [string] $Level = 'INFO',

        [string] $Source = '',

        [ValidateRange(1, 10)]
        [int] $Attempts = 6
    )

    $entryTime = Get-Date
    $consoleText = '[{0}] [{1}] {2}' -f `
        $entryTime.ToString('yyyy-MM-dd HH:mm:ss', [Globalization.CultureInfo]::InvariantCulture),
        $Level,
        (ConvertTo-PlainLogText -Value $Message -MaximumLength 4000)

    switch ($Level) {
        'ERROR' { Write-Host $consoleText -ForegroundColor Red }
        'WARN'  { Write-Host $consoleText -ForegroundColor Yellow }
        'DEBUG' { Write-Host $consoleText -ForegroundColor DarkGray }
        default { Write-Host $consoleText }
    }

    if (-not (Test-WindowsFullLogPath -Path $Directory)) {
        Write-Warning `
            'File logging skipped because the log directory is not fully qualified.' `
            -WarningAction Continue
        return
    }

    try {
        $logRoot = [System.IO.Path]::GetFullPath($Directory)

        if (Test-Path -LiteralPath $logRoot -PathType Leaf) {
            throw "The log directory points to a file: $logRoot"
        }

        New-Item -ItemType Directory -Path $logRoot -Force -ErrorAction Stop |
            Out-Null
    }
    catch {
        Write-Warning `
            "File logging unavailable: $($_.Exception.Message)" `
            -WarningAction Continue
        return
    }

    # Recalculate the path for every entry so a long task rotates at midnight.
    $logPath = Join-Path $logRoot (
        '{0}_{1}.log' -f $Component, $entryTime.ToString('yyyyMMdd', [Globalization.CultureInfo]::InvariantCulture)
    )
    $record = New-CmTraceRecord `
        -Message $Message `
        -Level $Level `
        -Component $Component `
        -Source $Source `
        -Timestamp $entryTime
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(
        $record + [Environment]::NewLine
    )
    $lastError = $null

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        $stream = $null
        $writeCompleted = $false
        $closeError = $null

        try {
            $stream = [System.IO.FileStream]::new(
                $logPath,
                [System.IO.FileMode]::Append,
                [System.IO.FileAccess]::Write,
                [System.IO.FileShare]::Read -bor [System.IO.FileShare]::Delete
            )
            $stream.Write($bytes, 0, $bytes.Length)
            $stream.Flush()
            $writeCompleted = $true
        }
        catch {
            $lastError = $_.Exception.Message
        }
        finally {
            if ($null -ne $stream) {
                try {
                    $stream.Dispose()
                }
                catch {
                    $closeError = $_.Exception.Message
                }
            }
        }

        if ($closeError) {
            Write-Warning `
                "The log handle could not be closed cleanly: $closeError" `
                -WarningAction Continue
        }

        if ($writeCompleted) {
            return
        }

        if ($attempt -lt $Attempts) {
            Start-Sleep -Milliseconds (125 * $attempt)
        }
    }

    Write-Warning `
        "Could not append to '$logPath'. Console logging remains available. $lastError" `
        -WarningAction Continue
}
```

The file handle is disposed inside its own protected block. A close failure can therefore generate a warning, but it cannot escape the logger and replace the job's original result.

## Remove expired daily logs

Because `Write-CmTraceLog` calculates the dated path for every entry, the next message after midnight starts a new file. Retention uses the same validated component name and reports both enumeration and deletion failures.

```PowerShell
function Remove-ExpiredCmTraceLogs {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$')]
        [string] $Component,

        [Parameter(Mandatory = $true)]
        [string] $Directory,

        [ValidateRange(1, 3650)]
        [int] $RetentionDays = 30
    )

    if (-not (Test-WindowsFullLogPath -Path $Directory)) {
        Write-Warning 'Retention skipped because the log directory is not fully qualified.' `
            -WarningAction Continue
        return 0
    }

    try {
        $logRoot = [System.IO.Path]::GetFullPath($Directory)
        if (-not (Test-Path -LiteralPath $logRoot -PathType Container -ErrorAction Stop)) {
            return 0
        }

        $expiredFiles = @(
            Get-ChildItem `
                -LiteralPath $logRoot `
                -Filter "$Component`_*.log" `
                -File `
                -ErrorAction Stop |
                Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) }
        )
    }
    catch {
        Write-Warning "Could not enumerate old logs: $($_.Exception.Message)" `
            -WarningAction Continue
        return 0
    }

    $removed = 0
    foreach ($file in $expiredFiles) {
        try {
            Remove-Item -LiteralPath $file.FullName -Force -ErrorAction Stop
            $removed++
        }
        catch {
            Write-Warning "Could not remove '$($file.FullName)': $($_.Exception.Message)" `
                -WarningAction Continue
        }
    }

    return $removed
}
```

## Add it to a scheduled script

Use a splatted settings table so every call shares the same absolute path, component, and source file. Run retention before the main work so an early job failure does not postpone cleanup indefinitely.

```PowerShell
$ErrorActionPreference = 'Stop'

$logSettings = @{
    Component = 'ServiceInventory'
    Directory = 'C:\ProgramData\PowerShellLogs\ServiceInventory'
    Source    = (Split-Path -Path $PSCommandPath -Leaf)
}

$removedLogs = Remove-ExpiredCmTraceLogs `
    -Component $logSettings.Component `
    -Directory $logSettings.Directory `
    -RetentionDays 30

if ($removedLogs -gt 0) {
    Write-CmTraceLog @logSettings -Message "Removed $removedLogs expired log file(s)."
}

try {
    Write-CmTraceLog @logSettings -Message 'Starting service inventory.'

    $services = @(Get-Service -ErrorAction Stop)
    $running = @($services | Where-Object Status -eq 'Running').Count
    $stopped = @($services | Where-Object Status -eq 'Stopped').Count
    $other = $services.Count - $running - $stopped

    Write-CmTraceLog @logSettings -Message (
        'Service inventory completed. Total={0} Running={1} Stopped={2} Other={3}' -f `
            $services.Count, $running, $stopped, $other
    )
}
catch {
    # Log the exception type without copying a potentially sensitive message.
    Write-CmTraceLog `
        @logSettings `
        -Message "Service inventory failed: $($_.Exception.GetType().Name)" `
        -Level 'ERROR'

    throw
}
finally {
    Write-CmTraceLog @logSettings -Message 'Service inventory job finished.'
}
```

The example logs counts instead of service names. That keeps the routine useful without unnecessarily recording the machine's application inventory. Rethrowing in the `catch` block is also important: a red log entry does not set the task's result by itself.

## Validate the behavior

Test the helper from the same account and command line that Task Scheduler will use.

1. Run the script twice on the same day and confirm that both executions append to one `ServiceInventory_yyyyMMdd.log` file.
2. Open the file in CMTrace during a run. Confirm that **Log Text**, **Component**, **Date/Time**, and **Thread** are populated, then inspect a raw record for the `file` metadata.
3. Write representative `INFO`, `WARN`, and `ERROR` messages and confirm that CMTrace applies the expected warning and error highlighting.
4. Create an old test log matching the component's filename pattern, adjust its `LastWriteTime`, and verify that retention removes only files older than the cutoff.
5. Start two low-volume test instances together and confirm that the second writer retries rather than overwriting an entry.

> **Warning:** The bounded retry loop handles brief overlaps; it is not a queue. In Task Scheduler, set **If the task is already running** to **Do not start a new instance** when overlapping jobs are not required. Use a named mutex, Windows Event Log, or a central logging service when multiple processes must write continuously or delivery must be guaranteed.

## Result

The final pattern produces one predictable, CMTrace-readable file per component per day while keeping console output for interactive runs or redirected output. Readers can keep the active file open, brief writer conflicts are retried without permitting simultaneous append handles, and retention problems remain visible without stopping the job.

The reusable lesson is to treat logging as operational infrastructure: keep records structured and minimal, separate configuration problems from transient I/O failures, and let the surrounding script decide whether the task itself succeeded.
