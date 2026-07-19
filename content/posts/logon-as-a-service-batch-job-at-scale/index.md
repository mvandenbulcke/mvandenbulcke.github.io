---
title: "Grant Logon Rights at Scale with Group Policy"
date: 2024-04-10T12:00:03+00:00
lastmod: 2026-07-10T00:00:00Z
description: "Use Group Policy Preferences and per-server Active Directory groups to manage Log on as a service and Log on as a batch job rights at scale."
tags: ["GPO"]
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

In one environment, a service failed to start because its User Rights Assignment was configured incorrectly. The environment used one GPO per server to manage **Log on as a service** and **Log on as a batch job**. That worked, but it left the team maintaining many nearly identical policies.

A consolidated design uses one GPO, two local groups on each server, and per-server Active Directory groups. Group Policy Preferences expands the domain and computer-name variables on each target, so the same policy can grant rights to different accounts on every server.

> **Warning:** Defining a User Rights Assignment in a domain GPO replaces the effective list from lower-precedence policy on targeted computers; it does not merge only the new entries into the existing list. The entries shown in this example are not a universally safe minimum. Preserve every principal required by Windows roles, services, agents, and scheduled tasks. For **Log on as a batch job**, common server defaults include Administrators, Backup Operators, and Performance Log Users, but the required list depends on the server role. Microsoft documents the defaults, policy precedence, and Task Scheduler impact in [Log on as a batch job](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/log-on-as-a-batch-job).

## Naming model

The configuration uses these example local groups:

- `<LOCAL_PREFIX>-LogOnAsService` for **Log on as a service**
- `<LOCAL_PREFIX>-LogOnAsBatch` for **Log on as a batch job**

Each local group receives one matching domain group:

- `%DomainName%\<DOMAIN_PREFIX>-%ComputerName%_LogonAsService`
- `%DomainName%\<DOMAIN_PREFIX>-%ComputerName%_LogonAsBatch`

Replace both prefix placeholders with your organisation's approved naming convention. This keeps the rights assignment consistent in one GPO while leaving account membership specific to each server.

## Inventory the effective rights before rollout

Before defining or linking the GPO, select a representative server from every role in scope: for example, application, IIS, backup, monitoring, and management servers. Export the effective user-rights policy and Resultant Set of Policy from each representative server:

```PowerShell
$AuditPath = 'C:\Temp\LogonRightsAudit'
New-Item -ItemType Directory -Path $AuditPath -Force | Out-Null

secedit /export /cfg "$AuditPath\user-rights-before.inf" /areas USER_RIGHTS
gpresult /h "$AuditPath\gpresult-before.html"

Select-String -Path "$AuditPath\user-rights-before.inf" `
    -Pattern '^SeServiceLogonRight','^SeBatchLogonRight'
```

Inventory the identities used by services and scheduled tasks on the same systems:

```PowerShell
Get-CimInstance Win32_Service |
    Select-Object Name, StartName, State, StartMode |
    Export-Csv "$AuditPath\services-before.csv" -NoTypeInformation

Get-ScheduledTask |
    Select-Object TaskPath, TaskName,
        @{Name='RunAs';Expression={$_.Principal.UserId}} |
    Export-Csv "$AuditPath\tasks-before.csv" -NoTypeInformation
```

Resolve any SID-only entries in the security-policy export, record why each principal needs the right, and build the complete approved list for each server role. Create a dedicated pilot OU or equivalent narrowly scoped test target containing representative servers; do not link this GPO broadly yet.

## Create the Log on as a service local group

Create a GPO and go to **Computer Configuration** > **Preferences** > **Control Panel Settings** > **Local Users and Computers**. Right-click and select **New** > **Local Group**.

Configure the local group as follows:

- Leave **Action** set to **Update**.
- Set **Group name** to `<LOCAL_PREFIX>-LogOnAsService`.
- Set the description to **Members of this group are granted the Logon as a Service permission on the local server**.
- Select **Delete all member users** and **Delete all member groups** so the preference item owns the membership of this local group.
- Under **Members**, click **Add...** and enter `%DomainName%\<DOMAIN_PREFIX>-%ComputerName%_LogonAsService`.

## Create the Log on as a batch job local group

Repeat the same process with these values:

- **Group name:** `<LOCAL_PREFIX>-LogOnAsBatch`
- **Description:** **Members of this group are granted the Logon as a Batch Job permission on the local server**
- **Member:** `%DomainName%\<DOMAIN_PREFIX>-%ComputerName%_LogonAsBatch`

Keep the **Update** action and the two membership-deletion options selected.

## Assign the user rights

In the same GPO, go to **Computer Configuration** > **Policies** > **Windows Settings** > **Security Settings** > **Local Policies** > **User Rights Assignment**.

Open **Log on as a service** and define the complete approved list from the inventory. The example adds `<LOCAL_PREFIX>-LogOnAsService` and `NT SERVICE\ALL SERVICES`; preserve any other principals required by the targeted server roles, then click **OK**.

Open **Log on as a batch job** and define its complete approved list. Add `<LOCAL_PREFIX>-LogOnAsBatch` to the inventory-derived principals. Do not copy the single-entry screenshot as a generic baseline: where required, retain principals such as Administrators, Backup Operators, Performance Log Users, application identities, and task-specific accounts. Click **OK** only after reconciling the full list.

## Pilot and verify the policy

Link the GPO only to the representative pilot OU or apply equally narrow security filtering, then use this staged procedure:

1. Run `gpupdate /force` on each pilot server and export `secedit` and `gpresult` again to new `after` files.
2. Compare `SeServiceLogonRight` and `SeBatchLogonRight` before and after. Confirm that every approved default, role-specific, service, and task principal remains present.
3. During a maintenance window, start or restart every affected service and manually run representative scheduled tasks. Check service state, Task Scheduler history, and the System and Security event logs for logon-right failures.
4. Test normal application, backup, monitoring, and management workflows. Keep an unlink or GPO-disable rollback ready and verify that rollback restores the previous effective assignments.
5. Move to the next deployment ring only after the pilot has passed its agreed observation period. Repeat the checks for each materially different server role before a broad OU link.

## Link the GPO and manage access

After the staged validation succeeds, link the GPO to broader target OUs in controlled rings. For each target device, create one or both of these domain groups, replacing `COMPUTERNAME` with the server name:

- `<DOMAIN_PREFIX>-COMPUTERNAME_LogonAsService`
- `<DOMAIN_PREFIX>-COMPUTERNAME_LogonAsBatch`

Add the relevant service or user accounts to the appropriate group. The GPO creates and maintains the local groups, maps the matching domain group based on the computer name, and assigns the user right to that local group.

## Result

The design replaces a growing set of server-specific GPOs with one GPO and per-server groups. It also creates a cleaner integration point for service-management or identity-governance workflows that grant and revoke **Log on as a service** or **Log on as a batch job** through approved requests.

Some IIS scenarios require additional policy settings when applications use an IIS application-pool identity, including certain Configuration Manager servers. Kenneth Van Surksum covers those edge cases in [Configuring Group Policies for your ConfigMgr servers](https://www.vansurksum.com/2014/01/11/configuring-group-policies-for-your-configmgr-servers/).
