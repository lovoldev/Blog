---
title: Displaying Colors in Android Applications Using OpenGL ES
description: "Introduction to OpenGL ES workflow, configuring the EGL environment, setting up OpenGL ES, and ultimately displaying a color."
tags: ["Learning Guide","Android","OpenGLES"]
date: 2023-05-09
updated: 2025-04-15
draft: false
---

> We know that screens display content through individual glowing RGB pixels, and what determines each pixel's brightness is a memory region. By writing data to this memory region, we can observe the data's visual effect on the screen. This is complex yet flexible work. To make this task easier, pioneers developed the OpenGL standard, and our story begins here.

## OpenGL ES

OpenGL ES is a streamlined version of OpenGL. Android has provided OpenGL ES support since its initial release, though different versions support different OpenGL ES versions. Currently, versions 2.0 and 3.0 are the mainstream choices. OpenGL ES is a set of APIs that provide developers with the ability to configure data, transmit data, and draw content. Its work is strictly related to rendering, so OpenGL ES itself doesn't cause major comprehension difficulties. The problems arise when configuring the OpenGL ES environment. Why separate OpenGL ES API from its configuration environment? Because OpenGL ES is a cross-platform API, but it needs to bind to a specific platform at runtime, such as Android. The conditions for preparing the OpenGL ES environment differ between platforms. To ensure OpenGL ES's cross-platform capability, the configuration environment needs to be separated and bound to specific platforms. On Android, this configuration environment is EGL. Understanding the difference between OpenGL ES API and configuring the OpenGL ES environment not only greatly helps in comprehending these two key concepts but also significantly aids in later debugging and troubleshooting.

## Workflow

After clarifying some basic concepts, our next most important task is to understand the OpenGL ES workflow. Many tutorials immediately list a bunch of terms or jump straight into examples—I think this approach is inappropriate. Only by being familiar with the workflow can we write code with confidence and locate problems faster and more accurately during troubleshooting.

### Environment Setup

OpenGL ES consists of a series of APIs, but this doesn't mean these APIs can be called at any time. The runtime environment needs to perform some setup first—this is environment setup. Environment setup typically involves tasks like video memory allocation and window configuration. It's tedious but essential.

### Shader Preparation

Shaders are important, but beginners don't need to spend too much energy on them. Many effects can find ready-made code online, but how to assemble this code into a complete, runnable program isn't always clear. We only need to understand that shaders are a crucial part of OpenGL ES development—this is where the magic happens.

### Program Preparation

Shaders, though important, can't run independently. They need to be managed by a program. The program mentioned here is an OpenGL ES object responsible for assembling shaders together. Most OpenGL ES API calls require this object to be used first.

### Rendering

The rendering stage is actually also about preparing data. We need to assign values to some data used in the shaders, then call the drawing API to complete the final drawing work. The GPU passes data to the shaders, which process it through a pipeline, converting the data into final display data stored in video memory.

### Display to Screen

Rendering doesn't mean the data is displayed—it means the data has been computed. To actually see the computed data on screen, you may need to call a function from the OpenGL ES environment configuration tools, such as buffer swapping or display object switching.

### Cleanup

Like memory, using OpenGL ES APIs also acquires some resources. After rendering finishes, we should proactively release resources for subsequent program use. Many times, when resource allocation fails, it may be because previous resources weren't released.

The above is the general workflow for developing OpenGL ES applications. Since OpenGL ES development is difficult to troubleshoot, the most effective way to locate problems when discovered is to identify the problematic stage and then handle it specifically. So understanding the workflow is important.

## Hands-On Example

Since OpenGL ES involves many concepts, to minimize conceptual interference as much as possible, this article will focus on explaining only the first step in the workflow. Using the knowledge points involved, we'll implement a minimal example—painting the window red.

Let's start by explaining the first concept—EGL.

## EGL

OpenGL ES is only an abstraction for drawing and doesn't provide an abstraction for the runtime environment. For example, when requesting video memory, you need to know where it is. When the image is computed, you also need to specify where to display it. EGL is a collection of these environment abstractions. To explain these concepts in an accessible way, we can play a role-playing game—if we were to design the relevant standards, how would we do it?

First, it's easy to think that we need a display. Because OpenGL ES ultimately generates a set of color data, to see these colors, we definitely need a display to show this color data. We also know that displays have many specifications and features. To be compatible with various displays from low-end to high-end, we need to create an abstraction layer and provide methods to set properties. This is the task of `EGLDisplay`.

After determining the display, we find that we can only choose the entire display or not use it at all. But in actual use, there are definitely cases where we only want to display one area, or display multiple areas simultaneously. To meet these usage scenarios, we need to further divide the display so it can support operating multiple areas simultaneously. This layer of abstraction is `EGLSurface`.

Since we support multiple areas, we must also be able to configure those areas. On the same display, one area might only need to display black and white pixels, while another area needs to display high-definition images. To make these configurations effective and independent of each other, we definitely need an abstraction that can save display configurations and isolate the OpenGL ES environment, so that one area's OpenGL ES API calls don't affect another area. This is `EGLContext`.

The above covers the three core EGL concepts: abstraction of the display, display area, and display configuration.

The above concepts are scattered. In actual work, we definitely need to connect the parts together, so it's necessary to summarize their workflow.

First, we need to obtain an `EGLDisplay` to determine the final display device. Then, based on the configurations supported by the display device, we configure a display area `EGLSurface`. Finally, use `EGLContext` to associate `EGLDisplay` and `EGLSurface`. Once association succeeds, it means the OpenGL ES environment is ready. The next step is to create shaders, create shader programs, and prepare for drawing.

After clarifying the workflow, let's see how to write the code. To minimize comprehension barriers, this article will use Java-side interfaces for examples.

## Preparing EGLDisplay

Learning any new skill requires an entry point, and the common entry point for both OpenGL ES and EGL is `EGLDisplay`.

So the first step is to get an `EGLDisplay` object. We can't create this object directly; we need to obtain one through the `eglGetDisplay` method. This object is very important—it's the first parameter of almost all subsequent EGL-related APIs. So we usually need to cache it for later use.

Although we already have an `EGLDisplay` object, it can't be used directly. We need to call `eglInitialize` to perform initialization. This phenomenon is common in many SDKs—after obtaining an object, you need to initialize it to restore the internal state to its initial state.

## Getting Configuration

After successfully calling the `eglInitialize` method, the `EGLDisplay` object is ready, and we can configure the display area. But we don't know which configuration information is valid or supported, because hardware differs and supported features differ. If we ignore hardware characteristics and hardcode configurations, the code might fail on some devices, which is not what we want. Therefore, to make configurations valid on all devices, the effective approach isn't to prescribe configurations ourselves, but to proactively query whether the hardware supports the configurations we want—let the `EGLDisplay` object tell us.

`EGLDisplay` provides two methods to query hardware-supported configurations. One is to directly get all configuration information supported by the device: `eglGetConfigs`. The other is for developers to list expected configurations and then proactively query whether the device supports them: `eglChooseConfig`. Developers can choose either method to determine display area configuration items. If the method call succeeds, the display area configuration items are determined, and we can use these configuration items to configure `EGLSurface`.

## Configuring the Display Area

On Android, `Surface` represents the display area, but usually we don't directly work with `Surface`. Instead, we use `SurfaceView`. However, using `SurfaceView` has limitations. `Surface` is only valid between `SurfaceHolder` callback `surfaceCreated` and `surfaceDestroyed` in `SurfaceView`. In other words, configuring the display area can only happen after receiving the `surfaceCreated` callback.

Configuring the display area requires the `eglCreateWindowSurface` method. The first two parameters are the objects we obtained in the previous two steps. The third parameter is a `Surface`-related parameter and can be `Surface`, `SurfaceView`, or `SurfaceHolder`. Additionally, the fourth parameter can pass some `Surface` configuration information. After the function call succeeds, we get an `EGLSurface` object.

## Connecting Them Together

So far, the `EGLDisplay` and `EGLSurface` objects are independent. The latter only got some configuration information from the former, with no other connection. To associate them, we need to use the `EGLContext` object.

Similarly, creating an `EGLContext` object requires the `eglCreateContext` function. The first two parameters are the `EGLDisplay` and `EGLConfig` obtained in the previous steps. The third parameter is special. The third parameter is `EGLContext`. Usually, you'd pass `EGL_NO_CONTEXT`, representing creating an independent `EGLContext` object. Another case is when two rendering environments want to share resources. When creating the first rendering environment, you still pass `EGL_NO_CONTEXT` normally. When creating the second rendering environment, you pass the `EGLContext` object created by the first environment. At this point, the second rendering environment can use textures, shaders, shader programs, and buffer objects created in the first rendering environment—in other words, the two rendering environments share some data.

So far, all three important objects have appeared, but they still aren't connected to each other. The `eglMakeCurrent` function is needed to complete this connection. This function binds the `EGLContext` object to the current thread while also binding the `EGLContext` object to the `EGLSurface`. After binding completes, the three objects are connected, and the OpenGL ES environment is ready.

Before entering the OpenGL ES world, let's review the EGL concepts with code one last time:

```kotlin
val display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
if (EGL14.EGL_NO_DISPLAY == display) {
     log()
     return
}
val versions = IntArray(2)
var flag = EGL14.eglInitialize(display, versions, 0, versions, 1)
if (!flag) {
     log()
     return
}
Log.i(TAG, "EGL version:major = ${versions[0]}, minor = ${versions[1]}")
// We want 8-bit width for red, green, and blue channels
val attr = intArrayOf(
       EGL14.EGL_RED_SIZE, 8,
       EGL14.EGL_GREEN_SIZE, 8,
       EGL14.EGL_BLUE_SIZE, 8,
       EGL14.EGL_NONE
      )
val configs=Array<EGLConfig?>(1,{null})
val numConfig=IntArray(1)
flag = EGL14.eglChooseConfig(display, attr, 0, configs, 0, 1, numConfig, 0)
if (!flag) {
      log()
      return
}
val config=configs.first()
val eglSurface=EGL14.eglCreateWindowSurface(display,config,surface, intArrayOf(EGL14.EGL_NONE),0)
if (EGL14.EGL_NO_SURFACE == eglSurface) {
      log()
      return
}
val context=EGL14.eglCreateContext(display,config,EGL14.EGL_NO_CONTEXT, intArrayOf(EGL14.EGL_NONE),0)
if (EGL14.EGL_NO_CONTEXT == context) {
      log()
      return
}
flag = EGL14.eglMakeCurrent(display, eglSurface, eglSurface, context)
if (!flag) {
      log()
      return
}
```

## Entering the OpenGL ES World

After lengthy preparation, we've finally set up the rendering environment and can normally use OpenGL ES APIs. Usually, after this comes creating shaders and shader programs. Of course, different rendering scenarios usually call different APIs. In this article, we want to paint the window red, so we don't need to create those things—just call two APIs: `glClearColor` to set the clear color and `glClear` to set the clear buffer bit.

Of course, having these two function calls isn't enough—we haven't set the drawing area yet. Yes, each drawing can specify a separate drawing area. For example, the first drawing could be in the top-left corner, the second drawing could be in the bottom-right corner. You just need to specify the drawing area before drawing. The drawing area specification remains valid until specified again. The function used is `glViewport`. The first two parameters specify the starting position, and the last two parameters are the distance from the starting position.

With the help of these three functions, OpenGL ES will paint our black box red. Let's look at the code:

```kotlin
// We want to render the entire area, so the starting point is the top-left corner, and the endpoint is the view's width and height
GLES20.glViewport(0,0,width,height)
// Color range is 0-1
GLES20.glClearColor(1f,0f,0f,1f)
GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

```

## Display to Screen

In the previous section, we painted the window red, but after running the app, you'll see it's still black. That's because we forgot the final display-to-screen operation. After entering the OpenGL ES world, calling OpenGL ES APIs seems like the natural thing to do. However, always remember that OpenGL ES APIs only handle drawing—display-related issues should still be handled by EGL. After OpenGL ES finishes drawing, you need to use `eglSwapBuffers` to complete the display-to-screen operation.

## Summary

This article is the first in the OpenGL ES series. It focuses on my general understanding of EGL and OpenGL ES. The presentation may not be entirely rigorous, but it aims to help readers build a pathway into this field and gain basic impressions of some main concepts. In later articles, we'll dive deep into each aspect, hoping to serve as a catalyst for further learning.

After reading this article, readers should have a simple impression of the OpenGL ES application development workflow: EGL environment setup, shaders, shader programs, rendering, display-to-screen, cleanup. Of course, this article only focuses on the EGL environment setup stage.

Regarding EGL environment setup, we have three objects: conceptually, they are the display, display area, and display context, corresponding to `EGLDisplay`, `EGLSurface`, and `EGLContext`. Environment setup mainly involves obtaining and configuring these three objects, starting from `EGLDisplay`, and finally associating them using `eglMakeCurrent`. Of course, after using OpenGL ES APIs to complete rendering, remember to use `eglSwapBuffers` to display to screen.

That's all for this article. As the old saying goes, "The mountains remain, the rivers flow on—see you in the next installment."

For the source code, please see [here](https://github.com/zevarc/OpenGLES)
