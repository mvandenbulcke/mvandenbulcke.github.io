---
title: "Deploy a Site Printer from an IP Octet with PowerShell"
date: 2024-03-28T12:00:03+00:00
lastmod: 2026-07-10T00:00:00Z
description: "A compact PowerShell script that maps a client's third IPv4 octet to the correct site printer on a central print server."
summary: "Replace a slow 300-line VBScript with a focused PowerShell workflow for users who move between consistently addressed sites."
tags: ["PowerShell", "Printing", "Automation"]
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

A distributed environment used a dedicated `/24` subnet for each site and a matching queue on a central print server. Users regularly moved between locations, so their local printer needed to follow them.

## The problem

The deployment logic was straightforward: remove printers from other sites, identify the user's current subnet, and add the matching printer. An inherited VBScript handled this initially, but it was slow and had grown difficult to maintain.

Rewriting the workflow in PowerShell produced a considerably smaller and easier-to-follow solution.

## How the mapping works

The script:

1. removes existing printers whose names match the configured prefix;
2. finds the first DHCP-assigned IPv4 address on an adapter whose name contains `Ethernet` or `Wi-Fi`;
3. extracts the third octet from that address;
4. builds a printer name in the form `PREFIX-<third octet>`; and
5. adds that shared printer from `\\PRINTSERVER`.

This approach depends on the addressing and naming convention being consistent across every site. If a computer has several matching adapters, the script uses the first address returned. Adjust the selection logic if that is not reliable in your environment.

> **Warning:** The first command removes every installed printer whose name matches `*PREFIX*`, before the script checks whether it can find a new printer. Replace both placeholders and test the removal pattern on a non-production device before deployment.

## The script

```PowerShell
#Remove printers
Get-Printer -Name "*PREFIX*" | Remove-Printer
 
# Get the IPv4 address of the active Ethernet or Wi-Fi network adapter that received its IP from DHCP
$ipAddress = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Ethernet|Wi-Fi' -and $_.PrefixOrigin -eq 'Dhcp' } | Select-Object -First 1 -ExpandProperty IPAddress
 
if ($ipAddress) {
    Write-Output "Your DHCP-assigned IP Address is: $ipAddress"
    # Split the IP address into its octets
    $octets = $ipAddress -split '\.'
    # Extract the third octet
    $thirdOctet = $octets[2]
    # Dynamically construct the printer name
    $printerName = "PREFIX-$thirdOctet"
    # Construct the connection name
    $connectionName = "\\PRINTSERVER\" + $printerName
    Write-Output "Attempting to add printer: $connectionName"
    Add-Printer -ConnectionName $connectionName
} else {
    Write-Output "IP Address could not be found."
    }
```

For the environment it was designed for, this replaced a cumbersome legacy script with a concise mapping between the site's `/24` subnet and its preconfigured print queue. The same pattern is useful anywhere the network plan and resource names share a dependable numeric key.
