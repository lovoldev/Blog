---
title: "Troubleshooting AVD Time Skew on macOS"
description: "Troubleshooting and resolving the issue where the Android emulator (AVD) on macOS falls behind in system time, causing API calls to fail"
date: "2026-08-15"
updated: "2026-08-15"
tags: ["Android", "AVD", "macOS"]
draft: false
---

## Symptom
Recently, while developing projects with Android Studio on macOS, I noticed that after the system goes to sleep, the AVD's system time falls behind the actual time. The symptom is that an API that was running perfectly fine in the morning stops working after you wake up the next day, especially for APIs that compare against the system time.
## Solution
The solution is very simple: just restart the emulator. After restarting, the AVD will automatically sync its time.
