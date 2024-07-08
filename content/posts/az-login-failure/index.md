---
title: "Azure Site Recovery: migration to modernized VMware replication"
date: 2024-07-08T12:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["Azure","PowerShell"]
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
Today I started my journey on learning terraform. During the Azure login process in Powershell, I ran into the following error:

```
User cancelled the Accounts Control Operation.. Status: Response_Status.Status_UserCanceled, Error code: 0, Tag: 528315210
```

{{< figure src="./image1.png">}}

I've never had this issue before, so I was a bit puzzled. It seems that since version [2.61.0](https://learn.microsoft.com/en-us/cli/azure/release-notes-azure-cli#may-21-2024), that the Web Account Manager (WAM) is now the default authentication method. Luckily we can bypass the WAM using PowerShell and proceed to login. 

In this case it was an easy fix.

```PowerShell
az account clear
az config set core.enable_broker_on_windows=false
az login
```

{{< figure src="./image2.png">}}

And now we're logged in, and we can continue our Terraform journey. 