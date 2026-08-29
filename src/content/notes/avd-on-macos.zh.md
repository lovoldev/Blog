---
title: "macOS上AVD时间偏移问题排查"
description: "macOS上Android模拟器AVD时间偏移导致接口调用异常问题的排查与解决过程"
date: "2026-08-15"
updated: "2026-08-15"
tags: ["Android", "AVD", "macOS"]
draft: false
---

## 现象
最近发现macOS上使用Android Studio开发项目时，AVD在系统休眠后，系统时间会慢于正常时间，造成的现象就是早上明明跑着很正常的接口，睡一觉起来就跑不通了，特别对于那些会比对系统时间的接口
## 解决
解决方案也很简单，直接重启模拟器即可。重启后AVD会自动同步时间。