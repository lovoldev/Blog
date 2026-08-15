---
title: "Modern C++ Learning Guide - Roadmap"
description: "An overview of C++'s history and the key features of each language standard, from C++98 to C++20, along with a suggested learning roadmap."
date: 2022-06-25
updated: 2026-05-02
draft: false
tags: ['Learning Guide', 'C++']
---

C++ is a language with forty years of history, having undergone four major version upgrades (inception, 98, 11, 17/20, with 14 being a minor upgrade). Each upgrade involves trade-offs between many problems and solutions. Understanding this history can better help us clarify the language's development trajectory. So in the following, I will share my understanding of C++ based on its development history, and finally provide what I believe is a more reasonable learning roadmap.

## C++0——Inception

C++ was created to solve two main problems—performance and abstraction. Performance refers to having the same low-level access capability and execution efficiency as C, while abstraction aims to provide problem description capabilities and thinking methods at the language level. This is the foundation of C++ and the reason for its enduring relevance. For these two goals, Bjarne Stroustrup's solution was to make full use of existing C technologies and tools, then provide classes to solve abstraction problems. Based on this premise, we can see that classes are the first hurdle in learning C++.

C++ considers classes as a form of abstract thinking, and all class-related features serve abstraction. Therefore, classes in C++ provide more capabilities than classes in other object-oriented languages, which also means greater complexity. To describe this complexity, we must mention two characteristics of C++: static type safety and resource management.

Static type safety helps developers define more reasonable and legal custom classes. For example, through operator overloading, custom classes can write code as concise as primitive types. Constructors can avoid runtime errors caused by implicit type conversion, and certain operations can be explicitly prevented to stop classes from being misused. All autonomy is decided by the developer. So if we are library users, we don't need to worry about these details at all. We just write code as we would in any language, and the compiler will directly tell us when something is unreasonable. We don't have to worry about these problems lurking somewhere during program execution.

Resource management provides developers with guidance and support for resource management. There are many types of resources, and most resources in computers are limited. They must be borrowed and returned, and borrowing and returning must correspond one-to-one—otherwise, it's memory leakage. In the C era, resource management relied on the developer's overall control over resources. The language level didn't provide better support. To better support resource management, C++ proposed constructors and destructors, which can correspond to resource acquisition and recovery respectively. But often, resources aren't just for internal use—they also need to be provided to external users. To support this resource transfer, C++ also provides move and copy operations.

In summary, C++ classes provide many features, but not all features are needed by developers. When defining a class, the main question developers need to consider is what support to provide for that class, and then choose the appropriate syntactic features from those provided functionalities to implement it. Constructors and destructors provide excellent one-to-one operations. Move and copy provide how resources are shared among objects. Operator overloading makes class usage more concise and elegant.

## C++98——Standardization

The biggest upgrade in C++98 is templates and exceptions, along with a useful standard library.

The importance of templates in C++ cannot be overstated. It's another abstraction mechanism. So templates also solve the abstraction problem. Classes in C++ solve the abstraction of similar concepts, focusing more on the similarity between concepts. Templates solve the abstraction of general problems, focusing more on the generality of concepts. Together, they form the two cornerstones of C++ abstraction. We discussed classes earlier, so let's focus on templates here.

Thanks to C++'s powerful static type safety, templates are also simple to write. You can write them the same way you write regular functions—just replace specific types with generics. But on the other hand, templates can do more. Templates can support multiple parameter types, multiple parameters, constrained parameters, and are type-safe. More impressively, they can also specify values. Reasonably combining types and values can basically solve most problems.

When it comes to exceptions, they don't hold much appeal for ordinary developers. Because the main problem exceptions solve is how to tell the caller that an error occurred, what the error is, and transfer execution capability to the caller. Most of the time, we develop business code. We know what happened and how to solve it, so most of the time exceptions aren't really needed. Of course, this doesn't mean exceptions are worthless—exceptions are extremely important for library developers. For library developers, they need to tell the caller that an error occurred after an exception and that the operation couldn't be completed smoothly. But often, library developers don't know how the caller should handle this error—should they ignore it or clean up the scene? The exception mechanism provides two ways to support library developers and users: throwing exceptions and catching exceptions.

For beginners, they might not like the standard library and prefer to write their own. This isn't a good idea. The standard library is code that has undergone industrial-grade testing and works normally in the vast majority of cases. While writing it yourself feels more rewarding, it's more likely to carry bugs. The early standard library provided limited functionality, only including `string`, input/output streams, bit operations, three major containers, and some small algorithms. However, these are enough for daily use. Especially now that the standard library is becoming increasingly complete, you can find suitable tools for most programming scenarios. You can completely abandon hand-writing specific code.

C++98 focused more on standardization—templates are a standard, and the standard library is also a standard. From this point, the three major pillars of C++ were constructed: classes, templates, and the standard library. Each brought infinite possibilities and vigorous vitality to C++.

## C++11——A New Language

C++11's changes were revolutionary, while still maintaining incredible compatibility—this was no easy feat. We won't go into specific features and details here, only providing a broad overview from a directional perspective.

The first intuitive change is in the type system. C++11 standardized and unified the type system as much as possible.
- Unified initialization normalized object initialization forms
- `auto` simplified type declaration forms
- `nullptr` normalized the form of null pointers
- `enum class` provided statically type-safe enumerations
- Type aliases simplified the way types are written
- And many more

Improvements to the type system mean developers can write more concise, standardized, and safer code, but the challenge for compilers is enormous. So for a long time, C++11 didn't get good support, which also hindered C++'s development.

Besides the type system, another major improvement was thread support. The C++11 standard library provided thread-related tools like threads, condition variables, and locks. This was revolutionary for library developers. It provided cross-platform thread support with virtually no performance loss, greatly improving library stability and performance and saving a lot of platform testing time. It has to be said this was top-notch.

Another important upgrade was resource management. The standard library provided `unique_ptr` and `shared_ptr` to assist with resource management. At the same time, rvalue references and move semantics were introduced for better performance. Rvalue references and move semantics sound high-end, but they actually solve one problem—avoiding repeated creation and destruction of large objects, instead using lower-cost moves. The fundamental approach is twofold: for literals, rvalue references are provided to increase their lifetime, allowing them to be passed as parameters like ordinary variables. For variables, move semantics are provided to transfer resources managed by objects that are no longer needed to another object. At the same time, move constructors and copy constructors were added to optimize function return values. It can be said they squeezed every bit of memory from the computer.

C++11 is undoubtedly a milestone update for C++. While cleaning up historical issues, it led the direction of C++'s subsequent development. Its role is transitional. Improvements to the type system undoubtedly made up for some flaws inherited from C. It also fully considered modern computer development, introducing thread support. Memory management reached a new level, introducing smart pointers, move semantics, and rvalue references. It basically threw off historical shackles while still staying true to its mission, still pursuing better static type support, more autonomy, more efficient resource management, and more restrained feature support.

## C++17, 20——Renewal

C++17 and C++20 should complement each other, with most features now supported and improved. However, due to compiler limitations, I use relatively few features. What I look forward to in C++17 is cross-platform file system support, which is undoubtedly exciting and joyful for most application developers. Another feature I like is structured bindings. I use this feature quite smoothly in Python, and of course, almost all modern languages now support it.

As for C++20, I use even less—mostly for demonstration purposes. What I care about are modules and coroutines, but since my understanding isn't deep, I won't discuss them in detail.

## What is the Foundation of C++

From the previous sections, it's easy to see that I emphasized C++'s classes, templates, standard library, and type system. These are the important aspects I think are important for learning C++. But for beginners, I think the type system and standard library are sufficient.

The type system is the smallest unit of a language. In C++, it includes type declarations, object initialization, function parameters, and function return values. In the early stages of learning, learning many features is misleading. In practice, you need to start from this smallest unit. For example, when declaring a variable, what type should it be? Can it be a pointer? Can it be a reference? When defining a function, how should the parameter list be determined? What is the return value? How can function parameters be passed efficiently? How to prevent and avoid useless parameter checks? What type should the return value be? These are all problems we need to face directly in actual projects. Therefore, learning the type system is the first and most important step in writing efficient, usable code. The deeper and more comprehensive your considerations, the greater the returns.

The standard library provides excellent algorithm and container support, helping us write more robust code. Learning standard library interfaces promotes understanding of the type system on one hand, while being a place to accumulate good habits on the other.

With these two skills, I think you can already write excellent applications. But for library designers, writing good libraries requires a deeper understanding of classes and templates.

A well-defined class needs strict control over object lifecycle—construction, transfer, and destruction all need to be controlled. For operations that need to be supported, class designers should provide the most convenient and efficient support. For operations the class prohibits, class designers should explicitly prohibit them to prevent misuse or hidden bugs. Therefore, for classes, the key focus should be resource construction and transfer and sharing between multiple objects. Problem-prone areas are in function parameters and return values, especially in functions with layered calls, where efficiency and safety must be considered. This brings us back to the type system mentioned earlier—only with a deep understanding of it can you design better classes.

Templates are the other side of classes. Although their concepts are different, the thinking is similar. Templates are similar to generics in Java but more flexible and important, on par with the significance of classes. Template considerations include: what algorithms to provide, what objects can use this algorithm, how to avoid and prevent misuse of wrong objects, and how to use compile-time errors to avoid runtime errors during use. So it's an abstraction concept that goes further than classes, with higher requirements for developers than classes.

## C++ Learning Roadmap

From the previous section, you can see my recommended learning path is: type system → standard library → classes → templates. Other language details aren't unimportant—these will be naturally absorbed during the learning process of these four major areas. There's no need to study and understand them separately, as details are numerous and scattered. They won't increase mastery of the language but will disrupt the learning rhythm and distract attention.

Type system learning can proceed in the following steps:
- Variable declarations (constants and compile-time constants)
- Initialization (unified initialization, assignment)
- Function definitions, function parameter definitions, return values (references, pointer usage)
- Simple class definitions, not involving memory management or resource management

Standard library can proceed in the following steps:
- Smart pointers (`shared_ptr`, `unique_ptr`, etc.)
- Strings
- Container objects (`list`, `map`, etc.)
- Standard input/output usage
- Thread library usage
- Common algorithms (`sort`, `find`, etc.)

Classes can proceed in the following steps:
- Class constructors, move constructors, copy constructors
- Class operator overloading
- Inheritance
- Virtual functions
- Multiple inheritance

Templates can proceed in the following steps:
- Template functions
- Template classes
- Template recursion
- Template specialization

## Summary

C++ has numerous details, and beginners can easily dive into syntax details without realizing it, ultimately wasting a lot of time while severely damaging learning motivation. The purpose of this article is to help beginners clarify the main context of this language and provide what I think is a more scientific learning path, hoping to help beginners.

C++ is a general-purpose language with a long development history. This means it carries considerable historical baggage, so it has remained restrained in introducing language features and how to introduce them. But to better serve modern hardware and simplify developer work, it has to introduce new features while abandoning old ones. Based on this reason, the language exhibits a certain complexity and messiness. But its core direction is clear—to better solve efficiency and abstraction problems. Grasp these two core concepts, combine them with this guide, tackle the difficult before the easy, focus on the big picture while letting go of details, and with some summarization, you can master most of this language's content. For features outside this guide, learning them when needed in actual projects is perfectly timely. After all, most of the time we use only a small part of the features, so we should spend our energy on the highest cost-effectiveness parts.