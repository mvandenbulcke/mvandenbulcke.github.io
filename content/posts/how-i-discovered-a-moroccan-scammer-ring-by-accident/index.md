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
This blog post describes how I discovered a (currently inactive) Moroccan scammer ring. 

In 2021, I started looking for a short .com domain for a potential business in the future. After a lot of trying I finally landed on cotyx.com that was available and only 5 letters long! 

As any IT person, I added it to M365 and didn't think much more about it. 

In 2024, to optimize my expenditure and since I was closing my freelance company, I opted to host my emails on [Proton Mail](https://proton.me/mail) (not sponsored). Proton Mail has the ability for a catch-all address, so I set this up to get the most functionality out of the service.

Fast forward to 30 November 2024, I receive an email on asia@cotyx.com regarding the Terms and Community standards update from Instagram. I first thought this email was phishing, but after a closer look, it was a legit email. So, like any curious IT technician, I reset the password and login to to investigate.

{{< figure src="./image1.jpg">}}

I start going through the messages, and see quite a few interesting things.

{{< figure src="./image2.jpg">}}

They started their scam with a Shopify store on cotyx.com, where they would comment on their posts to contact them for a collab. Once the person contacts them, they would share a link for their ambassador program and how they could get a 50% discount on their purchase. At first I thought they were just dropshipping, something often done to scam people out of their money. But no, they didn't even ship the items. 

{{< figure src="./image3.jpg">}}

Some people managed to file fraud claims with their bank to get their money back.

{{< figure src="./image4.jpg">}}

Others weren't as lucky. 

{{< figure src="./image5.jpg">}}

Some noticed it was a scam.

{{< figure src="./image6.jpg">}}

But no morals were to be found, as they even tried scamming a 13 year old.

{{< figure src="./image7.jpg">}}
{{< figure src="./image8.jpg">}}

After going through a few messages, I've noticed a group chat between several of the scammers their account. 

{{< figure src="./image9.jpg">}}

And when we check the members, we can see that @advicetify is the admin of the group. 

{{< figure src="./image10.jpg">}}

In some other chats, we can see that they shared each other updated communication templates.

{{< figure src="./image11.jpg">}}
{{< figure src="./image12.jpg">}}
{{< figure src="./image13.jpg">}}
{{< figure src="./image14.jpg">}}

But there is also a chat with the admin of the group I've shown earlier. Whenever a new order came in, the admin informed the person managing the account I seized. So it's safe to assume that multiple people are involved here, with @advicetify being the leader of the scam ring. 

{{< figure src="./image15.jpg">}}
{{< figure src="./image16.jpg">}}
{{< figure src="./image17.jpg">}}
{{< figure src="./image18.jpg">}}
{{< figure src="./image19.jpg">}}

So, let's take a closer look at the @advicetify account. 

{{< figure src="./image20.jpg">}}

We see that it has 2 URLs linked in the bio. 

{{< figure src="./image21.jpg">}}

When checking the websites, we see 2 similar looking websites. 

{{< figure src="./image22.jpg">}}
{{< figure src="./image23.jpg">}}

When we go to the bottom of prodtify.com, we can see that there is an ICE (Identifiant Commun de l'Entreprise) code which seems to be the business number of the website. 

{{< figure src="./image24.jpg">}}

When we google this ICE code, we find another website with a similar looking template. 

{{< figure src="./image25.jpg">}}
{{< figure src="./image26.jpg">}}

And it seems that these 3 sites are created by the same company. 

{{< figure src="./image27.jpg">}}

When we scroll down a bit, we see the CEO of this company. 

{{< figure src="./image28.jpg">}}

With a link to LinkedIn. 

{{< figure src="./image29.jpg">}}

The curious part is, the @advicetify follows the @photographe_agadir account on Instagram, both of which are owned by Mohamed El khadir.

Since we don't have any more concrete answers, I'm stuck with the following unanswered questions:

Did Mohamed own the accounts from the beginning or did he buy/receive them from someone else?
If Mohamed owns prodtify, why is it sharing an ICE number with nomfilms?
When checking LinkedIn, one employee is both active for Smart Soluce and Nomfilms, but all his social links on the Smart Soluce website go to nowhere. How is he involved in all of this? 

The only certainty we have is that Mohamed knows our scammers. The phone numbers and the IPs involved, all trangulate the scam ring to Morocco in a town called Agadir. 