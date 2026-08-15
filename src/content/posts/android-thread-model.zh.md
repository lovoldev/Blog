---
title: "Android开发中的线程模型和解决思路"
description: "Android开发中Java、C++、JNI线程的使用场景与常见问题（数据竞争、跨线程通信等），以及对应的解决思路：回调、Future、Handler、原子操作、锁、条件变量，以及JNIEnv在子线程中的正确使用。"
date: 2024-12-28
updated: 2024-12-28
tags: ["Android","JNI","线程"]
draft: false
cover: /images/cover/android-thread-model.webp
---

>在Android开发中，线程扮演着重要的角色，虽然随着协程技术的普及，纯应用层开发中，线程的使用已经不是问题，但是对于JNI开发，至少有一半的崩溃是线程相关问题引起的。所以本文将用实战的方式，逐步向读者揭示JNI开发中使用线程可能遇到的问题，并提供自己的解决思路。

一个概念的引入是为了解决某些新问题，**线程就是为了解决多任务并行**而引入的概念。但是引入新概念必定也会引入新的问题，线程引入的主要问题就是数据竞争，而JNI开发中却不仅仅有数据竞争，让我们逐步揭开线程的神秘面纱吧。
## 使用线程的三种场景
在之前的文章（[NDK开发概论](/zh/posts/android-ndk-primer)）中，我简单地把JNI开发分为了三个部分：一部分是Java开发，一部分是C++开发，然后通过JNI将两部分连接起来。这三部分都会涉及到线程开发相关的问题。
前面也提到过线程间主要的问题是数据竞争，但是并不是所有场景都存在数据竞争。为了对线程开发有比较全面的理解，我们可以通过对使用场景建模，来从简单到复杂，对线程问题做个比较全面的概括。为了方便阐述，下文中使用的主线程代表当前的执行环境，子线程代表通过主动创建线程得到的线程环境。
## 数据只在子线程中读写
线程的主要功能是执行并行任务，最简单的任务就是给它个输入，它根据输入和执行代码，得到执行结果，然后结束执行。这是线程中最简单的模型，和传统的单线程开发一样，只多了个线程创建的内容。
所以这种场景下开发多线程应用也很简单。如Java部分，我们使用Kotlin中的`thread`构造器就能创建线程。构造器接收多个可选参数，但是必须有最后的参数，这个参数就是新线程的执行任务，当执行任务完成后，线程就自动退出，相关资源也会被系统回收。
```kotlin
fun simpleThread(){
        thread(name = "SimpleThread") {
            Log.i("TAG","task start")
            Thread.sleep(1000)
            Log.i("TAG","task end")
        }
    }
```
C++中，使用线程有两种方式：一种是使用标准库的`std::thread`，另一种是使用C库中的`pthread`，不过通常为了跨平台方便，我是习惯使用C++的标准库。使用方式也和Kotlin差不多。
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
可以看到，在C++中，创建一个新线程也很容易。不过，假如你运行上面的代码，你会发现应用奔溃了：
```shell
Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE)
std::terminate()
std::__ndk1::thread::~thread()
```
这是因为线程在simpleThread函数退出时，线程对象`t`的作用域也即将结束，需要销毁线程对象。但是这时候`t`执行的线程任务还没有结束，不能销毁。系统不知道你到底要结束线程，还是等待线程任务结束，所以抛出了错误。解决方法也很简单，你可以使用`t`的成员方法`join`，等待线程任务结束，也可以使用`t`的成员方法`detach`，让线程暂时保留直到执行完任务后自己销毁。
这里我们希望线程能在执行完任务后自己销毁，所以添加以下代码就可以解决这个问题
```c++
t.detach();
```
也许你会好奇，为了C++会比Kotlin多这个步骤呢？其实Kotlin也有相应的API，只不过它是基于JVM的，它有自动回收功能，所以不需要我们做决定。
这个模型很简单，我们除了能决定什么时候启动线程和执行的线程任务外，对线程状态几乎一无所知。很多时候我们可能希望对线程状态有更多的感知能力，从而规划新的任务。
### 使用回调通知状态
一种成熟的方案是使用回调。回调是一种最简单的解决方案，我们可以通过定义回调函数，在回调中传递线程状态，而从让主线程读取到想要的结果。但是回调只是解决了状态读取的问题，并没有转换线程环境。所以这种情况只能适用于对线程不敏感的场景。
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
上面的示例中，我增加了一个回调函数，并在子线程任务执行完后，执行回调函数。这样我们就能在子任务结束后，知道任务执行的结果了。
```shell
14:11:29.714 11117 SimpleCPP    top.deepthinking.blogsample I Task start
14:11:29.714 11117 SimpleCPP    top.deepthinking.blogsample I Task end
14:11:29.717 11192 SimpleCPP    top.deepthinking.blogsample I Task start from jni
14:11:29.718 11191 SimpleKotlin top.deepthinking.blogsample I task start
14:11:30.718 11192 SimpleCPP    top.deepthinking.blogsample I Task end from jni
14:11:30.718 11192 SimpleCPP    top.deepthinking.blogsample I Task callback
14:11:31.719 11191 SimpleKotlin top.deepthinking.blogsample I task end
```
## 数据在主子线程中不同时读写
在前面的模型中，我们通过线程，可以执行并行任务了，并且能使用回调，知道并行任务的状态。但是也引入了新问题——任务状态执行在子线程。这个问题对于UI应用开发是很致命的。因为很多线程状态是用来改变UI的，现在线程状态执行在子线程，无法直接改变UI，只能通过间接方式实现，这样增加了复杂度。所以回调方案并不是一个好方案。
于是我们有了Future。Future代表一个异步操作，可以在主线程获取到操作结果。也就是说它相比于回调，不仅可以获取到操作结果，还可以转换线程环境。它是一种成熟的异步转同步方案，所以Kotlin和C++都提供了Future。
在Kotlin中，Future通常和线程池一块使用——通过向线程池提交任务，提交接口会返回一个Future对象，通过Future对象可以获取到异步操作的结果。
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
在C++中，使用Future需要导入`future`文件头，里面主要提供两个类四个步骤来完成异步转同步操作。
首先创建一个`std::promise<T>`变量，这个范型参数代表线程任务的返回值。
```c++
std::promise<bool> promise;
```
第二步，创建一个子线程，并将`std::promise<T>`变量作为参数传递到子线程中。这里有个关键点，`std::promise<T>`变量只能通过引用或者指针传递，也就是两个线程使用的必须是同一个对象。
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
第三步，在主线程中通过`std::promise<T>`变量的`get_future()`方法获取到`std::future<T>`对象。
```c++
auto future=promise.get_future();
```
最后一步，启动子线程，并且在主线程中通过`std::future<T>`对象的`get()`方法获取线程任务的结果。
```c++
futureThread(promise);
auto value=future.get();
```
通过Future，我们把任务状态从子线程移动到主线程，但是又引入了新问题——主线程被阻塞了。

```shell
14:23:14.782 16246 FutureCPP    top.deepthinking.blogsample I Task start
14:23:14.783 16365 FutureKotlin top.deepthinking.blogsample I task start
14:23:14.783 16366 FutureCPP    top.deepthinking.blogsample I Task start from jni
14:23:15.784 16366 FutureCPP    top.deepthinking.blogsample I Task end from jni
14:23:15.785 16246 FutureCPP    top.deepthinking.blogsample I Task end with true
14:23:16.784 16365 FutureKotlin top.deepthinking.blogsample I task end
14:23:16.784 16246 FutureKotlin top.deepthinking.blogsample I Task result true
```
有没有不阻塞主线程，又能将结果返回主线程的方法呢，答案是有，在Java端，我们可以使用Handler来实现。
在主线程中，我们先创建一个Handler，然后在子线程中使用Handler向主线程发送消息。这样我们就可以成功把线程任务结果返回主线程了。
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
于是我们得到了以下结果。
```shell
15:05:20.558 3033 HandlerKotlin top.deepthinking.blogsample I Task start
15:05:20.563 3086 HandlerKotlin top.deepthinking.blogsample I task start
15:05:22.564 3086 HandlerKotlin top.deepthinking.blogsample I task end
15:05:22.565 3033 HandlerKotlin top.deepthinking.blogsample I task end with 1
```
当然，如果你熟悉Kotlin的协程，那么Handler就完全不需要了。协程不仅能解决线程切换的问题，还能轻松取消，获取计算结果等。如果你对Rx情有独钟，那么Rx也是一个不错的选择。
虽然协程很美好，但是有些场景却不能满足我们的要求。
## 数据在主子线程间同时读写
对于数据流，上面的这些方案已经能处理得很好了。但是在很多时候，我们需要多个线程协同工作。协同工作要求我们在多个线程间交换数据。数据不再像前面两种情况一样是单向的可预测的流向，而是每时每刻在不同的线程流转。
还是从最简单的情况开始讨论——两个线程修改同一个数据，让我们来看下面这个简单的例子：
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
运行这个程序，按照预期，最终打印的结果应该是20000对吧。但是实际上不是，可能是20002，19994或者19989等等。 
```shell  
22:14:41.001 12690 RaceKotlin top.deepthinking.blogsample I total = 20002
```
这种数据和预期不一致的现象叫作数据竞争。但是为什么会出现这种现象呢？我们知道线程是资源和调度的最小单位，线程被创建时都有属于自己的资源，这些资源不与其他线程共享。当线程内访问外部资源时，它总是通过私有资源访问，操作系统再将更改同步到主存中。这是两个步骤，操作系统在调度线程时可能在任意时刻暂停或者恢复线程。在某一时刻某一线程在执行完第一步后，时间片被另一个线程抢走了，恰巧这个线程也在操作这个数据，它的操作顺利执行完了。最终造成的结果是，两个线程都更新了数据，但是最终的数据只更新了一次。这还只是一种情况，在多种不确定因素的作用下，导致数据最终不符合预期。
知道了原因，解决方案也就很清晰了：要么让操作变成一步，要么让两步的操作是不可打断的，把两个方案糅合成一整招就是原子操作。C++和Kotlin都提供了原子操作的解决方案。
### 原子操作
由于原子操作接口都差不多，还是用Kotlin来演示，C++的只需要多个引入`atomic`文件头的步骤就可以了。我们直接在上面的例子的基础上修改，修改方式也很简单，直接把`Int`换成`AtomicInteger`，并把相加改为`incrementAndGet()`即可。
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
使用原子操作修改代码后，我们如愿以偿得到了20000，但是它虽然解决了一致性问题，但是却不能做得更多了。
在线程协作中，数据往往是多样的，并且相互依赖的，一个数据更新的同时，另一个数据也必须更新，这种更新链条也是不可打断的，不然同样会导致最终的结果不可预测。原子操作只是解决了单数据的一致性问题，而解决这种多数据之间的一致性问题需要新的思路和工具。
这次我们用C++来演示一下这种现象：
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
代码中有两个关键点，一个是两个`std::atomic`变量都是静态的，这保证函数执行完后，变量在线程执行中是有效的。另一个是`std::this_thread::yield()`，在更新两个数据的中间，我用这个方法让出了时间片，模拟数据更新时被打断的场景。这段代码执行的部分结果如下。
```shell
09:32:07.477 25383 LockCPP top.deepthinking.blogsample I Thread 2,counter 18650,task 18649
09:32:07.477 25382 LockCPP top.deepthinking.blogsample I Thread 1,counter 18651,task 18650
09:32:07.477 25383 LockCPP top.deepthinking.blogsample I Thread 2,counter 18652,task 18651
09:32:07.477 25382 LockCPP top.deepthinking.blogsample I Thread 1,counter 18653,task 18652
09:32:07.477 25383 LockCPP top.deepthinking.blogsample I Thread 2,counter 18654,task 18653
```
回到最基本的模型，为什么单线程时不存在这些问题呢？因为单线程模型中，即使线程被挂起了，下一次恢复的时候，数据还是之前的状态。而在多线程中，某个线程被挂起后，其他线程也会执行修改操作，打乱原本一致的数据。所以我们发现，要想保证数据的一致性，就需要保证这些数据被同时修改。针对这种情况，前辈们推出了锁的解决方案。
### 锁
顾名思义，锁的概念和用法都和现实中一样，只是代码里的锁是用来锁定资源的。锁就好比是火车上的卫生间的门，排队去卫生间的人就好比是访问资源的线程。在卫生间没人的时候，门是开着的，去卫生间的人就可以直接使用卫生间。一旦人进入卫生间后，把门锁上了，卫生间就和外部隔离开了。此时外面想再去卫生间的人就只能不断查看卫生间的状态，并且在上一个使用卫生间的人离开后才能使用卫生间。而在卫生间的人，就独占了卫生间这个资源，只要他没有离开，外面的人就进不去。锁的出现解决了多线程访问同一个资源的问题，能保证资源访问的原子性。
和它概念一样，在使用它也和现实中使用锁是一样的步骤，总共分三步
1. 获取锁
2. 使用锁
3. 释放锁
我们把上面的例子稍微添加点代码，就能实现资源的一致性修改。
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
代码中增加了一个`std::mutex`，这个就是锁了，它提供了获取锁和释放锁的接口。某个线程只要一旦通过它的`lock`获取到锁后，资源就一直会被它占有着，直到它自己释放锁。示例中并没有手动调用`lock`，`unlock`，因为`std::lock_guard`会在创建对象时自动调用`lock`，出了对象的作用域后，对象被销毁，就自动调用`unlock`，所以不需要手动调用。
经过这个修改后，我们发现，就不会出现异常的结果输出了，成功保护了数据链的一致性。
线程间不仅有竞争也有合作，前面的例子都在描述竞争的情况，但是合作也是不可或缺的部分，其合作的方式就是线程间通信。
## 线程间通信
我们知道线程的运行状态是不可知的，先开始运行的线程不一定先完成任务，后运行的线程也不一定后完成。所以在两个线程一起完成同一个任务时，不能假设任务在不同线程的运行状态，而是需要数据同步。数据同步可以使用前面介绍的原子操作或者锁。不过为了及时知道新的状态，原本空闲的线程就要不断轮询，这样做的代价就是占用了极高的CPU资源。虽然在某些场景可以通过实验找到合适的轮训间隔，但是大部分场景是不现实的。为了解决这种问题，又引入了条件变量。
条件变量有两种操作：等待和唤醒。首先使用锁锁定共享的资源，执行数据更新，更新后放弃锁资源，使用条件变量的`notify_one`或者`notify_all`通知其他的等待线程。在另一个线程，同样也是需要先获取锁，因为我们要使用共享的资源，然后调用条件变量的`wait`等待资源更新结束。`wait`等待时会放弃锁资源，直到被其他线程唤醒，唤醒的线程会重新获取到锁，并接着往下执行。
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
代码演示的是生产者-消费者模型，生产者线程t2先创建数据，然后通知消费者t1使用，自己则进入等待状态。消费者t1默认进入等待状态，一直等到t2通知它数据准备好了。它消费完数据后，接着通知t2继续生产数据。两个线程就这样相互配合一起完成工作。它们工作的部分结果如下
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
条件变量的关键在于理解等待时释放锁，唤醒后重新获得锁，只要设置好等待条件，配合锁的使用，就能实现线程间的通信。
## JNI中的线程
在处理JNI时，问题更加棘手。我们来看个最简单的例子，把JNI参数传递到线程中处理。
首先看看JNI参数
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
就是准备调用参数，然后调用`jni`函数
```c++
void jni(JNIEnv* env,jobject obj,jmethodID id){
    std::thread t{[env,obj,id](){
        __android_log_print(ANDROID_LOG_INFO, JNI_TAG, "In thread");
        env->CallVoidMethod(obj,id);
    }};
    t.detach();
}
```
在子线程中直接调用Java端方法。看着是不是没有问题，而实际上运行这段代码后，应用会奔溃，并输出错误：`java_vm_ext.cc:591] JNI DETECTED ERROR IN APPLICATION: a thread (tid 7521 is making JNI calls without being attached`。
这个错误是因为`JNIEnv`是线程私有的，只要线程需要调用JNI函数，它就必须正确初始化自己的`JNIEnv`。怎么初始化呢？通过`JavaVM`的`AttachCurrentThread`，而`JavaVM`又需要通过实现`JNI_OnLoad(JavaVM *vm, void *reserved)`来获取。
```c++
static JavaVM* g_vm= nullptr;
extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved){
    g_vm=vm;
    return JNI_VERSION_1_6;
}
```
得到了`JavaVM`后就能在线程中初始化`JNIEnv`了，所以我们把`jni`函数修改为如下。
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
一旦`JNIEnv`初始化成功后，在线程结束前，必须调用`DetachCurrentThread`分离JNI环境，以便清理资源。通过这次修改后，应用能成功运行吗？答案是还不行，这次是新的崩溃：`java_vm_ext.cc:591] JNI DETECTED ERROR IN APPLICATION: JNI ERROR (app bug): jobject is an invalid JNI transition frame reference: 0x7fe31f1428 (use of invalid jobject)`。这个错误是因为JNI参数都是局部的，在JNI调用结束后，这些局部变量就失效了，显然，`obj`在子线程使用时，JNI调用早就结束了，所以应用崩溃。
解决方法也很简单，既然参数是局部的，那么把它升级为全局变量就好了，而刚好`JNIEnv`有`NewGlobalRef`来实现这个目的。
所以，接着修改`jni`函数为如下
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
`NewGlobalRef`把`obj`升级为全局变量，这样在子线程中，`obj`就可以一直使用。不过和`JNIEnv`一样，在对象不再使用后，必须调用`DeleteGlobalRef`删除全局变量，以便清理资源。
这次修改后，应用能成功运行了
```shell
23:28:22.345 5236 JniCPP    top.deepthinking.blogsample I In thread
23:28:22.347 5131 KotlinLib top.deepthinking.blogsample I test in kotlin
```
总结一下，JNI线程的使用需要考虑以下几点：
- JNIEnv是线程私有的，调用JNI函数时，需要使用`AttachCurrentThread`初始化`JNIEnv`，并且在线程退出前调用`DetachCurrentThread`分离JNI环境，以便清理资源；
- JNI参数是局部的，涉及到异步调用，需要配合使用`NewGlobalRef`和`DeleteGlobalRef`来升级为全局变量，保证数据的有效性；
## 总结
线程是开发过程中重要且基础的话题，可以通过数据的使用场景对它们建模。如果数据对线程不敏感，那么回调就是简单高效的处理方法。如果数据经过处理后需要回到当前线程，那么Handler或者Future是个好选择。处理数据流是Kotlin协程的优势。最复杂的当属多线程同时对数据进行操作，如果仅仅需要多线程共享某个数据，那原子操作就足够了。如果需要对资源访问或者某些不可中断的操作进行限制，那么锁就是为它设计的。多线程之间需要协调数据，则少不了条件变量。JNI环境由于数据的特殊性，需要配合使用全局变量和JNIEnv。
好了，这期的分享就到这里，咱们青山不改，绿水长流，下期见。

[源码参考](https://github.com/zevarc/BlogSamples)
