---
title: "Removing the ISP (Proximus) modem for a FTTH connection"
date: 2024-04-02T12:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["Ubiquiti","Unifi"]
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
After a very painful installation process to get Proximus Ultra Fiber (8.5Gbps down/1.5Gbps up) I decided to remove the Proximus modem between my UDM-SE and the ONTP.

According to the [Proximus documentation](https://www.proximus.be/support/en/id_sfaqr_router_install/personal/support/internet/internet-at-home/advanced-settings/configure-your-private-router-as-a-wireless-router.html), for an FFTH installation this can be done by using VLAN 20 on the WAN port of the UDM-SE. We can configure this by navigating to **Settings** -> **Internet** -> **Primary (WAN 1)**. Under advanced, we need to select **Manual** and check the box next to **VLAN ID**. We enter VLAN **20** as defined in the the documentation.

{{< figure src="./image-1.png">}}

In the **IPv4 Configuration** part we select **DHCPv4** and set the **DNS Server** to **Auto** as we’re using **DNS Shield** feature.
In the **IPv6 Configuration** part we select **SLAAC**, configure the **Prefix Delegation Size** as **56** and set the **DNS Server** to **Auto** as we’re using **DNS Shield** feature.

{{< figure src="./image-2.png">}}

Navigating to **Settings** -> **Security** we can configure the **DNS Shield**. I have it currently on **Auto** but you can also select static DNS over HTTPS providers by switching it to **Manual**. (due to a weird issue with YouTube history not being saved on mobile devices with the Ad Blocking feature, this feature is currently disabled for me.)

{{< figure src="./image-3.png">}}

To configure IPv6 in your local VLAN, you can navigate to **Settings** -> **Networks** -> the VLAN you wish to modify. You select IPv6 and you can select **Prefix Delegation** and select **Primary (WAN1)** as the **Prefix Delegation Interface**. In the **Advanced** section, leave it on **Auto** and it should work now.

{{< figure src="./image-4.png">}}

To allow IPv6 in the firewall. Create a new rule with the following settings:
**Type**: Internet v6 In
**Name**: Allow router advertisements
**Action**: Accept
**Protocol**: ICMPv6 and check Before Predefined
**Match Opposite**: check

{{< figure src="./image-5.png">}}

Now we [verify](https://test-ipv6.com/mirrors.html.en_US) if IPv6 works and looking at the below picture, this looks to be working fine.

{{< figure src="./image-6.webp">}}