---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: 6c40935a6b27e13d025257befc1144a9
    PropagateID: 6c40935a6b27e13d025257befc1144a9
    ReservedCode1: 3046022100bc1f9fd80275de6062abf37e81bb4ba7a3480394a8a59a1c1296b6367776e9f7022100af3bc5f51ee2ad9f9ac4d61f16467a96dda9743c656db60d21a5246669917c66
    ReservedCode2: 3044022076e975154a8504cfa0d861c69b2c205a6517ab2b97fdc8e902a993d9b94a9f1e02200e7a086b9ce8c32bd8db55c8fba05f3102bff10a15cc1371774bde238ef7c1fc
author: hongui
categories:
    - C++
date: 2022-06-26T11:11:59+08:00
description: "A deep dive into the C++ type system, explaining types, variable declarations, initialization, functions, and classes — the fundamental building blocks of a C++ program."
draft: false
tags:
    - Learning Guide
    - C++
title: Modern C++ Learning Guide - Type System
---

> In the previous article, I drew a panoramic map of C++ learning. But a map is just a map—today, we finally set foot on the journey. This article focuses on the type system, the most fundamental "building blocks" of C++.

## Before We Begin

Before diving into the type system, we should first reach a consensus—**use modern C++ syntax as much as possible**. As we all know, for the sake of compatibility, many syntax forms in C++ are valid. But as new versions are released, some syntax has become outdated or should be avoided. Therefore, this article tries to use recommended syntax forms (based on C++11 or above), which is the meaning behind the "Modern C++" title.

Adopting modern syntax has two benefits. First, modern syntax can compile faster, more robust code. Compilers also evolve with language development, and modern syntax helps them optimize better. Second, modern syntax is typically more concise, intuitive, and consistent, helping improve readability and maintainability.

With this clarified, let's step through the door to modern C++ together.

## Type System

**A program is a computing tool that, given input and a predefined computation method, produces computation results**. When a program runs, all three need to be represented as appropriate values in memory for the program to work properly. The tool responsible for interpreting this rules is the type system.

Numbers, strings, keyboard and mouse events are all data. They exist in the same form in memory, but from a human perspective, how we handle them differs. Numbers can perform arithmetic operations like addition and multiplication, but arithmetic on strings makes no sense. Keyboard and mouse values are usually just read, not computed. Because of these differences, a programming language first needs to define a type system to tell the computer how to handle data in memory.

To keep programming languages as simple as possible, the type system is typically implemented in two steps: the compiler and types. The compiler is responsible for interpreting the developer's code into an appropriate form for efficient, accurate representation in memory. Types define what the compiler can handle, helping developers find appropriate data to complete input/output representation and describe computation methods. These two complement each other and achieve mutual success.

As an important manifestation of the type system, types are crucial in programming languages. If writing a program is like building with blocks, then the type system is the entire box of blocks—it defines what shapes you can use, how you can combine them, giving both constraints and infinite possibilities.

## Types

***Types are the smallest unit of a programming language. Any line of code is a form of memory usage.***

When discussing C++ types, we must discuss its three representations—plain types, pointers, and references. These are three different forms of memory usage and interpretation, and also the most fundamental forms of C++. Unlike most other programming languages, C++ doesn't give built-in types special treatment. If developers are willing, all types can have consistent syntactic forms (through operator overloading). Therefore, the examples below apply to all types.

Plain types are types without modifiers, such as `int`, `long`, `double`, etc. They are passed by value, meaning assignment and function parameter passing copy a value. Operations on the copied value don't affect the original.

```cpp
int a=1; // Original value, stored at address 1
int b=a; // Copy, stored at address 2
b=2;    // Modify address 2's content
// At this point, a is still 1, but b has become 2
```

![Pass by value](/images/posts/modern-cpp-type-system/pass-by-value.jpg)

So what if we need to modify the original value? There are two approaches: pointers and references.

Pointers are the magic in C/C++—everything can be a pointer. Pointers have two aspects: they refer to a block of memory, and they allow operations on that memory. The value of a pointer is a memory address. When you operate on a pointer, you operate on the address it points to.

```cpp
int a=1; // Original value, stored at address 1
int* b=&a; // & means address-of, get a's address—address 1, stored at address 2
*b=2; // * is dereference, take the value at address 2 (b), change address 1's value to 2
// At this point, both a and *b become 2
```

![Pass by pointer](/images/posts/modern-cpp-type-system/pass-by-pointer.jpg)

References are an improved version of pointers. References can avoid invalid references, but they can't be reassigned, making them slightly less flexible than pointers.

```cpp
int a=1; // Original value, stored at address 1
int& b=a; // & appearing at declaration position means this variable is a reference
b=2; // Can operate on references like ordinary variables; operations affect the original object
// At this point, both a and b become 2
```

![Pass by reference](/images/posts/modern-cpp-type-system/pass-by-reference.jpg)

## Variable Declarations

A type is just a syntactic definition. To actually use this definition, we need to define variables using types.

A C++ variable declaration has the following form:

```cpp
type name[{initial_value}]
```

The key here is `type`—a combination of type and qualifiers. Look at the examples:

```cpp
int a; // Plain integer
int* b; // Combination of int and *, forming an integer pointer
const int* c; // Read from right to left: * is pointer, const int is constant integer, forming pointer to constant integer
int *const d; // Read from right to left: const is constant, followed by pointer, indicating this pointer is constant, pointing to int
int& e=a; // Combination of int and &, forming an integer reference
constexpr int f=a+e; // constexpr means this variable needs to be evaluated at compile time and is immutable
```

The above covers all forms of variable declarations. Types determine the basic attributes of variables, while qualifiers limit the scope of variable usage.

Variable definition follows this process: **first determine what type of variable we need, then further determine whether we need to add qualifiers**. Follow these steps to decide:

1. If it's a large object, consider declaring it as a reference type. References are usually better than pointers.
2. If a large object may need to be reset, consider declaring it as a pointer.
3. If you just want a constant, add `constexpr`.
4. If you only want to read this variable, add `const`.

## Variable Initialization

Variable definitions often come with initialization, which is important for local variables because their initial value is indeterminate. Using a variable before it's effectively initialized leads to uncontrollable problems.

C++11 introduced a brand new, unified initialization method: following the variable name with curly braces containing the initialization value. This method can be used on any variable and is called uniform initialization:

```cpp
int a{9527}; // Plain type
string b={"abc"}; // Another form, equivalent but not recommended
Student c{"ZhangSan","20220226",18}; // Curly braces contain constructor parameters
```

Of course, besides defining variables with type names, you can combine definition and initialization into the simplest form:

```cpp
auto a={1}; // Deduced as integer type
auto b=string{"abc"};
auto c=Student{"ZhangSan","20220226",18}
```

Here, `auto` means let the compiler determine the type itself. This writing style fully utilizes C++'s type deduction, which is also the recommended form in many modern languages. Note that when using type deduction, `=` cannot be omitted.

With initialized variables, we can use them to perform various computational tasks. C++ provides developers with many built-in capabilities: arithmetic operations for numbers, array indexing, pointer operations, etc. It also provides branching statements like `if` and `switch`, and loop statements like `while` and `for`, providing more flexible operations.

## Functions

Variables are the smallest unit in a programming language. As business complexity increases, sometimes intermediate calculations scatter business logic and increase complexity. To better organize code, the type system added functions to solve this problem.

Functions are also types—a kind of composite type. Its type is composed of the parameter list and return value. For two functions, if their parameter lists and return values are the same, they are equivalent from the compiler's perspective. Of course, that's not enough—otherwise, how could we have two functions with identical parameter lists and return values? A complete function also needs a function body and function name.

A function generally has the following form:

```cpp
// Regular function form
[constexpr] ReturnType FunctionName(ParameterList)[noexcept]{
    FunctionBody
}

// Trailing return type form
auto FunctionName(ParameterList) -> ReturnType
```

When a function has no function body, we usually call it a function declaration. Adding a function body makes it a function definition.

```cpp
void f(int); // Function declaration
void fun(int value){ // Function definition, because it has the function body
}
```

The above is the basic framework of a function. Next, let's look at each part that composes it.

Let's start with the simplest: the function name. **It is actually a variable of the function type. The value of this variable represents a code block starting from a certain position in memory**. As mentioned earlier, the reason why two functions with identical parameter lists and return values can exist but the compiler can still distinguish them is mainly due to the function name. So function names, like variable names, are a type of identifier. What if, conversely, the function names are the same but the parameter lists or return values differ? This has a special term—**function overloading**. Any difference in these constitutes overloading. Additionally, in C++11 there's a type of function without a name, called a lambda expression. A lambda expression is a function value similar to a literal, like `13` or `'c'`. It's a function form that doesn't require pre-defining a function but is defined and used directly at the call site.

The parameter list is an upgraded version of the type definitions discussed earlier. Everything about variable definitions applies to it—three forms of variable definitions, multiple variables, variable initialization, etc. However, they all have new names: variables in the parameter list are called formal parameters, and initialization is called default arguments. Similarly, formal parameters need to be initialized during actual use, but the initialization comes from the caller. Formal parameters without default values need to provide arguments when called; those with default values can be omitted.

```cpp
int plus(int a, int b=1){ // b is a default argument
    return a+b;
}

int main(void){
    int c=plus(1); // b's value not provided, so b initialized to 1, result is 2
    int d=plus(2,2); // both a and b initialized to 2, result is 4
    return 0;
}
```

Like the parameter list, the return value is also a variable. This variable is returned to the caller through the `return` statement, so from a memory operation perspective, it's an assignment operation.

```cpp
std::string msg(){
    std::string input;
    std::cin>>input;
    return input;
}

int main(void){
    auto a=msg();
    std::string b=msg(); // msg's returned input is copied to b
    return 0;
}
```

But C++ only gives us one "return value" window—wanting to return multiple values requires another approach. One way is to "output" through parameters, but this makes calling functions cumbersome. So C++ has another solution...

## Classes

As business complexity increases again, the number of function parameters may increase, or multiple values may need to be returned and passed between different functions. This leads to data easily becoming chaotic and increases the learning cost for users.

To solve these problems, engineers proposed object-oriented—a technique for packaging multiple pieces of data. At the language level, this manifests as **using classes to bundle a set of operations with the data needed to perform these operations**. Data serves as class properties, operations serve as class methods. Users operate internal data through methods, and data no longer needs to be passed and managed by users. This greatly simplifies operations for developers.

We call this object-oriented programming, and the way of passing data between functions is called procedural programming. The underlying logic of these two approaches is actually consistent—required parameters and function calls are no less in number. But the difference with object-oriented is that these tedious, error-prone tasks are handed to the compiler. Developers only need to do good design work according to object-oriented rules, and the rest is handled by the compiler.

At this point, our type system has risen another level. A class is not only an aggregate of multiple types but also an aggregate of multiple functions—an abstraction higher than functions.

Here's a code comparison between procedural and object-oriented programming:

```cpp
struct Computer{
    bool booted;
    friend std::ostream& operator<<(std::ostream& os,const Computer & c){
        os<<"Computing";
        return os;
    }
};

void boot(Computer& c){
    c.booted=true;
    std::cout<<"Booting...";
}

void compute(const Computer& c){
    if(c.booted){
       std::cout<<"Compute with "<<c;
    }
}

void shutdown(Computer& c){
    c.booted=false;
    std::cout<<"Shutdown...";
}

int main(void){
    auto c=Computer();
    boot(c);
    compute(c);
    shutdown(c);
    return 0;
}
```

The main characteristic of procedural programming is that developers need to pass data between functions and maintain data state. In the example above, the data is `c`.

```cpp
struct Computer{
    bool booted;

    friend std::ostream& operator<<(std::ostream& os,const Computer & c){
        os<<"Computing";
        return os;
    }

    void boot(){
        booted=true;
        std::cout<<"Booting...";
    }

    void compute(){
        if(booted){
            std::cout<<"Compute with "<<this;
        }
    }

    void shutdown(){
        booted=false;
        std::cout<<"Shutdown...";
    }
};

int main(void){
    auto c=Computer();
    c.boot();
    c.compute();
    c.shutdown();
    return 0;
}
```

The most significant change in object-oriented code is that method parameters have decreased, but you can directly access data defined in the class within the method. Another change occurs at the call site—the call site uses data to call methods, rather than passing data to methods. This is also the essence of object-oriented—**data-centric**.

Of course, the encapsulation function of classes is only a small part of class functionality. As beginners, understanding up to this point is sufficient to read most code.

## Summary

The type system is a fundamental component of a language. It supports the entire system's advanced functionality. Many advanced features evolved based on the type system.

Learning a language's type system involves a process from low to high, then from high to low. Start from the most basic types, learn how to build advanced types from low-level types. Then from the height of advanced types, examine how advanced types are built from low-level types. This up and down process basically lets you understand most features of the language.

Low-level types are more oriented toward helping the compiler work better. High-level types are more oriented toward helping developers work better. C++ provides support at all levels from plain types, functions, to classes, giving developers more freedom of choice, which of course increases learning difficulty. But developers don't need all choices, so the correct learning approach should be guided by project scale.

Some projects completely don't need object-oriented—focus energy on creating a good set of functions. Other projects where object-oriented is a good choice need to spend time on classes. Returning to the building blocks analogy—choosing which blocks depends entirely on what model we want to build. No suitable blocks? Create them yourself. **There's no silver bullet, only the right tool for the job.** That's the charm of C++.