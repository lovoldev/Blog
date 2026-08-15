---
title: "Android-NDK开发（线程）"
description: "在NDK开发中线程相关的课题：Java端与C++端如何创建线程，以及怎样在非主线程调用JNI函数避免阻塞主线程。"
date: 2022-05-28
updated: 2022-05-28
tags: ["Android","NDK","线程"]
draft: true
---

## 开篇
NDK开发中，除了内存控制以外，另一个挠头的课题就是线程相关的内容了。线程问题之所以挠头，不仅仅是因为其本身的复杂性，更因为引入JNI带来的更多复杂性。本篇试着从实际使用场景出发，剖析并解释一些在NDK开发中，线程使用的一些逻辑和思路，希望大家能有所收获。

## 总览
总的来说，线程相关的课题有两大方面——单线程和多线程。单线程的关注点主要集中在线程的创建、销毁，资源管理等方面，而多线程则更多关注的是线程间通信。由于单线程是多线程的基础，并且多线程也是由单线程构成的，所以本篇将不考虑多线程相关的内容，集中精力，先突破单线程。
在NDK开发中，单线程也有两个方向——Java端，C++端。Java端相对于C++端会简单一点，和纯Java应用相差不大，考虑的问题无疑就是在哪个合适的线程调用`native`方法。而C++端则复杂一点，因为不仅要涉及到资源管理，线程管理，更多地要考虑到和Java世界交互的问题。
围绕上述三个方面，本篇将以实际使用场景为基石，逐步攻破这三大难题。

## Java端的线程
在Java端，始终有个互相矛盾的课题：耗时任务不能运行在主线程，但是耗时任务的结果一般是需要反映在UI上 ，而主线程才能更新UI。解决这个问题通常的方法就是，将耗时任务移到非UI线程执行。但是在NDK开发中我们还有其他方法，让NDK后台开启新线程完成耗时任务，然后通过回调的方式传递耗时结果。这样Java端就几乎不用处理线程相关的问题了。

## Java端新建线程
Java端新建线程很简单，继承`Thread`类，重新`run`方法或者直接实现`Runnable`接口就行，难点是相乘

## C++端新建线程
由于Android是基于Linux的，所以NDK可以使用标准的POSIX线程接口。当然NDK也可以使用C++的标准线程库接口，这在跨平台开发中很有用。由于C++标准库也是对POSIX线程接口的封装，所以，以下就以POSIX线程接口为原型讲解。

POSIX线程的主要接口都在`pthread.h`文件头中定义，主要                       

## 最简单的情况
在Java中，默认情况下代码是顺序执行的。在一个方法中调用另一个方法的效果就是把那个方法体搬到函数执行的地方顺序执行。这个逻辑对于JNI函数同样适用。JNI函数体会在调用线程中执行，就好像函数体是用Java写的一样。函数返回后，当前函数保存返回结果，然后接着往下执行。
有了这个概念，我们来看下面的例子。首先是Kotlin的调用代码。
```kotlin
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val value=stringFromJNI() //第一步，调用计算
        binding.sampleText.text = value //第四步，使用结果
    }

    external fun stringFromJNI(): String

    companion object {
        // Used to load the 'ndkthread' library on application startup.
        init {
            System.loadLibrary("ndkthread")
        }
    }
}
```
下面是C++代码
```c++
extern "C" JNIEXPORT jstring JNICALL
Java_me_hongui_ndkthread_MainActivity_stringFromJNI(
        JNIEnv* env,
        jobject /* this */) {
    std::string hello{"Hello World"};//第二步，计算结果
    return env->NewStringUTF(hello.c_str()); //第三步，返回结果
}
```
可以很清楚地看到，虽然`stringFromJNI`是个JNI方法，但是依然是按照，调用计算，计算结果，返回结果，使用结果的步骤进行的。也就是说当执行到第四步的时候，`value`的值是正确的，可靠的。

这种情况在大部分情况下工作得很好，但是假如调用JNI函数发生在主线程，而JNI函数执行比较耗时，情况就不那么妙了。因为在Android开发中，不能在主线程执行耗时操作是一个共识。那么怎样才能避免阻塞主线程呢？根据上面的四个流程，我们可以想到两种方式。一种方式是针对调用方，即第一步，把这一步放在非主线程中执行就可以。另一种方法是针对被调用方，即让第二步执行在非主线程。但是无论引入哪种方式解决这个问题，都必将打破调用计算，计算结果，返回结果，使用结果的执行步骤。我们在解决问题的时候引入了新的问题。

## 解决新问题
在上一章节，为了解决阻塞主线程，我们得出两种方式，其根本思路都是打乱顺序执行的结构。而正因为打乱了这个结构，我们引入了新的问题——怎样在不同线程间传递数据。

对于方法一：在非主线程调用计算过程，这对于我们来说很熟悉，借助一个`Handler`和线程即可解决。如下
```kotlin
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val handler=object :Handler(Looper.getMainLooper()){
            override fun handleMessage(msg: Message) {
                super.handleMessage(msg)
                
                if(msg.what==9527){
                    binding.sampleText.text = msg.obj as String //第四步，使用结果
                }
            }
        }
        // Example of a call to a native method
        thread { 
            val value=stringFromJNI() //第一步，调用计算
            val msg=Message.obtain(handler,9527)
            msg.obj=value
            handler.sendMessage(msg)
        }
    }

    /**
     * A native method that is implemented by the 'ndkthread' native library,
     * which is packaged with this application.
     */
    external fun stringFromJNI(): String

    companion object {
        // Used to load the 'ndkthread' library on application startup.
        init {
            System.loadLibrary("ndkthread")
        }
    }
}
```
按照方式一的指导思想，我们把调用计算移动到了非主线程中执行，所以我们不再需要害怕第二步会阻塞主线程，前三步得以按顺序执行，但是第四步却不行，Android中只能主线程才能更新UI。为此，我们不得不引入`Handler`来处理跨线程通信的问题。
