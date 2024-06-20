---
title: "Deploy Dell BIOS settings and unique per device BIOS passwords using Intune"
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
It seems that Dell now has a [specific version of command configure that’s used for Intune](https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=T88X8). But why would we want to use it? Because it supports some neat features like an unique per device BIOS password that is managed by Intune.

Download [Dell Command | Configure Application](https://www.dell.com/support/home/en-us/drivers/DriversDetails?driverId=TJ7VC) and configure your desired BIOS settings. Click on Export config and save the CCTK file.

{{< figure src="./image-1.webp" clicktozoom="true">}}

1. Open the [Microsoft Intune admin center portal](https://intune.microsoft.com/) and navigate to Devices -> Configuration.
2. On the Devices | Configuration page, click Create -> New policy.
3. On the **Create a profile page**, provide the following information and click Create.
- **Platform: Select Windows 10 and later** as value
- **Profile type**: Select **Templates** as value
- **Template name**: Select **BIOS configurations and other settings** as value
4. On the **Basics** page, provide a **Name** and click next.
5. On the **Configurations** page, click the **Hardware** dropdown -> Dell
6. In the **Configuration file**, upload the **CCTK file** you created earlier.

{{< figure src="./image-2.png" clicktozoom="true">}}

We will now create the [Dell Command | Endpoint Configure for Microsoft Intune](https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=T88X8) Win32 app.

Download the file and click on **Extract**.

{{< figure src="./image-3.png" clicktozoom="true">}}

Select a folder (In my case this is C:\Temp\Dell) and click on **OK**.

We will now package the file for Intune by using the IntuneWinAppUtil.exe. The bellow command can be used for this:

```CMD
C:\Temp\IntuneWinAppUtil.exe -c C:\Temp\Dell -s DCECMI.msi -o C:\Temp
```

We now have the **DCECMI.intunewin** file in the C:\Temp folder that we can upload to Intune.

1. Open the [Microsoft Intune admin center portal](https://intune.microsoft.com/) and navigate to **Apps**-> **Windows**.
2. On the Windows | Windows apps page, click **Add** -> **Windows app (Win32)**.
3. On the **App information page**, select the **DCECMI.intunewin** file and click on **OK**.
4. You will notice that a lot of information is prefilled. Simply add the Publisher name and click on **Next**.
5. On the **Program page**, click **Next**.
6. On the **Requirements page**, select the mandatory options according to your requirements for your situation and click **Next**.
7. On the **Detection rules page**, select **Manually configure detection rules** and click on **Add**.
8. Select **MSI** and click on **OK** and click on **Next**.
9. On the **Dependencies page**, click **Next**.
10. On the **Supersedence page**, click **Next**.
11. Assign it to the necessary groups (considering this is about Dell devices, ideally a group with only Dell devices) and click on **Next**.
12. And as the final step, you click on **Create**.

{{< figure src="./image-4.webp">}}

We can now force a sync in the Company portal on a Dell device. After a reboot, the device now has a BIOS password that I configured earlier in the CCTK. Now when we navigate to the [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer). We can check the BIOS password for the device. First we start by granting consent for the following scopes:

- **DeviceManagementConfiguration.Read.All**
- **DeviceManagementConfiguration.ReadWrite.All**
- **DeviceManagementManagedDevices.PrivilegedOperations.All**

We can do this by adding the URL https://graph.microsoft.com/beta/deviceManagement/hardwarePasswordInfo with -scope after the URL and click on “Open the Permissions panel”

{{< figure src="./image-6.webp" clicktozoom="true">}}

And we search for the different scopes and click on consent.

{{< figure src="./image-7.png" clicktozoom="true">}}

{{< figure src="./image-8.png" clicktozoom="true">}}

{{< figure src="./image-9.png" clicktozoom="true">}}

After this we remove the -scope from the URL and request our password. You can see that we receive the passwords for all the devices.

{{< figure src="./image-10.webp" clicktozoom="true">}}

If you want to filter it for a specific device, you can use a filter in the URL to filter for a specific device. https://graph.microsoft.com/beta/deviceManagement/hardwarePasswordInfo?$filter=serialNumber eq ‘SERIALNUMBER’ where you replace SERIALNUMBER with the serial number of the device.

{{< figure src="./image-11.webp" clicktozoom="true">}}

And that’s about it.

For more information you can read the following sources:

[Dell Command | Endpoint Configure for Microsoft Intune User’s Guide](https://dl.dell.com/content/manual52878209-dell-command-endpoint-configure-for-microsoft-intune-user-s-guide.pdf?language=en-us)
[Update Windows BIOS using configuration MDM policy | Microsoft Learn](https://learn.microsoft.com/en-us/mem/intune/configuration/bios-configuration)