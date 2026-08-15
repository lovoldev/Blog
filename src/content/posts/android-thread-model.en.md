---
title: "Thread Models and Solutions in Android Development"
description: "Practical guidance on threading in Android, especially for JNI development — covering callbacks, Future, Handler, atomic operations, locks, condition variables, and how to correctly use JNIEnv in child threads."
date: 2024-12-28
updated: 2024-12-28
tags: ["Android", "JNI", "Threads"]
draft: false
cover: /images/cover/android-thread-model.webp
---

>Threads play an important role in Android development. Although coroutines have made thread usage a non-issue in pure application-layer development, for JNI development, at least half of all crashes are caused by thread-related problems. So this article will take a hands-on approach, gradually revealing to readers the problems you may encounter when using threads in JNI development, and sharing my own solutions.

A concept is introduced to solve new problems, and **threads were introduced to solve multi-task parallelism**. But every new concept also brings new problems. The main problem threads introduce is data races, yet JNI development has more than just data races. Let's peel back the mystery of threads step by step.
## Three Scenarios for Using Threads
In a previous article ([An Introduction to NDK Development](/zh/posts/android-ndk-primer)), I roughly divided JNI development into three parts: the Java development part, the C++ development part, and the JNI layer that connects the two. All three parts involve thread-related development issues.
As mentioned earlier, the main problem between threads is data races, but data races don't exist in every scenario. To gain a comprehensive understanding of thread development, we can model the usage scenarios and go from simple to complex, giving a fairly complete overview of thread problems. For the sake of clarity, in the following text "main thread" refers to the current execution environment, and "child thread" refers to the thread environment obtained by actively creating a thread.
## Data Read and Written Only in the Child Thread
The main function of a thread is to execute parallel tasks. The simplest task is to give it an input, and it produces a result based on the input and the executing code, then finishes. This is the simplest threading model — the same as traditional single-threaded development, except for the extra thread creation step.
So developing multi-threaded applications in this scenario is simple too. On the Java side, we can use the Kotlin `thread` constructor to create a thread. The constructor accepts several optional parameters, but the last parameter is required — it is the task the new thread executes. Once the task finishes, the thread exits automatically and its resources are reclaimed by the system.
```kotlin
fun simpleThread(){
        thread(name = "SimpleThread") {
            Log.i("TAG","task start")
            Thread.sleep(1000)
            Log.i("TAG","task end")
        }
    }
```
In C++, there are two ways to use threads: one is the standard library's `std::thread`, and the other is the C library's `pthread`. However, for cross-platform convenience, I usually prefer the C++ standard library. Its usage is similar to Kotlin.
```c++
#include <string>
#include <thread>
#include <chrono>
#include <android/log.h>

void simpleThread(){
    std::thread t{std::move([](){
        __android_log_print(ANDROID_LOG_INFO,"TAG","Task start from jni");
        std::this_thread::sleep_for(std::chrono::seconds(1));
        __android_log_print(ANDROID_LOG_INFO,"TAG","Task end from jni");
    })};
}
```
As you can see, creating a new thread in C++ is also easy. However, if you run the code above, you'll find that the app crashes:
```shell
Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE)
std::terminate()
std::__ndk1::thread::~thread()
```
This is because when the `simpleThread` function exits, the scope of the thread object `t` is about to end, so the thread object must be destroyed. But at this moment the task executed by `t` hasn't finished yet, so it cannot be destroyed. The system doesn't know whether you want to end the thread or wait for the thread task to finish, so it throws an error. The fix is simple: you can use the member method `join` of `t` to wait for the thread task to finish, or you can use the member method `detach` to let the thread live on until it finishes its task and destroys itself.
Here we want the thread to destroy itself after finishing its task, so adding the following code solves the problem.
```c++
t.detach();
```
You might be curious why C++ needs this extra step compared to Kotlin. Actually, Kotlin also has a corresponding API, but since it's based on the JVM, it has automatic garbage collection, so we don't have to make that decision.
This model is very simple. Besides deciding when to start the thread and what task it executes, we know almost nothing about the thread's state. Many times we'd like to have more awareness of the thread state so we can plan new tasks.
### Notifying State with Callbacks
A mature solution is to use callbacks. A callback is the simplest solution: we define a callback function, pass the thread state through the callback, and let the main thread read the desired result. But callbacks only solve the problem of reading state; they don't switch the thread context. So this approach is only suitable for scenarios where the thread context doesn't matter.
```c++
void simpleThread(std::function<void()> func){
    std::thread t{[func=std::move(func)](){
        __android_log_print(ANDROID_LOG_INFO,"TAG","Task start from jni");
        std::this_thread::sleep_for(std::chrono::seconds(1));
        __android_log_print(ANDROID_LOG_INFO,"TAG","Task end from jni");
        func();
    }};
    t.detach();
}
```
In the example above, I added a callback function and executed it after the child thread's task finished. This way, we can learn the task's result after the sub-task completes.
```shell
14:11:29.714 11117 SimpleCPP    top.deepthinking.blogsample I Task start
14:11:29.714 11117 SimpleCPP    top.deepthinking.blogsample I Task end
14:11:29.717 11192 SimpleCPP    top.deepthinking.blogsample I Task start from jni
14:11:29.718 11191 SimpleKotlin top.deepthinking.blogsample I task start
14:11:30.718 11192 SimpleCPP    top.deepthinking.blogsample I Task end from jni
14:11:30.718 11192 SimpleCPP    top.deepthinking.blogsample I Task callback
14:11:31.719 11191 SimpleKotlin top.deepthinking.blogsample I task end
```
## Data Not Read and Written Simultaneously Between Main and Child Threads
In the previous model, we could execute parallel tasks with threads and use callbacks to know the state of the parallel tasks. But it also introduced a new problem — the task state runs on the child thread. This problem is fatal for UI application development, because many thread states are used to change the UI. Now that the thread state runs on the child thread, the UI can't be changed directly; it can only be updated indirectly, which adds complexity. So the callback approach isn't a good one.
That's why we have Future. A Future represents an asynchronous operation whose result can be obtained on the main thread. Compared to callbacks, it can not only retrieve the result of the operation, but also switch thread contexts. It's a mature async-to-sync solution, so both Kotlin and C++ provide Future.
In Kotlin, Future is usually used together with a thread pool — you submit a task to the pool, the submission interface returns a Future object, and through the Future object you can obtain the result of the asynchronous operation.
```kotlin
private fun futureThread(): Future<Boolean> {
    val executor = Executors.newSingleThreadExecutor()
    return executor.submit(Callable<Boolean> {
        Log.i(FUTURE_TAG, "task start")
        Thread.sleep(2000)
        Log.i(FUTURE_TAG, "task end")
        true
    })
}
```
In C++, using Future requires including the `future` header, which mainly provides two classes and a four-step process to complete the async-to-sync conversion.
First, create a `std::promise<T>` variable. The template parameter represents the return value of the thread task.
```c++
std::promise<bool> promise;
```
Second, create a child thread and pass the `std::promise<T>` variable into it. There's a key point here: the `std::promise<T>` variable can only be passed by reference or pointer, meaning both threads must use the same object.
```c++
void futureThread(std::promise<bool>& promise){
    std::thread t{[&promise](){
        __android_log_print(ANDROID_LOG_INFO,FUTURE_TAG,"Task start from jni");
        std::this_thread::sleep_for(std::chrono::seconds(1));
        __android_log_print(ANDROID_LOG_INFO,FUTURE_TAG,"Task end from jni");
        promise.set_value_at_thread_exit(true);
    }};
    t.detach();
}
```
Third, on the main thread, obtain the `std::future<T>` object through the `get_future()` method of the `std::promise<T>` variable.
```c++
auto future=promise.get_future();
```
Finally, start the child thread, and on the main thread obtain the thread task's result through the `get()` method of the `std::future<T>` object.
```c++
futureThread(promise);
auto value=future.get();
```
With Future, we moved the task state from the child thread to the main thread, but this introduced a new problem — the main thread is blocked.

```shell
14:23:14.782 16246 FutureCPP    top.deepthinking.blogsample I Task start
14:23:14.783 16365 FutureKotlin top.deepthinking.blogsample I task start
14:23:14.783 16366 FutureCPP    top.deepthinking.blogsample I Task start from jni
14:23:15.784 16366 FutureCPP    top.deepthinking.blogsample I Task end from jni
14:23:15.785 16246 FutureCPP    top.deepthinking.blogsample I Task end with true
14:23:16.784 16365 FutureKotlin top.deepthinking.blogsample I task end
14:23:16.784 16246 FutureKotlin top.deepthinking.blogsample I Task result true
```
Is there a way to return the result to the main thread without blocking it? The answer is yes — on the Java side, we can use Handler.
On the main thread, we first create a Handler, and then use the Handler in the child thread to send a message to the main thread. This way we can successfully return the thread task result to the main thread.
```kotlin
private fun handler(){
        Log.i(HANDLER_TAG, "Task start")
        val handler= Handler(Looper.getMainLooper()) { msg ->
            Log.i(HANDLER_TAG, "task end with ${msg.what}")
            true
        }
        thread(name = "HandlerThread") {
            Log.i(HANDLER_TAG, "task start")
            Thread.sleep(2000)
            Log.i(HANDLER_TAG, "task end")
            handler.sendEmptyMessage(1)
        }
    }
```
And we get the following result.
```shell
15:05:20.558 3033 HandlerKotlin top.deepthinking.blogsample I Task start
15:05:20.563 3086 HandlerKotlin top.deepthinking.blogsample I task start
15:05:22.564 3086 HandlerKotlin top.deepthinking.blogsample I task end
15:05:22.565 3033 HandlerKotlin top.deepthinking.blogsample I task end with 1
```
Of course, if you're familiar with Kotlin coroutines, you don't need Handler at all. Coroutines can not only solve the thread-switching problem, but also make it easy to cancel and obtain computation results. If you're particularly fond of Rx, then Rx is also a good choice.
Although coroutines are great, there are some scenarios where they can't meet our requirements.
## Data Read and Written Simultaneously Between Main and Child Threads
For data streams, the solutions above already handle things quite well. But many times we need multiple threads to work together. Collaborative work requires exchanging data between threads. The data flow is no longer unidirectional and predictable like in the previous two cases — instead, it flows between different threads at every moment.
Let's start with the simplest case — two threads modifying the same data. Consider this simple example:
```kotlin
private fun dataRace() {
    var target = 0
    thread {
        for (i in 0 until 10000) {
            target+=1
            Log.i(RACE_TAG,"t1 $target")
        }
    }
    thread {
        for (i in 0 until 10000) {
            target+=1
            Log.i(RACE_TAG,"t2 $target")
        }
    }
}
``` 
Running this program, as expected, the final printed result should be 20000, right? But actually it isn't — it might be 20002, 19994, 19989, and so on.
```shell  
22:14:41.001 12690 RaceKotlin top.deepthinking.blogsample I total = 20002
```
This phenomenon where the data doesn't match expectations is called a data race. But why does it happen? We know that a thread is the smallest unit of resource allocation and scheduling. When a thread is created, it owns its own resources that are not shared with other threads. When a thread accesses external resources, it always does so through its private resources, and the operating system then synchronizes the changes to main memory. These are two separate steps, and the operating system may pause or resume a thread at any moment when scheduling. At some moment, after one thread has completed the first step, its time slice is preempted by another thread, which happens to be operating on the same data and completes its operation smoothly. The final result is that both threads updated the data, but the data was only updated once in the end. And that's just one case; under the influence of many uncertain factors, the data ends up not matching expectations.
Once we know the cause, the solution is clear: either make the operation a single step, or make the two steps uninterruptible. Combining both into one technique gives us atomic operations. Both C++ and Kotlin provide atomic operation solutions.
### Atomic Operations
Since the atomic operation interfaces are basically the same, I'll use Kotlin to demonstrate. For C++, you just need an extra step of including the `atomic` header. We'll directly modify the previous example. The modification is simple: replace `Int` with `AtomicInteger` and change the addition to `incrementAndGet()`.
```kotlin
private fun dataRace() {
    val target = AtomicInteger(0)
    thread {
        for (i in 0 until 10000) {
            target.incrementAndGet()
            Log.i(RACE_TAG,"t1 $target")
        }
    }
    thread {
        for (i in 0 until 10000) {
            target.incrementAndGet()
            Log.i(RACE_TAG,"t2 $target")
        }
    }
}
```    
After modifying the code with atomic operations, we got 20000 as desired. But although it solves the consistency problem, it can't do much more.
In thread collaboration, data is often diverse and interdependent. When one piece of data is updated, another must be updated as well, and this update chain must also be uninterruptible — otherwise the final result becomes unpredictable. Atomic operations only solve the consistency problem of a single piece of data. Solving the consistency problem among multiple pieces of data requires new ideas and tools.
This time, let's use C++ to demonstrate this phenomenon:
```c++
void lock(){
    static std::atomic<int> counter{0};
    static std::atomic<int> task{0};

    auto countTask{[&](int id){
        for(int i=0;i<10000;++i){
            ++counter;
            std::this_thread::yield();
            ++task;
            if(counter.load()!=task.load()){
                __android_log_print(ANDROID_LOG_INFO,LOCK_TAG,"Thread %d,counter %d,task %d",id,counter.load(),task.load());
            }
        }
    }};
    std::thread t1{countTask,1};
    std::thread t2{countTask,2};
    t1.detach();
    t2.detach();
}
```
There are two key points in the code. First, both `std::atomic` variables are static, which guarantees that the variables remain valid during thread execution after the function finishes. Second is `std::this_thread::yield()` — between updating the two data values, I used this method to yield the time slice, simulating the scenario where a data update gets interrupted. Part of the execution results of this code are shown below.
```shell
09:32:07.477 25383 LockCPP top.deepthinking.blogsample I Thread 2,counter 18650,task 18649
09:32:07.477 25382 LockCPP top.deepthinking.blogsample I Thread 1,counter 18651,task 18650
09:32:07.477 25383 LockCPP top.deepthinking.blogsample I Thread 2,counter 18652,task 18651
09:32:07.477 25382 LockCPP top.deepthinking.blogsample I Thread 1,counter 18653,task 18652
09:32:07.477 25383 LockCPP top.deepthinking.blogsample I Thread 2,counter 18654,task 18653
```
Going back to the most basic model, why don't these problems exist in a single-threaded context? Because in a single-threaded model, even if the thread is suspended, when it resumes, the data is still in its previous state. In a multi-threaded context, when one thread is suspended, other threads also perform modification operations, disrupting the originally consistent data. So we find that to guarantee data consistency, we need to ensure that these data are modified simultaneously. For this situation, our predecessors introduced the lock solution.
### Locks
As the name suggests, the concept and usage of locks are the same as in the real world — except that locks in code are used to lock resources. A lock is like the door of a bathroom on a train; the people queuing for the bathroom are like the threads accessing a resource. When the bathroom is empty, the door is open, and anyone who wants to use it can walk right in. Once someone enters the bathroom and locks the door, the bathroom is isolated from the outside. Anyone outside who wants to use the bathroom then has to keep checking its status, and can only use it after the previous user leaves. Meanwhile, the person inside has exclusive access to the bathroom resource — as long as they haven't left, no one outside can get in. Locks solve the problem of multiple threads accessing the same resource and guarantee the atomicity of resource access.
Just like its concept, using it follows the same steps as using a lock in real life, for a total of three steps:
1. Acquire the lock
2. Use the lock
3. Release the lock

By adding a little code to the previous example, we can achieve consistent modification of the resource.
```c++
void lock(){
    static std::atomic<int> counter{0};
    static std::atomic<int> task{0};
    static std::mutex mutex;

    auto countTask{[&](int id){
        for(int i=0;i<10000;++i){
            std::lock_guard<std::mutex> lock{mutex};
            ++counter;
            std::this_thread::yield();
            ++task;
            if(counter.load()!=task.load()){
                __android_log_print(ANDROID_LOG_INFO,LOCK_TAG,"Thread %d,counter %d,task %d",id,counter.load(),task.load());
            }
        }
    }};
    std::thread t1{countTask,1};
    std::thread t2{countTask,2};
    t1.detach();
    t2.detach();
}
```
The code adds a `std::mutex`, which is the lock. It provides interfaces for acquiring and releasing the lock. Once a thread acquires the lock through its `lock` method, the resource remains exclusively held by it until it releases the lock itself. The example doesn't manually call `lock` or `unlock`, because `std::lock_guard` automatically calls `lock` when the object is created, and when the object goes out of scope and is destroyed, it automatically calls `unlock`. So no manual calls are needed.
After this modification, we find that abnormal results no longer appear, successfully protecting the consistency of the data chain.
There isn't only competition between threads — there's also cooperation. The previous examples all described competition, but cooperation is equally indispensable, and its method is inter-thread communication.
## Inter-thread Communication
We know that the running state of a thread is unknowable — a thread that starts first doesn't necessarily finish first, and a thread that starts later doesn't necessarily finish later. So when two threads work together on the same task, we can't assume the running state of the task in different threads; instead we need data synchronization. Data synchronization can use the atomic operations or locks introduced earlier. However, to learn about new states in a timely manner, an otherwise idle thread would have to keep polling, which costs extremely high CPU resources. Although in some scenarios you can find a suitable polling interval through experimentation, in most scenarios it's not realistic. To solve this problem, condition variables were introduced.
Condition variables have two operations: wait and notify. First, use a lock to lock the shared resource, update the data, then release the lock resource and use the condition variable's `notify_one` or `notify_all` to notify other waiting threads. In the other thread, you also need to acquire the lock first, because you'll use the shared resource, then call the condition variable's `wait` to wait for the resource update to finish. `wait` releases the lock resource while waiting, until it's woken up by another thread. The woken thread re-acquires the lock and continues executing.
```c++
void cond() {
    static int counter{0};
    static std::condition_variable con;
    static std::mutex mutex;
    static bool used = false;

    std::thread t1{[]() {
        for (int i = 0; i < 10; ++i) {
            {
                std::unique_lock lk{mutex};
                con.wait(lk, []() { return !used; });
                __android_log_print(ANDROID_LOG_INFO, COND_TAG, "Use counter %d ", counter);
                used = true;
            }
            con.notify_one();
        }
    }};
    std::thread t2{[]() {
        for (int i = 0; i < 10; ++i) {
            {
                std::lock_guard<std::mutex> lk{mutex};
                ++counter;
                used = false;
                __android_log_print(ANDROID_LOG_INFO, COND_TAG, "Create counter %d ", counter);
            }
            con.notify_one();
            std::unique_lock lk{mutex};
            con.wait(lk, []() { return used; });
        }
    }};
    t1.detach();
    t2.detach();
}
```
The code demonstrates the producer-consumer model. The producer thread t2 first creates data, then notifies the consumer t1 to use it, and itself enters the waiting state. The consumer t1 waits by default, until t2 notifies it that the data is ready. After consuming the data, it notifies t2 to continue producing. The two threads cooperate with each other to complete the work together. Part of their execution results are shown below.
```shell
23:19:22.120 28463 CondCPP top.deepthinking.blogsample I Create counter 7 
23:19:22.120 28462 CondCPP top.deepthinking.blogsample I Use counter 7 
23:19:22.120 28463 CondCPP top.deepthinking.blogsample I Create counter 8 
23:19:22.120 28462 CondCPP top.deepthinking.blogsample I Use counter 8 
23:19:22.120 28463 CondCPP top.deepthinking.blogsample I Create counter 9 
23:19:22.120 28462 CondCPP top.deepthinking.blogsample I Use counter 9 
23:19:22.120 28463 CondCPP top.deepthinking.blogsample I Create counter 10 
23:19:22.120 28462 CondCPP top.deepthinking.blogsample I Use counter 10 
```
The key to condition variables is understanding that the lock is released while waiting and re-acquired after being woken up. As long as you set up the wait condition properly and use it together with locks, you can achieve inter-thread communication.
## Threads in JNI
Handling JNI is trickier. Let's look at the simplest example: passing JNI parameters into a thread for processing.
First, let's look at the JNI parameters.
```c++
extern "C" JNIEXPORT void JNICALL
Java_top_deepthinking_jnithread_NativeLib_execute(
        JNIEnv *env,
        jobject obj) {
    auto cls=env->GetObjectClass(obj);
    auto id=env->GetMethodID(cls,"test","()V");
    jni(env,obj,id);
}
```
It prepares the parameters, then calls the `jni` function.
```c++
void jni(JNIEnv* env,jobject obj,jmethodID id){
    std::thread t{[env,obj,id](){
        __android_log_print(ANDROID_LOG_INFO, JNI_TAG, "In thread");
        env->CallVoidMethod(obj,id);
    }};
    t.detach();
}
```
It directly calls a Java-side method in the child thread. It looks fine, doesn't it? But when you actually run this code, the app crashes with the error: `java_vm_ext.cc:591] JNI DETECTED ERROR IN APPLICATION: a thread (tid 7521 is making JNI calls without being attached`.
This error occurs because `JNIEnv` is private to each thread. Whenever a thread needs to call JNI functions, it must properly initialize its own `JNIEnv`. How do you initialize it? Through the `AttachCurrentThread` method of `JavaVM`, and `JavaVM` is obtained by implementing `JNI_OnLoad(JavaVM *vm, void *reserved)`.
```c++
static JavaVM* g_vm= nullptr;
extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved){
    g_vm=vm;
    return JNI_VERSION_1_6;
}
```
Once we have the `JavaVM`, we can initialize `JNIEnv` in the thread. So we modify the `jni` function as follows.
```c++
void jni(jobject obj,jmethodID id){
    std::thread t{[obj,id](){
        JNIEnv* env= nullptr;
        auto res=g_vm->AttachCurrentThread(&env, nullptr);
        if(JNI_OK!=res){
            return;
        }
        __android_log_print(ANDROID_LOG_INFO, JNI_TAG, "In thread");
        env->CallVoidMethod(obj,id);
        g_vm->DetachCurrentThread();
    }};
    t.detach();
}
```
Once `JNIEnv` is initialized successfully, you must call `DetachCurrentThread` to detach the JNI environment before the thread ends, so that resources can be cleaned up. After this modification, will the app run successfully? The answer is still no — this time it's a new crash: `java_vm_ext.cc:591] JNI DETECTED ERROR IN APPLICATION: JNI ERROR (app bug): jobject is an invalid JNI transition frame reference: 0x7fe31f1428 (use of invalid jobject)`. This error occurs because JNI parameters are local references. After the JNI call ends, these local variables become invalid. Obviously, by the time `obj` is used in the child thread, the JNI call has long since finished, so the app crashes.
The fix is also simple: since the parameters are local, just upgrade them to global variables, and conveniently `JNIEnv` provides `NewGlobalRef` for exactly this purpose.
So let's modify the `jni` function again, as follows.
```c++
void jni(JNIEnv* env,jobject obj,jmethodID id){
    std::thread t{[obj=env->NewGlobalRef(obj),id](){
        JNIEnv* env= nullptr;
        auto res=g_vm->AttachCurrentThread(&env, nullptr);
        if(JNI_OK!=res){
            return;
        }
        __android_log_print(ANDROID_LOG_INFO, JNI_TAG, "In thread");
        env->CallVoidMethod(obj,id);
        env->DeleteGlobalRef(obj);
        g_vm->DetachCurrentThread();
    }};
    t.detach();
}
```
`NewGlobalRef` upgrades `obj` to a global reference, so `obj` can be used continuously in the child thread. However, just like with `JNIEnv`, once the object is no longer used, you must call `DeleteGlobalRef` to delete the global reference so that resources can be cleaned up.
After this modification, the app runs successfully.
```shell
23:28:22.345 5236 JniCPP    top.deepthinking.blogsample I In thread
23:28:22.347 5131 KotlinLib top.deepthinking.blogsample I test in kotlin
```
To summarize, using threads in JNI requires considering the following points:
- `JNIEnv` is private to each thread. When calling JNI functions, you need to use `AttachCurrentThread` to initialize `JNIEnv`, and call `DetachCurrentThread` to detach the JNI environment before the thread exits, so that resources can be cleaned up.
- JNI parameters are local references. For asynchronous calls, you need to use `NewGlobalRef` and `DeleteGlobalRef` together to upgrade them to global references, ensuring data validity.
## Summary
Threads are an important and fundamental topic in development, and they can be modeled by their data usage scenarios. If the data isn't sensitive to the thread context, then callbacks are a simple and efficient approach. If the data needs to return to the current thread after processing, then Handler or Future is a good choice. Handling data streams is where Kotlin coroutines shine. The most complex scenario is multiple threads operating on data simultaneously — if you only need multiple threads to share a single piece of data, atomic operations suffice. If you need to restrict access to a resource or limit certain uninterruptible operations, then locks were designed for that. If multiple threads need to coordinate data, condition variables are indispensable. And because of the special nature of data in the JNI environment, you need to use global references and `JNIEnv` together.

Alright, that's all for this edition. As the saying goes, "the green mountains stay, the rivers flow on" — see you next time.

[Source Code](https://github.com/zevarc/BlogSamples)
