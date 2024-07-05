---
title: "Azure Site Recovery: migration to modernized VMware replication"
date: 2024-07-04T12:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["Azure Site Recovery"]
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
I was recently busy migrating a customer from the classic ASR vault to the modernized ASR vault. However, during the process I ran into an issue. This post is to explain the issue and how you can easily resolve it yourself. In my scenario, I already deployed modern vault in Azure with a new ASR appliance. 

In your classic ASR vault, navigate to replicated items and click on **Upgrade to modernized VMware replication**.
{{< figure src="./image1.png">}}

Make sure you meet the prerequisites and click on **Next**.
{{< figure src="./image2.png">}}

Select the vault, select the machines you want to move. In my case, it seems that I can't select the VMs because of the message **"Source agent driver version is not supported."**.
{{< figure src="./image3.png">}}

This is weird, considering I upgraded all the clients last week. You can even see it in the below screenshot, that we're running version 9.61, which is the latest version as of taking the screenshot.
{{< figure src="./image4.png">}}

So what gives? Turns out, the VMs simply need to reboot after the agent upgrade. So, we schedule a reboot overnight and try again the next morning and now we can select our VMs.
{{< figure src="./image5.png">}}

Next we select our appliance and click **Next**.
{{< figure src="./image6.png">}}

And our VMs are now migrating to the new ASR vault and ASR appliance. 
{{< figure src="./image7.png">}}

This was a short and easy problem to solve. 