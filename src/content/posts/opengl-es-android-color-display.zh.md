---
title: "使用OpenGLES在Android应用中显示颜色"
description: "介绍OpenGLES工作流程，包括配置EGL环境、准备OpenGLES环境，并最终显示一个颜色。"
tags: ["学习指南","Android","OpenGLES"]
date: 2023-05-09
updated: 2025-04-15
draft: false
---
> 我们知道屏幕显示出内容是靠一个一个发光的RGB灯珠，而决定灯珠亮度的是一块内存区域，通过往这一块内存区域写入数据，我们就能在屏幕上观察到数据显示效果。这是个复杂又灵活的工作，为了方便完成这项工作，先驱们制定出了OpenGL标准，我们的故事也将从这里开始。

## OpenGL ES
OpenGL ES是OpenGL的精简版本，Android平台从发行伊始就提供了OpenGL ES的支持，只是不同的版本，支持的OpenGL ES版本不同，目前主流的版本还是2.0和3.0。OpenGL ES是一组API，为开发者提供配置数据，传输数据，绘制内容的能力。它的工作是和绘制严格相关的，所以光是OpenGL ES不会造成很大的理解障碍，问题出在配置OpenGL ES的配置环境上。为什么要将OpenGL ES API和配置环境分开呢，因为OpenGL ES是跨平台的API，但是实际运行的时候需要和特定平台绑定，如Android。平台间准备OpenGL ES环境所需要的条件不同，为了保证OpenGL ES的跨平台能力，就需要将配置环境单独拿出来和特定平台绑定。在Android上这个配置环境就是EGL。明确OpenGL ES API和配置OpenGL ES环境的区别不仅对理解这两个关键概念有很大帮助，更是对后期调试代码，排错帮助极大。

## 工作流程
明确了一些基本概念之后，我们接下来最重要的任务是理清OpenGL ES的工作流程。很多教程一上来就列举一大堆名词或者直接上实例，我觉得是不妥的。只有熟悉了工作流程，我们在写代码的时候才能做到心中有数，才能在排错过程中更快更准确地定位问题。
### 准备环境
OpenGL ES是由一系列API组成的，但是不代表可以在任何时机下调用这些API，而是需要运行环境进行一些设置，这就是准备环境。准备环境通常是做一些显存分配，窗口配置的工作，很繁琐却必不可少。
### 准备着色器
着色器很重要，但是对于初学者来说不需要用太多的精力来关注它，很多效果直接可以在网上找到现成的代码，但是怎样将这些代码组装成一个完整可运行的程序却不一定有。我们只需要明确着色器是OpenGL ES开发中的重要一环，这一环这一是魔法发生的地方。
### 准备程序
着色器虽然重要，但是也不能独立运行，需要由一个程序管理。这里说的程序是一个OpenGL ES对象，它负责将着色器组装在一起。在运行大部分OpenGL ES API前都需要先使用到这个对像。
### 渲染
渲染环节其实也是在准备数据，我们需要将着色器中用到的一些数据赋值，然后调用绘制API，完成最后的绘制工作。GPU会将数据传递给着色器，着色器经过流水线，将数据转换成最终的显示数据存储在显存中。
### 上屏
渲染不代表就是将数据显示出来了，而是说数据计算好了。计算好的数据要想在屏幕上看到，可能需要调用OpenGL ES环境配置工具中的某个函数，如交换缓冲或者切换显示对象。
### 清理
和内存一样，我们使用OpenGL ES API也会申请到一些资源，在渲染结束后，我们应该主动将资源释放，以便后续程序使用。很多时候我们正常申请资源没有成功，可能是前面有资源没有释放的原因。

以上就是开发OpenGL ES应用的大致流程。由于OpenGL ES开发不好排错，所以在发现问题时最有效的定位方法是确定出错环节，然后再针对性地处理。所以熟悉流程很重要。

## 实例上手
由于OpenGLES相关概念很多，为了尽可能减少相关概念的干扰，本文打算只将上述流程中的第一步拿出来着重讲解。同时利用涉及到的知识点，实现一个最小的示例——将窗口染成红色。

下面开始讲解第一个概念——EGL。

## EGL
OpenGL ES只是对绘图的抽象，没有提供运行环境的抽象。如要申请显存，显存在哪里，需要明确，图像计算好了，显示在哪里，也需要指定。EGL就是对这些环境抽象的集合，为了通俗地解释相关概念，我们可以玩一下角色扮演——假如让我们设计相关标准，我们该如何做。

首先很容易想到的是，我们需要一个显示器，因为OpenGL ES最终会生成一组颜色数据，我们想要看到这些颜色，肯定就需要一个显示器来显示这些颜色数据。同时我们知道显示器也有很多规格，很多特性，为了兼容各种从低端到高端的显示器，肯定就需要对它做一层抽象，并提供一些设置属性的方法，这就是`EGLDisplay`的任务。

确定了显示器之后，我们会发现我们每次只能选择整个显示器或者不使用，而我们实际使用时，肯定有只显示一个区域的情况，或者同时显示多个区域的情况，为了满足这种使用场景，就需要对显示器再做划分，使之可支持同时操作多个区域，而担任这层抽象任务的就是`EGLSurface`。

既然都支持了多区域，那肯定也要能够对区域进行配置，可能同一个显示器上，一个区域只需要显示黑白像素，另一个区域需要显示高清图片，为了使这些配置能够生效，并且相互独立，肯定需要一个抽象，它要能保存显示配置，并且能将OpenGL ES环境独立开来，使一个区域对OpenGL ES的API调用不会影响到另一个区域，这就是`EGLContext`。

以上就是EGL三个核心的概念，分别是对显示器，显示区域，显示配置的抽象。

以上的概念都是零散的，我们实际工作肯定需要将各部分连在一起，所以有必要对他们的工作流程做一个概括总结。
首先我们需要获取一个`EGLDisplay`，从而确定最终的显示设备，然后根据显示设备支持的配置配置一块显示区域`EGLSurface`。最后，用`EGLContext`将`EGLDisplay`、`EGLSurface`关联起来。一旦关联成功，也就意味着OpenGL ES环境准备完成，下一步就可以创建着色器，创建着色器程序，为绘制做准备了。

流程梳理完之后，我们来看看代码该怎么写。为了最大限度地降低理解障碍，本文将使用Java端的接口来做示例。

## 准备EGLDisplay
学习任何新技能都需要一个入口，而OpenGLES和EGL共同的入口都是`EGLDisplay`。
所以第一步我们需要得到一个`EGLDisplay`对象。我们不能直接创建这个对象，而是需要通过`eglGetDisplay`方法获取一个对象。这个对象很重要，几乎是后面所有EGL相关API的第一个参数，所以，通常需要把它缓存起来以供后续使用。
虽然已经有了`EGLDisplay`对象，但它还不能直接使用。需要调用`eglInitialize`进行一次初始化。这种现象在很多SDK中也很常见，获取完对象后都需要做一次初始化，保证内部状态恢复到初始态。

## 获取配置

成功调用`eglInitialize`方法后，`EGLDisplay`对象就准备好了，就可以配置显示区域了。但是哪些配置信息有效，哪些配置信息支持我们不知道，因为硬件不同，支持的特性也不同，如果我们不顾硬件特性，直接将配置写死，可能会使代码在某台设备上运行失败，这不是我们想要看到的。因此，为了让配置在所有设备上都有效，有效的方式不是我们规定配置，而是我们主动去查询硬件是否只是我们想要的配置，即让`EGLDisplay`对象告诉我们。

`EGLDisplay`提供了两种方法来查询硬件支持的配置，一种是直接获取设备支持的所有配置信息`eglGetConfigs`，另一种是开发者列举出期望的配置，然后主动查询设备是否支持列举出的这些配置`eglChooseConfig`。开发者可以选择任意一种方式来确定显示区域的配置项。如果方法调用成功，则就相当于确定了显示区域的配置项，我们可以用这些配置项配置`EGLSurface`了。

## 配置显示区域
Android平台上使用`Surface`代表显示区域，但是通常我们不直接和`Surface`打交道，而是使用`SurfaceView`。但是使用`SurfaceView`也是有限制的，`Surface`只有在`SurafceView`中`SurfaceHolder`回调`surfaceCreated`发生后，`surfaceDestroyed`前才有效。也就是配置显示区域的操作，需要在收到`surfaceCreated`回调发生后才能进行。

配置显示区域需要通过`eglCreateWindowSurface`方法，前两个参数都是上面两步我们获得的对象，第三个参数是个`Surface`相关参数，可以是`Surface`，也可以是`SurfaceView`,`SurfaceHolder`。另外还可以用第四个参数传递一些关于`Surface`的配置信息。函数调用成功后，我们就获得了一个`EGLSurface`对象。

## 将它们连起来
目前为止，`EGLDisplay`对象，`EGLSurface`对象还是独立的，后者只是通过前者获得了一些配置信息，除此之外再无其他联系。为了让两者关联在一起，我们需要借用`EGLContext`对象。
同样的，创建`EGLContext`对象需要通过`eglCreateContext`函数，前两个参数都是前面步骤中获取到的`EGLDisplay`、`EGLConfig`，特别的是第三个参数。第三个参数是`EGLContext`，通常情况下会传递`EGL_NO_CONTEXT`,代表创建独立的`EGLContext`对象。另外一种情况是，当两个渲染环境想共享资源时，创建第一个渲染环境还是正常传递`EGL_NO_CONTEXT`，创建第二个渲染环境时，则需要将第一个环境创建的`EGLContext`对象传递进来，则这时候第二个渲染环境就可以使用第一个渲染环境中创建的纹理，着色器，着色器程序，buffer类对象，也就是两个渲染环境共享了一些数据。
至此，三个重要对象都出场了，但是彼此间还没有联系起来，所以需要`eglMakeCurrent`函数来完成这个工作。这个函数会将`EGLContext`对象绑定到当前线程上的同时，将`EGLContext`对象也绑定到`EGLSurface`上，绑定完成后，三大对象连在了一起，OpenGL ES环境也准备妥当了。

在进入OpenGL ES世界前，我们最后用代码的方式回顾一下之前的EGL世界
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
//我们希望红绿蓝通道是8位宽度
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
## 进入OpenGL ES世界
经过漫长的准备，我们终于将渲染环境准备好了，可以正常使用OpenGL ES API了。通常，在这之后就是创建着色器和着色器程序了。当然不同的渲染场景，调用的API通常会不一样，本文我们要将窗口染成红色，则不需要创建这些东西，只需要调用两个API就行，`glClearColor`设置清屏颜色，`glClear`设置清屏位。

当然，光有这两个功能函数还不行，我们还没设置绘制区域。是的，每次绘制都可以单独指定绘制区域，如第一次绘制我们绘制在左上角，第二次绘制，我们可以绘制在右下角，只需要在绘制前将绘制区域指定好就行，绘制区域的指定会在下次重新指定前都有效，用到的函数是`glViewport`。函数的前两个参数是指定起始位置，后两个参数则是距离起始位置的距离。

有了这三个函数的帮助，OpenGL ES就会将我们那黑黢黢的黑框框染成红色了。我们来看看代码
```kotlin
//我们想渲染整个区域，所以起始点是左上角，截至点是view的宽高
GLES20.glViewport(0,0,width,height)
//颜色范围是0-1
GLES20.glClearColor(1f,0f,0f,1f)
GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

```
## 上屏
上一节我们已经将窗口染成了红色，但是运行应用后会发现显示的还是黑色，那是因为我们忘记了还有最后的上屏操作。因为进入到OpenGL ES世界后，理所应当的就是调用OpenGL ES的API，然而事实是永远记住，OpenGL ES API只负责绘制，显示相关的问题还得找EGL。OpenGL ES绘制完成后，需要使用`eglSwapBuffers`完成上屏操作。

## 总结
本文是OpenGL ES系列的第一篇，着重写了一下我对EGL，OpenGL ES的大体理解，表述上可能没有那么严谨，旨在帮助读者搭建一个进入这个领域的通道，并对一些主要概念有基本的印象，后期我们会针对各个环节逐个深入，希望能够起到抛砖引玉的效果。

读完本文，读者应该对开发OpenGL ES应用流程有个简单的印象：EGL环境准备，着色器，着色器程序，渲染，上屏,清理。当然，本文只是着重讲到EGL环境准备这个环节。

关于EGL环境准备，我们有三个对象，从理解上来说就是显示器，显示区域，显示上下文，对应`EGLDisplay`，`EGLSurface`，`EGLContext`。环境准备主要是从`EGLDisplay`为起点，获取和配置这三个对象的过程，最后使用`eglMakeCurrent`关联起来。当然使用OpenGL ES API完成渲染后，记得要使用`eglSwapBuffers`完成上屏操作。

以上，就是本文的全部内容，咱们青山不改，绿水长流，下期见。

源码地址请看[这里](https://github.com/zevarc/OpenGLES)
