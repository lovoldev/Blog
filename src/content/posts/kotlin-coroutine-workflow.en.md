---
title: "Workflow for Using Kotlin Coroutines"
description: "How to create, schedule, combine, and cancel coroutines"
date: 2021-03-27
updated: 2021-03-27
tags: ["Android","Kotlin","Coroutine"]
draft: false
---

> The previous article partially explained Kotlin coroutines from a theoretical point of view, and this article will continue the journey of coroutines from a practical point of view, based on the previous article.

## From the source
In Kotlin, in order to use a coroutine, it first needs to be created using a co-creator, but there's another prerequisite - a co-program scope (`CoroutineScope`). In early Kotlin implementations, the coroutine creator was a first-class function, meaning that we could create a coroutine anytime, anywhere with the coroutine creator. However, after the official release of coroutines, the coroutine creator needs to be created on a coroutine scope object, and Kotlin added coroutine scopes to enable structured concurrency. What is structured concurrency? In layman's terms, it is the ability to properly implement multiple coroutines for monitoring and management. In practice, we may need to create multiple coroutines to accomplish different tasks. In order to manage these unrelated coroutines, Kotlin introduced the coroutine scope, through a certain coroutine scope created by the coroutine will be managed by it, in the conditions are met, the execution of each coroutine to cancel the work or to end their own.

To make it easier for us to get started straight away, `MainScope` and `GlobalScope` are officially provided for us to use. As the name suggests, they have different application scenarios, the former is more suitable for UI-related classes, while the latter is suitable for classes that need to survive throughout the application lifecycle. Of course, for Android developers, we actually have a better option - using the Kotlin extension for `ViewModel`, which not only has all the coroutine scoping functionality out of the box, but also implements auto-cancellation in the `onCleared` method.

## Creating a Coroutine
With the scope of the coroutine in place, let's create the simplest possible coroutine.
```kotlin
viewModelScope.launch{
    //Here is the code for the coroutine.
    delay(2000)
    System.out.println("Hello World")
}
```
`launch` creates and starts a concatenation, and two seconds after the concatenation is started, Hello World is printed on the control lift, and then the concatenation is terminated (the coroutine has a full life cycle). The work done by this coroutine is limited, we can use threads to accomplish the same function
```kotlin
thread {
            Thread.sleep(2000)
            System.out.println("Hello World")
        }
```
As we can see, excluding the constructor, the only difference between the two pieces of code is the delay functions - `delay` and `Thread.sleep`. Functionally they both delay the execution of the code behind them, but the effect is different in that the former doesn't block the thread. This code is actually executed in the main thread, but it doesn't affect the UI drawing, whereas if the latter is executed in the main thread, the application will be unresponsive for two seconds.Kotlin calls this kind of function, which doesn't block the execution of the current thread, a suspend function, which can be used to disconnect from the current thread at the start of the suspension and allow the thread to idle and complete other operations. When the conditions are met, the pending function is restored at the starting point, and then the code is executed.

There's still a small problem that hasn't been solved. In my last post, I said that a pending function can only be executed in a pending function, and since `delay` is a pending function, then by inverse, our block of code should also be a pending function, and this pending function is the so-called coroutine body.

## Getting a coroutine to work across threads
If you see the code above and then turn around and write a network request inside the body of the coroutine, you will find that your application crashes, what is going on? Because although the coroutine will not block the main thread, the main thread is not allowed to make network requests. If at this point you rush to the conclusion that coroutines are useless, then you are shallow. Let's change the above code a little so that it runs in a sub-thread.
```kotlin
viewModelScope.launch (Dispatchers.IO){
    //Here is the code for the coroutine.
    delay(2000)
    System.out.println("Hello World")
}
```
Good, now the network request inside the body of the concatenation can be executed smoothly, but soon some readers will find a new problem - how can I pass the result of the network request back to the main thread, can't I still get a `Handler`, what's the difference between that and using the thread directly, hot chicken coroutine. Hey, don't worry, this coroutine actually takes care of that for the guest. Let's revamp the code again:
```kotlin
viewModelScope.launch (Dispatchers.IO){
    //Here is the coroutine code la la la la la la, here is the code executed in the sub-thread Oh!
    //Let's pretend this is a web request.
    delay(2000)
    withContext(Dispatchers.Main) {
        //Oh, I can't believe this is running in the main thread.
        System.out.println("Hello World")
    }
}
```
Great, we can happily use coroutines to handle network requests, so how did all this magic happen, stop and let's revisit the code above.

First of all, compared to the code at the very beginning, we have two more objects and one more method call in our code. First let's look at those two objects, which we can easily guess from the names are the scheduling threads.
Kotlin provides four common implementations

- `Default`, which is the default scheduler used by standard coroutine builders, works with a shared thread pool, and is suitable for computational tasks;

- `Main`, which is the scheduler that represents the UI thread, usually there is only one thread, using this scheduler it is possible to manipulate the UI directly in the coroutine; `Unconfined`, which is the default scheduler used by standard coroutine builders, working with a shared pool of threads, for computationally oriented tasks.

- `Unconfined`, which is not thread-scoped, and executes the initial code in whichever thread it is called in until it encounters a hung function, after which it resumes using the scheduler specified by the hung function, and this process can continue forever.

- `IO`, is used to carry blocking IO operations, such as file reads and writes, network connections, etc., is our more commonly used scheduler.

So those two scheduler objects are the magic that allows the coroutines to switch working environments. There's another method call that comes next that isn't explained. What `withContext` does is switch the current coroutine scheduler to the specified scheduler, and with that scheduler proceed to execute the code in the building block. It is also a pending function. When we think of a pending function, we think of it as being resumable. So when the execution of the block of code in the pending function is complete, it will automatically revert to the original scheduler and continue to the next execution.

## Serializing two asynchronous operations with a coroutine
In project development, there is another common application scenario where the client needs to request some configuration information first, and then use the configuration information to request the real content information. This process is described as serial, but the code is written in a fragmented way, you need to process the first network request callback and initiate a second request, and then in the second callback to get the real need to show the data, maybe this process will also be added to a store, or trigger another request for work, then finished, the code can not be seen. In the past, this situation would usually use RxJava, but RxJava code readability is still almost meaningless. So what can a Kotlin coroutine look like?
```kotlin
viewModelScope.launch(Dispatchers.IO) {
            val retrofit=Retrofit.Builder().build()
            val apiUser=retrofit.create(APIUser::class.java)
            val user=api.current()
            val detail=api.userDetail(user.id)
            withContext(Dispatchers.Main) {
                userLiveData.value=detail
            }
        }
```
It's exactly the same as if we were writing normal synchronized code, there are no callbacks or other costs, and the process can even be added all the time. In fact, I think this is the real power of coroutines.

## Getting multiple coroutines to work together
Let's continue to complicate the usage scenario - I'm working on a notes app for multi-end use, and now the user opens one of the pre-existing notes, and in order to allow the user to quickly navigate to the information about the last operation, on one hand I need to read the result of the last operation from the file, and on the other hand I need to pull the result of the remote operation, and then make a decision about the The two results are merged to determine the final display data. Considering that these two operations are actually parallel, the idea we had above of having the coroutines connected in series no longer applies, because the operations inside the coroutines are serial. Since one coroutine can't solve it, can we add another one? It looks like we can, but how do we get the results of the coroutine's operations? Looking at the API, I found another coroutine builder, `async`. It returns a coroutine object and then gets the result of the coroutine's computation via the `await` method. Here's the idea, let's do it now
```kotlin
 val fileResult=viewModelScope.async(Dispatchers.IO) {
             //Let's pretend it's code to read a file.
             1
         }
 val networkResult=viewModelScope.async(Dispatchers.IO) {
     //It's also code that pretends to be a web request
     2
 }
 val fResult=fileResult.await()
val rResult=networkResult.await()
val result=if(fResult>rResult){
    fResult
}else{
    networkResult
}
```
Then you'll see that the error is reported, `await` is the pending function. It seems that two coroutines won't do the job, it takes three, so let's create a third one.
```kotlin
 //The first two coroutines remain unchanged
 viewModelScope.launch {
     val fResult=fileResult.await()
     val rResult=networkResult.await()
     val result=if(fResult>rResult){
         fResult
     }else{
         networkResult
     }
}
```
This is the basic communication between the coroutines to write it, from this basis, and even can be derived from a more complex version, but all changes are not the same, can refer to this idea to complete.

## Cancellation of a Coroutine
As mentioned before, a coroutine has a complete life cycle similar to that of a thread, including creation, activation, completion (canceling), and completion (canceled). A coroutine has its own cancel API, `cancel`, which can be used. All we need to do is to save the coroutine object returned by the coroutine's creator. Of course it's more common to cancel using a coroutine scope as mentioned at the beginning of the article. This action will cancel all the coroutines.

## Summary
This article from the beginning of the creation of concurrent programs, about how to write asynchronous code with concurrent programs, how to make multiple concurrent programs work together, although covering a large part of the use of scenarios, but there are still omissions. Due to space constraints, the missing parts will be continued in the next blog post, I hope you continue to pay attention.
