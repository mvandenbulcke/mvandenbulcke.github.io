---
title: "How I discovered a Moroccan scammer ring by accident"
date: 2024-12-01T01:00:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["OSINT"]
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
This blog post describes how I discovered a (currently inactive) Moroccan scam ring. 

In 2021, I started looking for a short .com domain for a potential business in the future. After a lot searching I finally landed on cotyx.com that was available and only 5 letters long! 

As any IT person would, I added it to M365 and didn't think much more about it. 

In 2024, to optimize my expenditure, and since I was closing my freelance company. I opted to host my emails on [Proton Mail](https://proton.me/mail) (not sponsored). Proton Mail has the ability for a catch-all address, so I set this up to get the most functionality out of the service.

Fast forward to 30 November 2024, I received an email on asia@cotyx.com regarding the Terms and Community standards update from Instagram. Weird, I never configured this myself? My first instinct was that this was phishing, but after a closer look, it was a legit email. So, like any curious IT technician, I reset the password and login to to investigate.

{{< figure src="./image.jpg#center" height="540">}}

I start going through the messages, and see quite a few interesting things.

{{< figure src="./image2.jpg#center" height="540">}}

It seems they started their scam with a Shopify store on cotyx.com, where they would comment on people their posts to contact them for a collab. Once the person contacts them, they would share a link for their ambassador program and how they could get a 50% discount on their purchase to receive free products in the future. At first, I thought they were just dropshipping, something often done to steal money from the populace while adding no value. But as you can see further below, they did not even ship any products. 

{{< figure src="./image3.jpg#center" height="540">}}

Some people managed to file fraud claims with their bank to get their money back.

{{< figure src="./image4.jpg#center" height="540">}}

But, others weren't as lucky. 

{{< figure src="./image5.jpg#center" height="540">}}

Some did notice it was a scam.

{{< figure src="./image6.jpg#center" height="540">}}

But no morals were to be found, as they even tried to scam a 13 year old girl. 

{{< figure src="./image7.jpg#center" height="540">}}
{{< figure src="./image8.jpg#center" height="540">}}

After going through a few messages, I've noticed a group-chat between several scammer accounts. 

{{< figure src="./image9.jpg#center" height="540">}}

And when we check the members, we can see that @advicetify is the admin of this group. 

{{< figure src="./image10.jpg#center" height="540">}}

In some other chats, we can see that they're sharing communication templates with each other. 

{{< figure src="./image11.jpg#center" height="540">}}
{{< figure src="./image12.jpg#center" height="540">}}
{{< figure src="./image13.jpg#center" height="540">}}
{{< figure src="./image14.jpg#center" height="540">}}

But there is also a chat with the admin of the group I've shown earlier. Whenever a new order came in, the admin informed the person managing the account I seized. So it's safe to assume that multiple people are involved in this operation, with @advicetify being the leader of the scam ring or at least having control of the Shopify stores and the money flowing in. 

{{< figure src="./image15.jpg#center" height="540">}}
{{< figure src="./image16.jpg#center" height="540">}}
{{< figure src="./image17.jpg#center" height="540">}}
{{< figure src="./image18.jpg#center" height="540">}}
{{< figure src="./image19.jpg#center" height="540">}}

So, let's take a closer look at the @advicetify account. 

{{< figure src="./image20.jpg#center" height="540">}}

We can see that it has 2 URLs linked in the bio. 

{{< figure src="./image21.jpg#center" height="540">}}

When checking the websites, we see 2 websites build with a similar template. 

{{< figure src="./image22.jpg#center" height="540">}}
{{< figure src="./image23.jpg#center" height="540">}}

When we go to the bottom of prodtify.com, we can see that there is an ICE (Identifiant Commun de l'Entreprise) code which seems to be the business number of this company. 

{{< figure src="./image24.jpg#center" height="540">}}

When we google this ICE code, we find another website with a similar looking template. 

{{< figure src="./image25.jpg#center" height="540">}}
{{< figure src="./image26.jpg#center" height="540">}}

And it seems that these 3 sites are created by the same company. 

{{< figure src="./image27.jpg#center" height="540">}}

When we scroll down a bit, we see the CEO of this company. 

{{< figure src="./image28.jpg#center" height="540">}}

With a link to LinkedIn. 

{{< figure src="./image29.jpg#center" height="540">}} 

The curious part is, the @advicetify follows the @photographe_agadir account on Instagram, both of which are owned by Mohamed El khadir and even uses it to comment on his own posts.

{{< figure src="./image30.png#center">}}

And currently the following facts are certain, the scams originated from a town called Agadir in Morocco, and that Mohamed either knows our scammers, or is part of the scammers. 

I've send an email to Mohamed asking for comments based on a screenshot of the conversation with the @advicetify account, and I'm currently pending a response. 
