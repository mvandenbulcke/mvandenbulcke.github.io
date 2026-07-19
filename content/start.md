---
title: "Start here"
description: "A curated route through practical notes on infrastructure, endpoint automation, and troubleshooting."
lastmod: 2026-07-19T00:00:00Z
---

Hi, I’m Michaël Vandenbulcke. I write field notes about infrastructure work: deployments that need a durable record, automation that removes repetitive work, and failures whose fixes were harder to find than they should have been.

If you are new here, the notes below are a good route through the archive. You can also browse [every post](/archive/) or subscribe through [RSS](/index.xml).

## Infrastructure and Azure

Begin with [Deploying Azure Stack HCI 23H2]({{< ref "posts/azure-stack-hci-23h2-installation-and-setup-guide" >}}) for an end-to-end cluster build and Azure Arc registration. For narrower recovery work, see the fixes for [PhysicalDisk validation]({{< ref "posts/azure-stack-hci-unable-to-retrieve-data-for-physicaldisk" >}}) and an [unsupported Azure Site Recovery source-agent driver]({{< ref "posts/azure-site-recovery-source-agent-driver-version-is-not-supported" >}}).

## Endpoint automation

The [Dell BIOS and Intune guide]({{< ref "posts/deploy-dell-bios-settings-and-unique-per-device-bios-passwords-using-intune" >}}) covers policy deployment and per-device password retrieval. The shorter notes on [site-aware printer deployment]({{< ref "posts/add-printers-based-on-ip-octet" >}}) and [logon rights at scale]({{< ref "posts/logon-as-a-service-batch-job-at-scale" >}}) show the same preference for simple, repeatable administration.

## Troubleshooting

For focused incident notes, read how I approached a [slow “Other User” sign-in on Windows Server]({{< ref "posts/other-user-slow-login-process" >}}) or the Azure CLI error [“User cancelled the Accounts Control Operation”]({{< ref "posts/az-login-failure" >}}). Both preserve the observed symptoms, the test that changed the diagnosis, and the limits of the conclusion.
