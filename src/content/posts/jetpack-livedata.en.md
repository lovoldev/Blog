---
title: "Meditation Series — Dissecting Jetpack's LiveData"
description: "A source-code walkthrough of Jetpack's LiveData, examining how it combines a data container with lifecycle awareness and how it notifies observers of data changes."
date: 2021-03-23
updated: 2021-03-23
tags: ["Android", "Jetpack", "Meditation Series", "Source Code Analysis"]
draft: false
---

> In the previous article we covered Lifecycle in the Architecture Components. Since it lacked concrete applications, it may have lacked intuitive feeling, so today let's use Lifecycle in a real battle and see how Lifecycle is applied to LiveData.

## LiveData's functionality
Based on the class comment of `LiveData`, we can know that `LiveData` is a data container that implements the observer pattern and is also lifecycle-aware. From this functional description, we know that `LiveData` is a combination of two parts: one part is the data container, and the other is responding to the lifecycle. When reading source code, I think functional decomposition is a very useful technique; reasonable functional decomposition is purposeful omission, which helps to quickly understand the implementation logic of a function.
Next, I'll use these two functions as breakthrough points and sort out `LiveData`'s implementation approach one by one.

### LiveData's data container functionality
I believe the concept of a data container is familiar to everyone — almost every language has them, and developers use them to save data objects. Due to different application scenarios, various data containers have emerged, such as `List` and `Set` for saving data sets, and `ThreadLocal` for saving thread-private data. So what kind of data does `LiveData` save? It saves observable data.
For decomposing a data container, there's actually a fixed pattern to follow: use adding data as the breakthrough point, then take the data flow as the main thread and break through step by step. So let's start analyzing from `LiveData`'s `setValue` method for adding data.

1. The `setValue` method has very little logic — mainly two things: incrementing the `mVersion` version and saving the data, then calling `dispatchingValue` for dispatch. `mVersion` is a key point; we'll get back to it later, and here we're just getting familiar with it. Let's move on to the next step.
2. `dispatchingValue`'s function is very clear — as you can tell from its name, it dispatches the data. But its implementation is quite clever. To explain this implementation, we need a suitable scenario. Suppose the data saved by the current `LiveData` changes frequently, and there are many observer objects — how do we quickly and accurately deliver the data to the observers? Or to put it another way, when we're in the middle of dispatching data and new data arrives, what do we do? Generally speaking, there are two approaches: cut off the head or cut off the tail. Cutting off the head means that when data is updated, you ignore the new data, finish the current dispatch operation first, and then handle the new data afterward. Cutting off the tail means that when new data arrives, you cancel the previous data dispatch and re-dispatch the new data. `LiveData` adopts the cut-off-the-tail approach. Once you understand this, `dispatchingValue` becomes very clear: it uses `mDispatchingValue` to mark the dispatch state, `mDispatchInvalidated` to mark the new-data state, and then while using a `for` loop to dispatch data, it checks whether the state of `mDispatchInvalidated` has been updated, thereby determining whether to cancel the current dispatch and start a new round. There's no more mystery beyond that.
3. `considerNotify` is the handling logic after dispatching to a specific observer. This step is completed in the `for` loop from step 2. So this is the last stop for the data. This method needs to determine whether to notify based on two states of the observer. One is the `mVersion` mentioned in step 1, because the observer also has its own `mLastVersion`. If `mVersion` is smaller than `mLastVersion`, there's no need to notify, because after each notification, the two values are the same. The other is `mActive`, which is related to the lifecycle. This state indicates whether the current observer is in an active state. If not, it returns directly. After these two checks, it's simply updating `mLastVersion` and executing the `onChanged` callback.

The above three steps are `LiveData`'s data update process, with the focus on handling the dispatch step. In future projects, we can borrow from this idea, though of course, specific problems need specific analysis.

From step 3 above, we learned that the observer's `mActive` is the key to `LiveData`'s response to the lifecycle. Next, let's look at how this state gets updated.

### LiveData's lifecycle awareness
Connecting to the previous article "Meditation Series — Dissecting Jetpack's Lifecycle", we know that `Lifecycle` is the professional at this (lifecycle awareness). The article also mentioned three very important abstractions of `Lifecycle` — `LifecycleOwner`, `Lifecycle`, and `LifecycleObserver` — which are three excellent breakthrough points for introducing lifecycle awareness.

- As the power source of the lifecycle, `LifecycleOwner` can directly obtain a Lifecycle, and then conveniently read the state and register state listeners. Thanks to its excellent interface encapsulation, it doesn't need to couple with other classes and is a great object to introduce.
- As the core class of `Lifecycle`, `Lifecycle` completes many functions; it's an abstract class and can only be used through inheritance.
- As the last link in state update notifications, `LifecycleObserver` can conveniently complete state monitoring, but it needs to be registered with an appropriate `Lifecycle`.

So it's obvious that for `LiveData` to use `Lifecycle`, it needs a `LifecycleOwner` to introduce the lifecycle state, and it also needs a `LifecycleObserver` to respond to state updates. In addition, since our positioning is a data container, our data is very likely to be used by many classes. So if we bound `LifecycleOwner` to `LiveData`, then once an operation deactivates the `LiveData`, all other observers would be left in the dark and receive nothing at all, which is contrary to the design. For this reason, `LifecycleOwner` can only be bound to `Observer`. The result is obvious: they appear together in the `observe` method, which also explains why the `observe` method needs two parameters.

Clearly, `observe` is the breakthrough point for analyzing lifecycle awareness. Let's keep going and see how they work together.

Inside `observe`, both `LifecycleOwner` and `Observer` are received by `LifecycleBoundObserver` to construct an object, and the logic continues over to `LifecycleBoundObserver`.

Note that `LifecycleBoundObserver` implements `LifecycleEventObserver` and inherits from `ObserverWrapper`. We're not familiar with `ObserverWrapper`, so let's set it aside for now. From the previous article, we learned that `LifecycleEventObserver` inherits from `LifecycleObserver` and has only one state-change callback. Obviously, the next step is to see how it handles state changes.

Arriving at the `onStateChanged` method, it does two things, and they're mutually exclusive — that is, it does one thing under certain conditions and another under other conditions. Let's look at the simpler thing first: when the `Lifecycle` state is `DESTROYED`, it removes the `Observer`, and that's it. As for the other thing, we can probably guess — what happens when the state isn't `DESTROYED`. It delegates to the parent class `ObserverWrapper`.

The logic moves to the `activeStateChanged` method of `ObserverWrapper`, which just sets the state of `LiveData` — that is, it updates the value of `mActiveCount` based on whether it's currently in the active state, and under the appropriate conditions notifies `LiveData` to enter the active or inactive state. Also, there's the `mActive` we've been thinking about above; this is where it connects. Of course, there's also an extremely critical point: in the active state, it uses itself as a parameter to perform a data dispatch, which in some cases may introduce data issues.

At this point, `LiveData`'s lifecycle awareness is fully covered. It can be summed up in one sentence: `Lifecycle` gives `LiveData` the ability to dispatch data while active and automatically cancel monitoring once deactivated.

Supplementary note
Although we've covered a lot above, there's still some content we haven't touched on, such as asynchronous data updates, the `Observer` registration process, and so on, but it doesn't prevent us from understanding the main flow. To deepen the impression, I've also put together a UML diagram; you can use it alongside to understand and review again.
![LiveData UML](/images/posts/jetpack-livedata/livedata.webp)
