---
title: "How to get the app package name on Android"
description: "Various ways to get Android application package names, including Android Studio, adb shell pm list package, adb shell top, adb shell dumpsys window"
date: "2025-03-06"
updated: "2026-03-18"
tags: ["adb"]
draft: false
---

## Get package via Android Studio
If we can get the Apk file, then drag the Apk directly into Android Studio, Android Studio will automatically parse the file, and after successful parsing it will open a new tab, and at the top of the tab you can see the package name
![Android Studio resolve package](/images/posts/notes/android-studio.webp)

## Get package via pm list packages
If we can get the Apk file, then drag the Apk directly into Android Studio, Android Studio will automatically parse the file, and after successful parsing it will open a new tab, and at the top of the tab you can see the package name
```bash
adb shell pm list packages | grep com.example.app
```
![adb shell pm list packages](/images/posts/notes/pm-list-packages.webp)

## Get package via adb shell top
If we don't know anything about the application, then we have to run the application.webp A running application takes up resources and can be located by looking at the output of `top` and further determining the package name from the `ARGS` column.webp If the output is truncated, you can enter the `shell` environment before executing the `top` command.webp
![adb shell top](/images/posts/notes/top.webp)

## Get package adb shell dumpsys window
Actually the above two commands are still too slow for locating the application, the fastest way is to use `dumpsys window` directly.webp Again we run the application, but this time instead of looking at the resource usage of the application, we locate the application based on the current window focus, and the window related one is definitely looking for `dumpsys window`.webp The output may be different for different versions of the system, but the same is true, in one of the output lines there will be something like the following output
```bash
mFocusedApp=ActivityRecord{1970a93 u0 com.tencent.mm/.plugin.account.ui.WelcomeActivity t77}
```
Start with `mFocusedApp`, after `u0` and before `/` is the package name, after `/` is the name of the `Activity`.webp
![adb shell dumpsys window](/images/posts/notes/windows.webp)