---
title: "Android NDK Development — Threads"
description: "Practical notes on threading in Android NDK development: how to create threads on the Java side and the C++ side, and how to call JNI functions off the main thread to avoid blocking the UI."
date: 2022-05-28
updated: 2022-05-28
tags: ["Android", "NDK", "Threads"]
draft: true
---

## Introduction
In NDK development, apart from memory control, another vexing topic is threading. Threading problems are vexing not only because of their inherent complexity, but also because of the additional complexity introduced by JNI. Starting from real-world usage scenarios, this article tries to analyze and explain some of the logic and ideas behind using threads in NDK development, in the hope that you will find something useful here.

## Overview
Generally speaking, threading topics fall into two main areas — single-threading and multi-threading. Single-threading focuses mainly on thread creation, destruction, resource management, and so on, while multi-threading focuses more on inter-thread communication. Since single-threading is the foundation of multi-threading, and multi-threading is made up of single threads, this article will not cover multi-threading; instead, it will concentrate on breaking through single-threading first.
In NDK development, single-threading also has two directions — the Java side and the C++ side. The Java side is a bit simpler than the C++ side and differs little from a pure Java application; the main consideration is simply which appropriate thread to call `native` methods on. The C++ side is more complex, because beyond resource management and thread management, it also has to deal with the problem of interacting with the Java world.
Around these three aspects, this article will use real-world usage scenarios as its foundation and tackle these three major problems one by one.

## Threads on the Java side
On the Java side, there is always a contradictory problem: time-consuming tasks cannot run on the main thread, yet the results of time-consuming tasks usually need to be reflected in the UI, and only the main thread can update the UI. The usual way to solve this is to move time-consuming tasks to a non-UI thread. But in NDK development we have other approaches: we can let the NDK spawn new threads in the background to complete time-consuming tasks, then deliver the results back via callbacks. This way the Java side hardly needs to deal with threading problems at all.

## Creating threads on the Java side
Creating threads on the Java side is simple: subclass the `Thread` class and override the `run` method, or simply implement the `Runnable` interface. The hard part is that the difficulties multiply

## Creating threads on the C++ side
Since Android is based on Linux, the NDK can use the standard POSIX threads interface. Of course, the NDK can also use C++'s standard thread library interface, which is useful in cross-platform development. Since the C++ standard library is also a wrapper around the POSIX threads interface, the following discussion uses the POSIX threads interface as the model.

The main POSIX threads interfaces are defined in the `pthread.h` header. The main

## The simplest case
In Java, code executes sequentially by default. Calling one method from another has the same effect as moving that method's body to the call site and executing it in sequence. This logic applies equally to JNI functions. A JNI function body executes on the calling thread, just as if the function body were written in Java. After the function returns, the current function saves the returned result and continues executing.
With this concept in mind, let's look at the following example. First is the Kotlin calling code.
```kotlin
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val value=stringFromJNI() //Step 1, invoke the computation
        binding.sampleText.text = value //Step 4, use the result
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
Here is the C++ code
```c++
extern "C" JNIEXPORT jstring JNICALL
Java_me_hongui_ndkthread_MainActivity_stringFromJNI(
        JNIEnv* env,
        jobject /* this */) {
    std::string hello{"Hello World"};//Step 2, compute the result
    return env->NewStringUTF(hello.c_str()); //Step 3, return the result
}
```
It can be clearly seen that even though `stringFromJNI` is a JNI method, it still proceeds in the steps of invoke the computation, compute the result, return the result, use the result. That is, by the time step four executes, the value of `value` is correct and reliable.

This works well in most cases, but the situation is less pleasant if the JNI function is called on the main thread and takes a while to execute. In Android development, it is common knowledge that you must not run time-consuming operations on the main thread. So how can we avoid blocking the main thread? Based on the four steps above, we can think of two approaches. One targets the caller — step one — by simply executing that step on a non-main thread. The other targets the callee, letting step two run on a non-main thread. But whichever approach we introduce to solve this problem, we will necessarily break the execution order of invoke the computation, compute the result, return the result, use the result. In solving the problem, we have introduced a new one.

## Solving the new problem
In the previous section, to avoid blocking the main thread we came up with two approaches, whose fundamental idea is to break up the sequential execution structure. And precisely because we broke up this structure, we introduced a new problem — how to pass data between different threads.

For approach one: invoke the computation on a non-main thread. This is familiar to us — it can be solved with a `Handler` and a thread, as follows.
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
                    binding.sampleText.text = msg.obj as String //Step 4, use the result
                }
            }
        }
        // Example of a call to a native method
        thread { 
            val value=stringFromJNI() //Step 1, invoke the computation
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
Following the guiding idea of approach one, we moved the computation invocation to a non-main thread, so we no longer need to worry about step two blocking the main thread, and the first three steps can execute in order. But step four cannot, because in Android only the main thread can update the UI. For this reason, we have to introduce a `Handler` to handle the inter-thread communication problem.
