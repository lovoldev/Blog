---
title: "Move Semantics in C++"
description: "A deep dive into C++ move semantics: why rvalue references were introduced, how move constructors and move assignment operators work, and how they improve memory efficiency."
date: 2023-04-10
updated: 2023-04-10
tags: ["C++"]
draft: false
cover: /images/cover/move-semantics-in-cpp.webp
---

> C++ is famous for zero-overhead abstractions and high performance, and the move semantics introduced in C++11 have taken its performance to yet another level.

C++ is a language that supports multiple programming paradigms, one of which is object-oriented programming. An important feature of object-oriented programming is encapsulation, which organizes data together with the functions that operate on it into a class. A class can define its own constructor, copy constructor, assignment operator, and destructor to control how objects are created, copied, assigned, and destroyed.

## Copy semantics
Before C++11, a class's copy constructor and assignment operator were both based on copy semantics. When copying or assigning an object, a new object is created and every member variable of the original object is copied one by one into the new object. This guarantees that objects do not affect one another, which is intuitive and logical. Doing so is sometimes necessary and reasonable — for instance, when we want to preserve the original object's state, or when the original object and the new object have different lifetimes. However, in some cases we do not need to preserve the original object's state, or the original object is itself a temporary object about to be destroyed. For example:

```cpp
std::string s1 = "Hello";
std::string s2 = s1 + " World"; // s1 + " World" is a temporary string
```

In this example, we add two strings to produce a new string and assign it to s2. Under traditional copy semantics, this process involves three copies:

+ First, inside the `+` operator, a temporary string is created and both `s1` and `" World"` are copied into it;
+ Then, in the assignment operator `=`, `s2` is created and the temporary string is copied into it;
+ Finally, after the expression ends, the temporary string is destroyed.

As you can see, two of these copies are unnecessary. The first is copying `s1` and `" World"` into the temporary string; the second is copying the temporary string into `s2`. After these two copies, the original data is no longer useful: `s1` and `" World"` have not changed, and the temporary string is about to be destroyed. If we could directly transfer the original data to the target object instead of creating a new copy, we would save memory and time. This is exactly what move semantics is for.

## Move semantics
We have identified the problem: under copy semantics, although the issue of objects coexisting is solved, it introduces the problem of wasted memory. So C++11 introduced move semantics, whose main goal is to achieve minimal memory waste. When copying or assigning an object, you can choose to "move" the original object's resources into the new object instead of copying them one by one. This has two advantages:

+ Improved efficiency, because a move operation usually only involves lightweight operations such as swapping pointers or handles;
+ It is intuitive, because in some cases (such as temporary variables, return values, etc.) we only care about the state of the new object and do not care whether the original object is modified or destroyed.

Of course, implementing move semantics requires introducing new tools. First, we need a new type to represent literals and temporary values, namely the rvalue reference, and literals and temporary values are collectively called rvalues. The other tool is aimed at custom types: to allow custom classes to implement move semantics, C++ added the move constructor and the move assignment operator. Their difference from the copy constructor and the copy assignment operator is that the former take an rvalue reference as their parameter type.

To clearly explain these tools of move semantics, we need to start from before C++11.

## The origin of rvalue references
To make clear why move semantics is necessary, let's start with a function.

```cpp
struct Config {
	std::string api;
	std::string token;
};

void config(Config config) {
	std::cout << "Use config( api = " << config.api <<" , token = "<<config.token<<")" << std::endl;
}

int main() {
	Config c{ "api","token" };
	config(c); //copies a Config
	return 0;
}
```

Suppose we need a `config` function that takes a single `Config` parameter to represent configuration information. Looks simple enough, right? But we can easily see that calling `config` copies an object, and this object keeps occupying memory until the call leaves the `config` scope. This memory usage is obviously unreasonable, so we begin refactoring.

### First refactor
To avoid generating extra objects, the first thing we think of is certainly a pointer, so we change it to the following version:

```cpp
void config(Config* config)
```

This version nicely solves the efficiency problem, but it also introduces new problems. A pointer is nice, but the function caller cannot intuitively tell whether the parameter may be null, which is unfriendly for an API. On the other hand, the function developer also needs to check for null pointers. So the pointer solution is not perfect either.

### Second refactor
Combining the requirements of not generating extra objects and not being nullable, we quickly think of using a reference. Hence the following version:

```cpp
void config(Config& config)
```

Does this version solve all the problems? Not quite. Because it is an lvalue reference, every time the caller invokes the function, a variable must be available to pass as the argument; a temporary object cannot be used, let alone a literal. As a configuration API, this restriction is clearly unreasonable too.

### Third refactor
By this point, everyone probably thinks it does not matter — no matter how we go back and forth, we end up back at the original version anyway, and this amount of memory consumption is not that big after all. But what if there are many configuration items, or some configuration items occupy a lot of memory? Obviously we will have to solve this problem sooner or later, yet there seems to be no suitable solution anymore. However, if you try adding a `const` in front of the second version's parameter, you will find that you can pass a variable, a temporary object, or even a literal. What kind of magic happened here? Let's set that aside for now and look at whether the API still has any problems. At this point, for the caller, it is already very clear and convenient, but what about the API's implementer? If the implementer needs to modify the `Config` parameter, they have to regenerate a variable, and the memory that was saved on the caller's side gets occupied again. Is there a way to solve both the modification problem and the temporary object problem at the same time? That is exactly what the rvalue reference is for. Its form is as follows:

```cpp
void config(Config&& config)
```

The example above is the process of gradually refactoring from copy semantics to move semantics. As you can see, under copy semantics the memory usage is split into two parts; we only use the newly copied object, and although the old object is no longer used externally, it still cannot be destroyed until it goes out of scope. That is the behavior of objects under copy semantics. Under move semantics, on the other hand, the function parameter can be moved from the outside into the function, and inside the function it can still be modified just like an ordinary lvalue, which is very convenient.

## Lvalues and rvalues
Although we have explained the origin of rvalue references, we have not yet explained what an rvalue is. To explain rvalues, let's first look at what a value is.

We know that a program is composed of code and data, and both need to be stored in memory when the program runs. To let developers read or modify data, we need to know where the data is stored. At the same time, to interpret the data, we also need to know the size the data occupies and the range of values it can take; these together form the type. Once the type and address are determined, we can reconstruct the expected content from the string of bytes in memory — it could be a number or a string — and we call the reconstructed content a value. More precisely, a value of a certain type.

From the scenario above we can see that every value has an address and a type. Some values are only temporary and are soon discarded, while others live longer and can be read and modified repeatedly. The temporary values are likely used to initialize some variable or are intermediate results of some computation; their lifetimes are very short — they either wait to be copied somewhere else or wait to be reclaimed. We collectively call such values rvalues. For the other kind, developers use a thing called a variable to remember the address and type of a value; through the variable, one can locate that fixed piece of memory and thus modify or read it. Values of this kind are called lvalues. For example, if a developer writes the string `abc` in the source code, when the program runs, `abc` is certainly loaded into memory too, but we do not know where `abc` is stored, so in order to keep using `abc` later, we need a variable to remember it. The `abc` that was loaded in is an rvalue; once it is copied to the location specified by the variable, it can no longer be found. The developer, however, can find the value initialized to `abc` through the variable — that is the lvalue. From this, we can see that an rvalue is a value about to disappear, while an lvalue's lifetime is tied to a variable, and it exists as long as it can be found through that variable until the variable is destroyed. The obvious difference between lvalues and rvalues is that an lvalue can be addressed directly, whereas an rvalue is some intermediate value or literal waiting to be copied to a new variable location or to be reclaimed by the system.

## Rvalue references
In the example above, careful readers may have already noticed that since both lvalues and rvalues are stored in memory and are the same kind of value, why not just use the rvalue directly? Because an rvalue cannot be addressed directly, we need a tool to operate on rvalues, and that tool is the rvalue reference. An rvalue reference extends the lifetime of an rvalue; it steals the rvalue to make it its own value, so it has the characteristics of an lvalue while also avoiding an extra copy operation.

An rvalue reference has one more `&` than an lvalue reference, but the difference is not merely syntactic. An rvalue reference can accept temporary values and literals, and can even be modified inside a function, making it a powerful tool for improving memory efficiency.

Let's first look at the syntax of lvalues and rvalues.

```cpp
int x = 10; // x is an lvalue
int& lref = x; // lref is an lvalue reference
int&& rref1 = 20; // rref1 is an rvalue reference
int&& rref2 = x + y; // rref2 is an rvalue reference
int&& rref3 = x; // Error! x is an lvalue
```

As you can see, an rvalue reference is a new type, and literals and temporary values can all serve as the value of an rvalue reference.

For the example above, all of the following are valid ways to write it:

```cpp
Config readConfig(){
	Config c;
    return c;
}
config({ "api","token" });
config(readConfig());
```

Since both lvalues and rvalues reside in memory, is there a way to convert an lvalue into an rvalue? The answer is yes, but it has side effects. When an **lvalue is converted into an rvalue reference, the original variable is still valid, but its state is indeterminate**. That is, you can still call its `api`, but the result of the call is not guaranteed. For example, after converting a `std::string` object into an rvalue reference, calling `size()` on that lvalue object may return 0, or it may still return the original size.

This gives us guidance on how to use rvalue references. Since an rvalue reference can accept anonymous objects, we can directly use anonymous objects as arguments; and when we have no choice but to use an lvalue to store an intermediate value and we are certain the variable is no longer needed, we can use `std::move` to convert the lvalue into an rvalue.

## Adding rvalue reference support to custom classes
The example above was about functions. For custom classes, C++ also provides new tools to support move semantics, namely the new move constructor and move assignment operator, whose implementation simply replaces the lvalue references of copy semantics with rvalue references.

```cpp
class MyString {
public:
	MyString() {
		std::cout << "Default Constructor" << std::endl;
	}

	MyString(const MyString& origin) :base_{ origin.base_ } {
		std::cout << "Copy Constructor" << std::endl;
	}

	MyString(MyString&& origin) :base_{ std::move(origin.base_) } {
		std::cout << "Move Constructor" << std::endl;
	}
private:
	std::string base_;
};

int main() {   
	MyString str1;  					// Output: Default Constructor
	MyString str2{ str1 };				// Output: Copy Constructor
	MyString str3{ std::move(str2) };	// Output: Move Constructor
	return 0;
}
```

The above is an example implementing a move constructor. Just like passing function arguments, we directly steal the data of the rvalue reference to initialize our own member variables.

```cpp
// Added
// Copy assignment operator
MyString& operator=(const MyString& origin) {
    base_ = origin.base_;
    std::cout << "Assign operator" << std::endl;
    return *this;
}

// Move assignment operator
MyString& operator=(MyString&& origin) {
    base_={ std::move(origin.base_) };
    std::cout << "Move assign operator" << std::endl;
    return *this;
}

int main() {   
	MyString str1;  					// Output: Default Constructor
	MyString str2{ str1 };				// Output: Copy Constructor
	MyString str3{ std::move(str2) };	// Output: Move Constructor
    str2 = str3;						// Output: Assign operator
	str1 = std::move(str3);				// Output: Move assign operator
	return 0;
}
```

As you can see, move semantics is not a tool that replaces copy semantics, but rather a refinement of it. Developers can decide which to use according to their actual business needs.

## Summary
Move semantics can improve memory usage efficiency and greatly increases developers' control over memory, becoming increasingly important in the development of C++. Starting with C++14 and in later versions, compilers even optimize return values into move semantics form by default, which is enough to show the success of move semantics.

Rvalue references give developers the ability to operate on rvalues, and copy constructors and move constructors give developers the ability to move resources. Developers only need to choose between moving and copying at the right time, and for existing code, they can also use `std::move` to perform the rvalue conversion.

The mountains remain, the waters still flow — see you next time!
