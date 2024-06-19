---
title: "Add printers based on IP octet"
date: 2024-04-28T12:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["PowerShell"]
author: "Michaël Vandenbulcke"
# author: ["Me", "You"] # multiple authors
showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
description: "In this post I will share how you can add printers based on IP octet."
disableHLJS: true # to disable highlightjs
disableShare: false
disableHLJS: false
hideSummary: false
searchHidden: true
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
cover:
    image: "<image path/url>" # image path/url
    alt: "<alt text>" # alt text
    caption: "<text>" # display caption under cover
    relative: false # when using page bundles set this to true
    hidden: true # only hide on current single page
#editPost:
#    URL: "https://github.com/<path_to_repo>/content"
#    Text: "Suggest Changes" # edit text
#    appendFilePath: true # to append file path to Edit link
---
At a previous company I worked at, we managed over 60+ sites, each with a dedicated /24 subnet and a preconfigured printer on a print server. The challenge was to automatically add the local printer and move printers from other sites when users traveled between sites. Initially, I used a heavily modified VBS script from a friend to address this issue. Although this solution worked, it was slow over 300 lines long.

Unsatisfied with leaving behind a slow and cumbersome script, I recently rewrote it in PowerShell with some scripting help from ChatGPT. The new version is more efficient and significantly smaller. Below is the improved script.

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