---
title: "Azure Powershell: User cancelled the Accounts Control Operation"
date: 2024-10-14T12:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["Windows Server","Hybrid Joined"]
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
At my customer, we had 1 Windows Server with quite a slow login process. The screen would be stuck on "Other User" for about 2-3 minutes every time a new user tried to login or unlock the locked account. 

{{< figure src="./image1.png">}}

After checking a few things, we noticed that the server is Hybrid AD joined. 

```PowerShell
dsregcmd /status
```

{{< figure src="./image2.png">}}

We have the server leave the Hybrid AD join with the below command.

```PowerShell
dsregcmd /leave
```

And when we check the status now, the server is no longer Hybrid joined and the login process is faster.

{{< figure src="./image3.png">}}

So what happened, that caused a slow login process with only this server? It seems there was a security incident at the provider that manages the application on this server, and that our security department decided to block all connections from this server. Meaning, that the server couldn't reach the Microsoft services anymore to perform the authentication, and it took an incredible amount of time before it switched over to local domain authentication.