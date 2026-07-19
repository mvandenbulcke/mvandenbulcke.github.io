---
title: "Diagnosing a Slow ‘Other User’ Sign-In on Windows Server"
date: 2024-10-14T12:00:03+00:00
lastmod: 2026-07-10T00:00:00Z
description: "Investigating a slow sign-in on a hybrid-joined Windows Server with blocked Microsoft connectivity, and the immediate result after a local leave."
summary: "A two-to-three-minute pause at the Other User screen observed on a hybrid-joined server that could no longer reach Microsoft services."
tags: ["Windows Server", "Hybrid Join", "Troubleshooting"]
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

One Windows Server took noticeably longer than comparable systems to move beyond the **Other User** screen whenever a new user signed in or a session was unlocked. The investigation therefore focused on what was different about that machine.

{{< figure src="./image1.png" alt="Windows Server paused at the Other User sign-in screen" >}}

## Check the join state

The first useful clue was that the server was hybrid Microsoft Entra joined. Confirm its registration state with:

```PowerShell
dsregcmd /status
```

## Connect the delay to the network context

The hybrid join alone was not evidence of a problem. In this scenario, outbound access to Microsoft services had been intentionally restricted while the server's local state still showed a hybrid join.

That combination suggested a working hypothesis: a component associated with device registration was waiting on blocked connectivity before sign-in continued. The symptoms were consistent with that explanation, but no trace was captured to prove which endpoint or Windows component consumed the delay.

## Use a local leave as a diagnostic

Because the server was intentionally unable to reach Microsoft services, use an elevated prompt to test whether its current registration state is involved:

```PowerShell
dsregcmd /leave
```

> **Warning:** On a hybrid-joined device, this changes the local registration state immediately but is not, by itself, a durable unjoin. If automatic hybrid registration remains configured, the scheduled registration task can join the device again. Treat this command as a diagnostic or immediate local change unless a permanent removal has been designed and approved. It can affect identity, access, and management workflows.

Run `dsregcmd /status` again and confirm that the server is no longer hybrid joined.

## Make an intentional unjoin durable

Before permanently removing a production server from hybrid join, assess every dependency on its cloud device identity. This includes Conditional Access rules that require a hybrid-joined or compliant device, Intune enrolment and configuration, Microsoft Defender for Endpoint onboarding and device records, certificate or single sign-on flows, and any automation keyed to the Microsoft Entra device object.

For an approved durable unjoin:

1. Follow Microsoft's [hybrid-join unjoin guidance](https://learn.microsoft.com/en-us/entra/identity/devices/faq#how-do-i-unjoin-a-microsoft-entra-hybrid-joined-device-locally-on-the-device) and use its [controlled deployment process](https://learn.microsoft.com/en-us/entra/identity/devices/hybrid-join-control) to turn off automatic registration for the intended device scope without disrupting other devices.
2. From an elevated prompt on the server, run the supported leave command:

   ```PowerShell
   dsregcmd.exe /debug /leave
   ```

3. Restart or sign in according to the approved change plan, run `dsregcmd /status`, and confirm that the scheduled registration process does not restore the hybrid join.
4. Validate Conditional Access, application access, Intune, Defender for Endpoint, certificates, monitoring, and server operations. Retire or update cloud management records only through each product's supported process.

## Result

After the local leave, the next sign-in completed without the previous pause. That before-and-after result supports registration state and blocked connectivity as contributing factors, but it does not prove the exact timeout source. The important lesson is not that hybrid join inherently slows Windows Server sign-in; it is that a device-registration state can become inconsistent with the server's intended network access. A permanent unjoin still requires the supported process above so automatic registration does not silently restore the state.
