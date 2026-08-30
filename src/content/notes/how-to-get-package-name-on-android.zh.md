---
title: "Android上怎么获取到应用包名"
description: "各种场景下获取Android应用包名的方式，包括Android Studio，adb shell pm list package,adb shell top,adb shell dumpsys window"
date: "2025-03-06"
updated: "2026-03-18"
tags: ["ADB","Android"]
draft: false
---

## 通过Android Studio
如果我们能得到Apk文件，那么直接将Apk拖进Android Studio中，Android Studio就会自动解析文件，解析成功后会打开一个新标签，在标签的顶部就能看到包名。
![Android Studio resolve package](/images/posts/notes/android-studio.webp)

## 通过pm list packages命令
如果我们没有Apk文件，想查看手机上的应用包名，也有一些大概的信息，则可以使用`pm list packages`命令，它能列举出所有的应用。配合`grep(Linux/MacOS)`或者`findstr(Windows)`就能快速定位到目标应用了。
```bash
adb shell pm list packages | grep com.example.app
```
![adb shell pm list packages](/images/posts/notes/pm-list-packages.webp)

## 通过adb shell top命令
如果我们对应用一无所知，那么就只能把应用跑起来了。跑起来的应用它就会占用资源，就可以通过观察`top`的输出定位到应用，进一步根据`ARGS`列确定包名了。如果输出被截断了，则可以先进入`shell`环境再执行`top`命令。
![adb shell top](/images/posts/notes/top.webp)

## 通过adb shell dumpsys window命令
其实上面两个命令对于定位应用还是太慢了，最快的方法是直接使用`dumpsys window`。同样我们运行应用，不过这一次不是看应用的资源占用，而是根据当前的窗口焦点定位应用，而窗口相关的肯定就是找`dumpsys window`了。不同版本的系统输出可能是不一样的，但是一样的是，在输出的某一行会有类似下面的输出
```bash
mFocusedApp=ActivityRecord{1970a93 u0 com.tencent.mm/.plugin.account.ui.WelcomeActivity t77}
```
以`mFocusedApp`打头，`u0`后、`/`前就是包名，`/`后则是`Activity`的名字。
![adb shell dumpsys window](/images/posts/notes/windows.webp)