---
title: "Core Concepts of Kotlin Coroutines: An Overview"
description: "An in-depth yet easy-to-understand explanation of several core concepts behind Kotlin Coroutines"
date: 2021-03-26
updated: 2021-03-26
tags: ["Android","Kotlin","Coroutine"]
draft: false
---

> Since their introduction, Kotlin Coroutines have gained increasing popularity among Android developers. Conversely, their extensive API surface has also posed a barrier for many. This article aims to demystify coroutines by exploring their key concepts, cutting through the complexity of the APIs to reveal their fundamental nature, and offering a fresh perspective to guide readers into the world of Kotlin Coroutines.

## What is a coroutine?
Many articles describing coroutines often use phrases like "coroutines are lighter than threads" and "they are cancellable." While these statements are correct and highlight advantages of coroutines, they don't explain what coroutines are. So, what defines a coroutine? Let's use threads for an analogy first. ***The best way to explain a concept is often through analogy***. I won't attempt a strictly scientific definition; instead, I'll offer my own interpretation of a thread—a thread is an executable unit schedulable by the CPU. It has its own block of code and can execute logic independently. I've intentionally listed three key characteristics of threads:

- Scheduled by the CPU
- Possesses its own code block
- Requires scheduling to execute its code

This is my intuitive understanding of threads, and these characteristics are evident in code. For example, Java's Thread is both a thread and an entity object, understandable and usable through its API. Its distinctive features are the three points I listed above, which are unique to threads. I'll try to use the same approach to define a coroutine in my own terms—a coroutine is an executable unit scheduled by a thread. It also has its own execution block and can execute logic independently or cooperatively. In fact, Kotlin's coroutines also have their corresponding entity objects and operational APIs, even resembling those of threads (e.g., lifecycle). However, Kotlin's encapsulation of coroutines is so thorough that many APIs are not exposed, leaving my understanding of coroutines somewhat fragmented, like the proverbial blind men touching an elephant. Furthermore, coroutines can be implemented in various ways; the following views pertain specifically to Kotlin's implementation and might differ from other languages.

In Kotlin, ***a coroutine object is essentially an executable block of code***, executing the logic passed in during its creation. Beyond that, its most significant feature is that a coroutine is not bound to a specific thread. It can detach from the current thread at one moment and later attach itself to another thread. Think of it like a ping-pong ball, where threads are the paddles; the ball can bounce back and forth between them. Combining these two aspects, the official definition of ***a coroutine is a suspendable computation instance***. While accurate, I feel this definition primarily emphasizes the suspension aspect, somewhat overlooking resumption. I would offer my own definition—***a schedulable computational entity***.

Consider a typical scenario in an Android app network request. We know network requests should execute on a non-UI thread, but the results need to be used on the UI thread. If we approach this with a threading mindset, where threads are separate scheduling units, we must manually handle data transfer between them, requiring significant code to ensure data consistency and timeliness. Using coroutines, however, allows us to encapsulate this process simply into two sequential parts. During the network request, the code block executes on a non-UI thread. Upon completion, the result is returned to the UI thread as if it were a regular function call—seemingly immediate. We can handle the entire process with sequentially written code. The magic enabling this asynchronous process to behave like a synchronous function lies in the suspension and resumption mechanism, the essence of coroutines.

## Key Concepts in Coroutines
Understanding what a coroutine is forms the foundation, but Kotlin's coroutines involve several other crucial aspects. Here are some key concepts that need clarification.

### Suspend Functions
When discussing Kotlin Coroutines, suspend functions are indispensable; they are one of the most critical concepts in the implementation. Simply put, ***a suspend function is a solution for asynchronous programming that, while being a regular function, also possesses the capabilities of suspension and resumption.***It offers an approach to handle long-running computations and result delivery. How does it differ from common callback-based solutions? In callback-based approaches, the computation process and the result are separate entities. The result must be manually delivered by the computation process upon completion, often through another object. This can lead to nested callbacks, fragmenting code that should logically be sequential into disparate blocks. Consider the following file read/write code:
```kotlin
 // asynchronously read into `buf`, and when done run the lambda
 inChannel.read(buf) {
     // this lambda is executed when the reading completes
     bytesRead ->
     ...
     ...
     process(buf, bytesRead)
 
     // asynchronously write from `buf`, and when done run the lambda
    outChannel.write(buf) {
        // this lambda is executed when the writing completes
        ...
        ...
        outFile.close()          
    }
}
```
Now, how would the same logic look if `read` and `write` were implemented as suspend functions?
```kotlin
 launch {
     // suspend while asynchronously reading
     val bytesRead = inChannel.aRead(buf) 
     // we only get to this line when reading completes
     ...
     ...
     process(buf, bytesRead)
     // suspend while asynchronously writing   
     outChannel.aWrite(buf)
    // we only get to this line when writing completes  
    ...
    ...
    outFile.close()
}
```
This is an official example given by Kotlin, and you can see that the implementation of the suspend function is very intuitive, is consistent with the thought process, and also reduces a lot of nesting.

To better explain suspend functions, I need to introduce another concept—the suspension point.
A suspension point is a demarcation line. From this point onward, execution might transfer elsewhere, only to resume later from this exact point when conditions permit. Throughout this process, the current thread is not blocked. Therefore, ***suspend functions effectively implement an asynchronous, non-blocking communication model***.

In summary, a suspend function is one that does not block the current thread and can return the result of an asynchronous computation.
### Coroutine Builders
The aforementioned suspend functions are powerful but come with a restriction: regular functions cannot call suspend functions; only other suspend functions can. This presents a chicken-and-egg problem. The solution lies in coroutine builders. Functions like `launch`, `async`, and `sequence` are coroutine builders. As the name suggests, they are used to create coroutine objects. Beyond that, they are just like ordinary functions. They serve as the gateway into the world of coroutines and suspend functions. Once inside, we can freely use suspend functions to simplify our computational logic. Of course, these builders are not rigid; they come with various configuration parameters, the most important being the `CoroutineContext`.

### CoroutineContext
The `CoroutineContext` provides various configuration information for the coroutine. Essentially, ***it is a container (Set) for non-duplicate elements***, where elements can be retrieved by their Key (e.g., the dispatcher). These contained items are called Elements. I can't resist showing its interface definition because it is truly elegant.
```kotlin
 interface CoroutineContext {
     operator fun <E : Element> get(key: Key<E>): E?
     fun <R> fold(initial: R, operation: (R, Element) -> R): R
     operator fun plus(context: CoroutineContext): CoroutineContext
     fun minusKey(key: Key<*>): CoroutineContext
 
     interface Element : CoroutineContext {
         val key: Key<*>
     }

    interface Key<E : Element>
}
```
These are the definitions of `CoroutineContext` in Kotlin, and each of these APIs has its own clever purpose, inspiring admiration:

- `get` is used to retrieve an object based on its Key. The uniqueness of this method lies in its query parameter. It allows checking for the presence of a specific configuration object before performing an operation, enabling a form of permission verification.

- `fold` is essentially an iteration algorithm, allowing inspection of all elements.

- `plus` which is interesting in that it allows two objects to be merged and uses the right object to overwrite the left object when the `key` is the same. This is definitely the most flexible API in our use of coroutines. We can use + to replace the original scheduler with our given scheduler, and it looks so natural.

- `minusKey` returns a `context` that doesn't contain the specified `key`, which is equivalent to an inverse operation, which can be very useful in certain contexts.

I consider this a pinnacle of abstraction. This interface abstracts the four basic operations—get, iterate, add/merge, and remove—with a simple API, while retaining powerful extensibility. When I first encountered coroutines, I was often skeptical of the complex underlying mechanics contrasted with the seemingly simple parameter configuration. It wasn't until I understood this definition that I realized its true power. It not only allows the system to work with default configurations but also empowers users to implement their own `CoroutineContext` to replace defaults and accomplish customized tasks

### `Continuation`
`Continuation` is not a Kotlin-specific concept; it is explained on the wiki as an abstract representation of control state. In Kotlin, it is an abstraction of the state of a coroutine at the starting point of a hang, which may not be well understood, and we can concretize this concept with a specific API.
```kotlin
interface Continuation<in T> {
   val context: CoroutineContext
   fun resumeWith(result: Result<T>)
}
```
It has a key function, resumeWith, which indicates that the state object is resumed from its original position by this state object at some point after the hung state. This is the key to the implementation of the resume function. The state of control here is represented by the parameters, success or failure, so it has two more extension methods:
```kotlin
fun <T> Continuation<T>.resume(value: T)
fun <T> Continuation<T>.resumeWithException(exception: Throwable)
```
## Summary
A coroutine is a schedulable computational entity. It can be created via coroutine builders. Within the coroutine's code block, you can use suspend functions, which can suspend when necessary and resume later when conditions are met, enabling sequential programming style for asynchronous code.

The concepts discussed above are key to understanding coroutines. While you might not use all of them directly in practical coroutine usage, they are instrumental in comprehending their operation and are crucial for writing correct coroutine-based code. Kotlin Coroutines aren't packed with black magic; rather, their extensive API surface exists to cater to diverse usage scenarios. This article serves as a high-level explanation of these APIs. Future installments will delve into specific scenarios in more detail. I hope you find this helpful.

The green hills never change, the blue waters always flow; until we meet again in the next issue!
