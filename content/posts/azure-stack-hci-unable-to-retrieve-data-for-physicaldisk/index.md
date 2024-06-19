---
title: "Azure Stack HCI: Unable to retrieve data for PhysicalDisk"
date: 2024-03-28T12:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["Azure Stack HCI"]
author: "Michaël Vandenbulcke"
# author: ["Me", "You"] # multiple authors
showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
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
During the prerequisite check of Azure Stack HCI I came across an odd error related to the storage. I had the minimum requirements of 2 NVMe drives, an RAID card in JBOD mode.

```
Type 'ValidateHardware' of Role 'EnvironmentValidator' raised an exception: Hardware requirements not met.
Review output and remediate:
Rule:
    HealthCheckSource : Deployment\Hardware\3bc73c2f
    Name : AzStackHci_Hardware_Test_PhysicalDisk
    DisplayName : Test PhysicalDisk API SERVERNAME1
    Tags : {}
    Title : Test PhysicalDisk API
    Status : FAILURE
    Severity : CRITICAL
    Description : Checking PhysicalDisk has CIM data
    Remediation : https://learn.microsoft.com/en-us/azure-stack/hci/deploy/deployment-tool-prerequisites
    TargetResourceID : Machine: SERVERNAME1, Class: PhysicalDisk
    TargetResourceName : Machine: SERVERNAME1, Class: PhysicalDisk
    TargetResourceType : PhysicalDisk
    Timestamp : 20/03/2024 15:40:33
    AdditionalData:
        Key : Detail
        Value : Unable to retrieve data for PhysicalDisk on SERVERNAME1
        Key : Status
        Value : FAILURE
        Key : TimeStamp
        Value : 03/20/2024 15:40:33
        Key : Resource
        Value : Null
        Key : Source
        Value : SERVERNAME1 
Rule:
    HealthCheckSource : Deployment\Hardware\3bc73c2f
    Name : AzStackHci_Hardware_Test_PhysicalDisk
    DisplayName : Test PhysicalDisk API SERVERNAME2
    Tags : {}
    Title : Test PhysicalDisk API
    Status : FAILURE
    Severity : CRITICAL
    Description : Checking PhysicalDisk has CIM data
    Remediation : https://learn.microsoft.com/en-us/azure-stack/hci/deploy/deployment-tool-prerequisites
    TargetResourceID : Machine: SERVERNAME2, Class: PhysicalDisk
    TargetResourceName : Machine: SERVERNAME2, Class: PhysicalDisk
    TargetResourceType : PhysicalDisk
    Timestamp : 20/03/2024 15:40:33
    AdditionalData:
        Key : Detail
        Value : Unable to retrieve data for PhysicalDisk on SERVERNAME2
        Key : Status
        Value : FAILURE
        Key : TimeStamp
        Value : 03/20/2024 15:40:33
        Key : Resource
        Value : Null
        Key : Source
        Value : SERVERNAME2 
    
[... CLR exception truncated]
```

Now this error in the end doesn’t say much. When we take a look in C:\Program Files\WindowsPowerShell\Modules\AzStackHci.EnvironmentChecker\AzStackHciHardware\AzStackHci.Hardware.Helpers.psm1 we can see that Test-PhysicalDisk is looking for.

```PowerShell
$allowedBusTypes = @('SATA', 'SAS', 'NVMe', 'SCM')
$allowedMediaTypes = @('HDD', 'SSD', 'SCM')
```

And by executing get-PhysicalDisk | select Number,FriendlyName,MediaType,BusType on the node we find our clue.

{{< figure src="./image.png" alt="A picture showing the PowerShell output of get-PhysicalDisk.">}}

Despite the RAID controller being in JBOD mode, it’s still reporting the BusType to Windows as RAID. Luckily this was an easy fix in this situation as it was solved by downloading the Windows drivers from the RAID controller on the Super Micro site and installing them. After a quick install using pnputil.exe, you can now see that the BusType is reporting as SAS.

{{< figure src="./image-1.png" alt="A picture showing the installation of the SAS controller driver.">}}

And now the validation in the Azure portal succeeded.

{{< figure src="./image-2.png" alt="A picture showing the succesful validation in the Azure portal.">}}