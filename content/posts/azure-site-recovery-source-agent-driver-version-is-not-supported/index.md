---
title: "Fix 'Source Agent Driver Version Is Not Supported' in Azure Site Recovery"
date: 2024-07-04T12:00:03+00:00
lastmod: 2026-07-10T00:00:00Z
description: "Resolve the source agent driver warning that blocks VMware VMs from moving from classic to modernized Azure Site Recovery replication."
tags: ["Azure Site Recovery"]
showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
disableShare: false
disableHLJS: false
hideSummary: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
---

During a migration from a classic Azure Site Recovery (ASR) vault to modernized VMware replication, the migration wizard would not allow the virtual machines to be selected. It reported **Source agent driver version is not supported**, even though the agents had already been upgraded.

The missing step was straightforward: the virtual machines needed to restart after the agent upgrade.

## Context

Before starting the migration, deploy the modernized ASR vault in Azure and install the new ASR appliance.

In the classic ASR vault, open **Replicated items** and select **Upgrade to modernized VMware replication**.

Review the prerequisites and click **Next**.

{{< figure src="./image2.png" alt="Prerequisites for upgrading to modernized VMware replication" >}}

## The source agent warning

Select the destination vault and the machines to move. If the VMs cannot be selected, check whether the wizard displays **Source agent driver version is not supported**.

{{< figure src="./image3.png" alt="ASR migration wizard showing the source agent driver version warning" >}}

In this case, the replicated-item details showed that a current supported agent was installed, so another agent installation was not the missing step.

{{< figure src="./image4.png" alt="Azure Site Recovery replicated item showing the installed mobility agent" >}}

## Resolution: restart after the agent upgrade

The upgraded agent was present, but the VMs had not restarted since the upgrade. Restart the affected VMs during an approved maintenance window, then reopen the migration wizard.

After the restart, the warning cleared and the VMs became selectable in this case.

{{< figure src="./image5.png" alt="Virtual machines selectable after restarting them following the ASR agent upgrade" >}}

Select the new ASR appliance and click **Next**.

{{< figure src="./image6.png" alt="New ASR appliance selected for modernized VMware replication" >}}

The selected VMs can now migrate to the modernized ASR vault and appliance.

{{< figure src="./image7.png" alt="VM migration from the classic ASR vault to modernized replication in progress" >}}

## Result

No further agent update was required in this case. A planned restart after the existing upgrade was enough for Azure Site Recovery to recognise the supported driver and allow the migration to proceed.
