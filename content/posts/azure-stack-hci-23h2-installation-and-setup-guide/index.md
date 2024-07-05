---
title: "Azure Stack HCI 23H2: Installation and Setup Guide"
date: 2024-05-14T12:00:03+00:00
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
Navigate to the Azure portal -> Azure Arc -> Azure Stack HCI and click on **Download Azure Stack HCI**.

{{< figure src="./image-1.png">}}

Select the version, in this case we will go with the latest version and we agree to the terms and proceed to click on **Download Azure Stack HCI**.

{{< figure src="./image-2.webp">}}

Flash the ISO on a USB device using rufus or a similar program, plug it into the server and enter the button to enter the boot menu. On this Supermicro server this is with **F11**.

{{< figure src="./image-3.webp">}}

Select the USB device and hit enter.

{{< figure src="./image-4.png">}}

Select the language, time and keyboard input and click on **Next**.

{{< figure src="./image-5.png">}}

Click on **Install now**.

{{< figure src="./image-6.png">}}

Agree with the terms and click on **Next**.

{{< figure src="./image-7.webp">}}

Select **Custom**.

{{< figure src="./image-8.png">}}

Select the drive you with to use to boot and click on **Next**. (because I have a RAID controller in JBOD mode, the full drive size isn’t displayed for drive 0 and drive 1)

{{< figure src="./image-9.webp">}}

Azure Stack HCI will now proceed to install.

{{< figure src="./image-10.webp">}}

After the server has installed and rebooted, you now need to set a password. Make sure to use the same password on all of your nodes.

{{< figure src="./image-11.png">}}

Enter the password twice, make sure the password follows the Azure guidelines.

{{< figure src="./image-12.webp">}}

Now the password has been changed, hit enter to proceed.

{{< figure src="./image-13.png">}}

We will start by setting the computer name by entering 2 and hitting enter.

{{< figure src="./image-14.webp">}}

Enter the name and hit enter.

{{< figure src="./image-15.png">}}

You will be prompted to reboot, but we can do this at a later stage. Enter **N** and hit enter.

{{< figure src="./image-16.png">}}

We will now enable remote desktop temporarily. Enter **7** and hit enter.

{{< figure src="./image-17.png">}}

Enter **E** and hit enter.

{{< figure src="./image-18.png">}}

Enter **1** and hit enter.

{{< figure src="./image-19.png">}}

Remote desktop will now be enabled. Hit enter to continue.

{{< figure src="./image-20.png">}}

We will now configure the static IP which is required by Azure Stack HCI. Enter **8** and hit enter.

{{< figure src="./image-21.png">}}

Select the NIC you want to configure the static IP on, in my case this is number 5.

{{< figure src="./image-22.png">}}

We will first set the static DNS server(s) by entering 2.

{{< figure src="./image-23.png">}}

Enter the IP of the DNS server and hit enter.

{{< figure src="./image-24.png">}}

Enter the IP of the second DNS server or leave blank if you don’t have one.

{{< figure src="./image-25.png">}}

Now navigate back to the menu of the adapter and enter 1.

{{< figure src="./image-26.png">}}

Enter the static IP, the subnet mask and the gateway and hit enter.

{{< figure src="./image-27.png">}}

Now enter 6 to patch the nodes.

{{< figure src="./image-28.webp">}}

Enter 1 to perform all quality updates.

{{< figure src="./image-29.webp">}}

The node will now search for updates.

{{< figure src="./image-30.png">}}

Enter A to start installing all the updates.

{{< figure src="./image-31.webp">}}

The updates are now being installed. Enter **Y** to reboot.

{{< figure src="./image-32.webp">}}

After the server is back up and you entered it using remote desktop, enter PowerShell by entering number 15.

{{< figure src="./image-33.webp">}}

Temporarily disable the firewall by entering the command:

```CMD
netsh advfirewall set allprofiles state off
```

{{< figure src="./image-34.png">}}

We will now copy the drivers to the nodes using SMB.

{{< figure src="./image-35.webp">}}

Enter the following commands to start the install of the Intel NIC drivers.
```PowerShell
cd "C:\temp\Intel NIC"
.\Autorun.exe
```

{{< figure src="./image-36.webp">}}

Follow the steps in the wizard to install the drivers.

{{< figure src="./image-37.png">}}

Enter the following command to install the driver of the RAID controller.

```PowerShell
pnputil.exe -i -a "C:\Temp\MR_WIndows Driver-07.727.03.00\Win2022_Server_LTSC_x64\megasas35.inf"
```

{{< figure src="./image-38.png">}}

We will now install the Hyper-V role using the command below or we will receive later on the error you see in the below screenshot:
```PowerShell
Enable-WindowsOptionalFeature -Online -FeatureName  Microsoft-Hyper-V -All
```

{{< figure src="./image-39.webp">}}

We will now list all the network adapters using the below command:
```PowerShell
Get-NetAdapter
```

{{< figure src="./image-40.png">}}

We will rename the 25Gbps adapters to Storage 1 and Storage 2 using the following command:
```PowerShell
Rename-NetAdapter -Name "Ethernet 6" -NewName "Storage1"
Rename-NetAdapter -Name "Ethernet 7" -NewName "Storage2"
```

{{< figure src="./image-41.png">}}

We will rename the 1Gbps I350 adapters to Backup 1 and Backup 2 using the following command:
```PowerShell
Rename-NetAdapter -Name "Ethernet 2" -NewName "Backup1"
Rename-NetAdapter -Name "Ethernet 4" -NewName "Backup2"
```

{{< figure src="./image-42.png">}}

And finally we rename the 1Gbps I210 adapters to Compute 1 and Compute 2 using the following command:
```PowerShell
Rename-NetAdapter -Name "Ethernet 3" -NewName "Compute1"
Rename-NetAdapter -Name "Ethernet 4" -NewName "Compute2"
```

Please note that in the screenshot it says Management1 and Management2, but this is because in this scenario we will combine compute and management traffic.

We will now register the nodes to Azure Arc. We start by executing the following command:

```PowerShell
Register-PSRepository -Default -InstallationPolicy Trusted
```

{{< figure src="./image-43.png">}}

We will now install the required modules.
```PowerShell
#Install Arc registration script from PSGallery 
Install-Module AzsHCI.ARCinstaller
 
#Install required PowerShell modules in your node for registration
Install-Module Az.Accounts -Force
Install-Module Az.ConnectedMachine -Force
Install-Module Az.Resources -Force
```

{{< figure src="./image-44.png">}}

We will now connect the nodes to Azure, make sure to replace the variables with your own.
```PowerShell
#Define the subscription where you want to register your server as Arc device
$Subscription = "SUBSCRIPTIONID"
 
#Define the resource group where you want to register your server as Arc device
$RG = "RESOURCEGROUPNAME"
 
#Define the region you will use to register your server as Arc device
$Region = "westeurope"
 
#Define the tenant you will use to register your server as Arc device
$Tenant = "TENANTID"
  
  
#Connect to your Azure account and Subscription
Connect-AzAccount -SubscriptionId $Subscription -TenantId $Tenant -DeviceCode
```

{{< figure src="./image-45.webp">}}

We will now enroll the nodes into Arc.

```PowerShell
#Get the Access Token for the registration
$ARMtoken = (Get-AzAccessToken).Token
 
#Get the Account ID for the registration
$id = (Get-AzContext).Account.Id
 
#Invoke the registration script. Use a supported region.
Invoke-AzStackHciArcInitialization -SubscriptionID $Subscription -ResourceGroup $RG -TenantID $Tenant -Region $Region -Cloud "AzureCloud" -ArmAccessToken $ARMtoken -AccountID $id
```

{{< figure src="./image-46.png">}}

It will take several minutes and then we will see the nodes show up in Azure Arc on the Azure portal.

{{< figure src="./image-47.webp">}}

Here we will need to enter the nodes and check the status of the extensions.

{{< figure src="./image-48.png">}}

Once the 4 extensions are in status Succeeded, we can proceed on creating the cluster.

{{< figure src="./image-49.png">}}

Lets prepare the OU where the nodes will be AD joined by blocking GPO inheritance.

{{< figure src="./image-50.png">}}

We will now go back to the Azure portal and select **Deploy cluster**.

{{< figure src="./image-51.webp">}}

We will fill in the information required for our cluster, select the resource group where the Azure Stack HCI nodes are located and select **Validate selected servers** and click on **Next**.

{{< figure src="./image-51.png">}}

Under Configuration, we will select **New configuration** and click on **Next**.

{{< figure src="./image-52.png">}}

Because we have a 2-node switchless cluster we will select **No switch for storage**.

{{< figure src="./image-53.png">}}

At the bottom of the page we will select the adapters for the traffic type and continue down.

{{< figure src="./image-54.png">}}

We will now enter the IP information for our Azure Arc services and click **Next**.

{{< figure src="./image-55.png">}}

We will now enter the information to AD join the cluster and click on **Next**.

{{< figure src="./image-56.png">}}

We stick with the recommended security settings and click on **Next**.

{{< figure src="./image-57.png">}}

Under Advanced we leave the default and click on **Next**.

{{< figure src="./image-58.png">}}

Under Tags we create the mandatory Tags and click on **Next**.

{{< figure src="./image-59.png">}}

Azure will now validate if the cluster objects are created.

{{< figure src="./image-60.png">}}

We can now click on **Start validation** and Azure will start validating the cluster.

{{< figure src="./image-61.png">}}

Once this is done you can click on **Review + Create** and the cluster will be deployed.

{{< figure src="./image-62.webp">}}

In AD we can see that the cluster is now being domain joined and that a failover object is created in the OU.

{{< figure src="./image-63.png">}}

And we can now see that the cluster is deployed succesfully.

{{< figure src="./image-64.webp">}}