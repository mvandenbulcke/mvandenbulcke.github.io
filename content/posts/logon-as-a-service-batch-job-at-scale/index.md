---
title: "Logon as a Service/Batch Job at scale"
date: 2024-04-10T12:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["GPO",""]
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
Recently at a customer there was an issue with a GPO and a service that couldn’t start due to User Rights Assignments being configured wrong. They were using a GPO per server to define this, but using a GPO per server isn’t very scalable and friendly to manage. The solution? Group policy preferences!

We start by creating a GPO and navigating to **Computer Configuration** -> **Preferences** -> **Control Panel Settings** -> **Local Users and Computers**. We right click and select **New** -> **Local Group**.

{{< figure src="./image-1.png">}}

We leave the action as **Update**.
We give the group a name, in our case we name it **CLADM-LogOnAsService**.
We give the group a description, in our case we use the following description: **Members of this group are granted the Logon as a Service permission on the local server**.
Because we don’t want rogue permissions, we will check the boxes to **Delete all member users and Groups**.
In the **Members** section, we click on **Add..** and enter **%DomainName%\GGADM-%ComputerName%_LogonAsService**.

{{< figure src="./image-2.png">}}

{{< figure src="./image-3.png">}}

We repeat the same steps but use **CLADM-LogOnAsBatch** this time with the description **Members of this group are granted the Logon as a Batch Job permission on the local server**. and under Add Members we use **%DomainName%\GGADM-%ComputerName%_LogonAsBatch** instead.

{{< figure src="./image-4.png">}}

{{< figure src="./image-5.png">}}

Now we navigate to **Computer Configuration** -> **Policies** -> **Security Settings** -> **Local Policies** -> **User Rights Assignment**.
Here we will add **CLADM-LogOnAsService** and **NT SERVICE\ALL SERVICES** to **Log on as a service** policy settings and click **OK**.

{{< figure src="./image-6.png">}}

And we add **CLADM-LogOnAsBatch** to **Log on as a batch job** policy settings and click **OK**.

{{< figure src="./image-7.png">}}

Now all that’s left is linking the GPO in the OU where you want this dynamic system to apply and creating the groups **GGADM-COMPUTERNAME_LogonAsService** and/or **GGADM-COMPUTERNAME_LogonAsBatch** for the specific devices and adding the (service) accounts as members.

In the scenario of my customer, this will replace 50 GPOs by 1 GPO and replace it with 50 groups. And even allowing it to be integrated with Service-Now/SailPoint to automate the process of granting and revoking Logon as a Service/Batch Job permissions with request items.

It might be possible that some additional GPOs might be needed for scenarios that have an IIS server and you're using the IIS App Pool identity such as ConfigMgr servers. Kenneth Van Surksum on [Modern Workplace Blog](https://www.vansurksum.com/2014/01/11/configuring-group-policies-for-your-configmgr-servers/) goes deeper on how to apply the settings in the GPO for these edge cases. 