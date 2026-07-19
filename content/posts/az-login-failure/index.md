---
title: "Fix Azure CLI ‘User cancelled the Accounts Control Operation’ on Windows"
date: 2024-07-08T12:00:03+00:00
lastmod: 2026-07-10T00:00:00Z
description: "Work around an Azure CLI login failure on Windows by clearing the account state and disabling the Web Account Manager broker."
summary: "The three Azure CLI commands that restored interactive login after the Windows authentication broker returned Status_UserCanceled."
tags: ["Azure", "PowerShell", "Azure CLI"]
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

During an interactive `az login` from PowerShell, the authentication flow returned an unexpected cancellation error.

## Symptom

The Azure CLI returned:

```
User cancelled the Accounts Control Operation.. Status: Response_Status.Status_UserCanceled, Error code: 0, Tag: 528315210
```

The sign-in prompt had not been cancelled, which made the message misleading in this case.

## Cause

Beginning with Azure CLI [version 2.61.0](https://learn.microsoft.com/en-us/cli/azure/release-notes-azure-cli#may-21-2024), Web Account Manager (WAM) became the default authentication method on Windows. In my case, the failure appeared while the CLI was using that brokered sign-in flow.

## Workaround

I cleared the Azure CLI account state, disabled the Windows broker, and started a new login:

```PowerShell
az account clear
az config set core.enable_broker_on_windows=false
az login
```

`az account clear` removes the current Azure CLI account state, so expect to authenticate again. Disabling the broker also changes the sign-in path for subsequent Azure CLI sessions on that Windows environment; apply the workaround only where it fits your organisation's authentication policy.

## Result

The non-brokered login completed successfully. For newer Azure CLI releases, check the current authentication guidance before changing the broker setting.
