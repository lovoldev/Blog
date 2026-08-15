---
title: "Guide to Android JNI"
description: "This article introduces some concepts in JNI development and how to apply these concepts in practical development."
date: "2021-09-12"
updated: "2026-03-18"
tags: ["Android","JNI","C++"]
draft: false
---

## What is JNI
The full name of JNI is Java Native Interface, and as the name suggests, it's a programming method that solves the problem of Java and C/C++ calling each other. ***It really only solves two aspects of the problem, how to find and how to access.*** Figure out these two topics and we have learned JNI development.***It should be noted that JNI development involves only a small part of the C/C++ development knowledge, when we encounter a problem we first need to determine whether it is a C/C++ problem or a JNI problem, which can save a lot of time searching and locating.***

## Look at function calls through the eyes of the JVM
We know that the Java program can not run alone, it needs to run on the JVM, but the JVM needs to run on the physical machine, so it is a very heavy task, both to deal with the Java code, but also to deal with a variety of operating systems, hardware and other issues. It can be said that understanding the JVM, you understand all of Java, including, of course, JNI. so let's start as a JVM to see how the Java code is running it (just rough content, omitted a lot of steps, in order to highlight the part we care about).

Before running Java code, a JVM is started.After the JVM is started, some necessary classes are loaded.These classes contain a class called the main class, that is, a method containing a static member function with the function signature `public static void main(String[] args)`. Once the resources are loaded, the JVM calls the `main` method of the main class and starts executing Java code. As the code executes, one class relies on another, layer upon layer of dependencies that work together to complete the program's functionality. This is the approximate workflow of the JVM, you can say that the JVM is like a bridge, connecting the Java mountain and native mountain.

Now the question arises, in a Java program, a class needs to access something outside the JVM via JNI technology, so how does it need to tell me (I am now the JVM)? There needs to be a way to mark normal Java methods as special, and that marking is the `native` keyword (Kotlin has its own keyword, `external`, although you can use this keyword when using Kotlin). When I execute the method and see that it is marked differently, I look for the executable elsewhere instead of inside the Class, which is a JNI call. That means that for a Java program, just marking a method as `native` and calling that method where it is needed will complete the JNI call. But for me, what to do with this one JNI call? ***Actually the above process of finding the executable is a jump problem, and in the world of C/C++, a jump problem is a pointer problem. So where should this pointer it point to?***

C/C++ code is a combination of functions (Java methods will be abbreviated directly to methods below, while C/C++ functions will be abbreviated directly to functions), each of which is a pointer, a property that is just right for my needs. But for me, there is such a big world out there that I don't ``know where, and what to look for``, and the information given to me is still not enough. To limit the scope, I made it so that I would only look for functions loaded via `System.loadLibrary("xxx")`, the rest I would just strike (throw an error). This instantly lightens my workload, at least I know where to look.

Having determined the scope, the next step is to determine the real target in this scope.How to uniquely identify a class in the Java world? Some people will blurt out the name of the class, which is not entirely correct, because the class name may be renamed, we need to fully-qualify the class name, that is, the package name plus the name of the class, such as the fully-qualified class name of `String` is `java.lang.String`, the class name is `java.lang.String`. class name is `java.lang.String`. But what does this have to do with looking up native methods. Of course there is a connection, since a fully qualified class name is unique, then its methods are also unique, so if I stipulate that the fully qualified class name plus the method name of the class is the function name of the native function, then I can find the native function by the way of the function name, the answer is yes, but there is a flaw because the Java system supports method overloading, that is, within a class, a method with the same name can be overloaded with the same name, so that the method will be overloaded with the same name. That is, inside a class, there may be more than one method with the same name. So what is the condition that constitutes overloading, is the parameter list is different. Therefore, the result is obvious, I added the parameter list on the basis of the previous, combined into a lookup conditions, I am not the only one can determine a native function it is JNI static registration.

However, since I only need to determine where the pointer is pointing, can I just assign a value to the pointer instead of looking it up every time, which I don't know is tiring, but it's still time-consuming. Of course I'm satisfied with this kind of need. If you tell me directly, I won't look for it, and I'm happy to do so. Moreover, since you have found me, I don't need to lay down so many rules, all let go, you say it is I believe you it is. This is the dynamic registration of JNI.

## JNI function registration
In the previous section, we learned about the origins of JNI function registration by incarnating the JVM and introduced two types of function registration. From the examples, we can also summarize the characteristics of the two registration methods

| Registration Type | Advantages | Disadvantages
| --- | --- | --- | --- |
| static registration | automatic JVM lookups ,simple to implement | long, restrictive function names ,time-consuming lookup |
| dynamic registration | fast running ,no restriction on function name | complex implementation |

So how exactly do you do it? Let's move on.
### Static registration
Although static registration is more restrictive, they are shallow rules that are easier to implement, so let's start with static registration first.

Static registration has clear development steps
1. Write Java classes that declare `native' methods.
2. Use `java xxx.java` to compile Java source files into class files.
3. Use `javah xxx` to generate the corresponding `.h` file.
4. Introduction of the `.h` file in the build tool
5. Implementation of functions in `.h` files
   
The above steps are the basic steps of static development, but in fact, in front of today's powerful IDE, these do not need us to do it manually, in Android Studio, after defining `native` method, press `alt + enter` on the method to generate the correct function signature, and directly write the function logic. But to learn a subject, we still need to take a truthful and realistic attitude, so I will use an example to illustrate these rules to deepen the reader's understanding.

`Test.java`
```java
package me.hongui.demo

public class Test{
    native String jniString();
}
```
`native-lib.cpp`
```cpp
#include <jni.h>

extern "C" jstring Java_me_hongui_demo_Test_jniString(JNIEnv *env, jobject thiz) {
    // TODO: implement jniString()
}
```
The above is an example of a JNI function declared on both ends, and it's not hard to see that the
1. Function signatures prefixed with `Java_`
2. The prefix is followed by the full path of the class, i.e., it contains the package name and the class name.
3. `_` as path separator
4. The first argument to a function is always of type `JNIEnv *`, and the second argument varies according to the type of the function; a method of type `static` corresponds to type `jclass`, otherwise it corresponds to type `jobject`. The type system will be expanded in detail later.
   
Why Java method corresponds to C/C++ function, there will be two more parameters. We know that the JVM is multi-threaded, and our JNI methods can be called in any thread, so how to ensure that before and after the call JVM can find the corresponding thread, this is the role of the first parameter of the function, which is a kind of encapsulation of the environment of the thread, and the one-to-one correspondence with the thread, which means that you can not use a thread of the `JNIEnv` object in another thread. In addition, it is a window for C/C++ to access the Java world, and the vast majority of JNI development is dealing with `JNIEnv`.
### Dynamic registration
Again following the development process, let's go through it step by step.
We change the name of the `Java_me_hongui_demo_Test_jniString` function in the previous section to `jniString` (of course it's OK if we don't change it, there's no restriction after all), and the parameter list stays the same, and at this point, we find that the Java file reports an error saying that the local method is not implemented. Actually, we did implement it, just that the JVM can't find it. In order for the JVM to find it, we need to register it with the JVM.
So how and where do you register, it seems everywhere and nowhere.
As mentioned earlier, the JVM will only look for libraries loaded via `System.loadLibrary("xxx"); `, so in order to use a native method, you first have to load the library file that contains the method first, and after that, you can use it. Having loaded the library indicates that the Java program is going to start using native methods. After loading the library, before calling the method, theoretically, you can register the method, but how to determine the timing, JNI has long been arranged for us.JVM in the library loaded into the virtual machine, it will call the function `jint JNI_OnLoad(JavaVM *vm, void *reserved)`, in order to confirm the version of the JNI, the version of the information will be passed to the JVM in the form of return value The version information will be passed to the JVM as a return value. Currently, the available values are `JNI_VERSION_1_1`,`JNI_VERSION_1_2`,`JNI_VERSION_1_4`,`JNI_VERSION_1_6`. If the library does not define this function, then the default return is `JNI_VERSION_1_1` and the library will fail to load, so we usually return the higher version in order to support the latest features. Now that we have such a good time to register, the next step is to implement the registration.

But things are not that simple. From the `JNI_OnLoad` function parameter list, it is clear that, at the moment, the only thing available is the JVM, but checking the JVM's API, we don't find a function for registering - the registration function is written inside the `JNIEnv` class. As it happens, the JVM provides functions to get `JNIEnv` objects.

JVM has several functions related to `JNIEnv`, in Android development, we need to use `AttachCurrentThread` to get the `JNIEnv` object, this function will return the execution status, when the return value is equal to `JNI_OK`, it means that the acquisition is successful. With the `JNIEnv` object, we can register the function.

Let's start with the declaration of the register function - `jint RegisterNatives(jclass clazz, const JNINativeMethod* methods,jint nMethods`. The return value is, needless to say, the same as `AttachCurrentThread`, indicating the execution state. The difficulty is in the parameters, the first parameter is of type `jclass` and the second is a pointer to `JNINativeMethod`, both of which are unseen mains.

Why do you need so many parameters? Doesn't the JVM only need a function pointer. Or the problem of uniqueness, remember the previous static registration, static registration with a fully qualified type and method, parameter list, return value of the combination to determine the uniqueness of the function. But for dynamic registration, these are all unknown, but necessary. In order to determine these values, it can only be done in other ways. The `jclass` is the scope of existence of the qualified method, and the way to get the `jclass` object is simple, using the `jclass FindClass(const char* name)` function of `JNIEnv`. The argument needs to be the string-qualified class name, and replace `. ` replaced by ` / `, that is, similar to the form of ` me/hongui/demo/Test `, why write this way, later will take a separate section out of the details.

The second and third parameters combined are the common form of array parameters. Let's start with the definition of `JNINativeMethod`.
```cpp
typedef struct { 
    char *name. 
    char *signature. 
    void *fnPtr. 

} JNINativeMethod. 
```
There's a trick to writing a function where the correlation is from the Java side to the C/C++ side, in order of definition. The `name` is the name of the `native` function that corresponds to the Java side only, this is purely a Java side thing, whatever the name is on the Java side is the name here. The second `signature` represents the signature of the function, which consists of a list of parameters and a return value, such as `(I)Ljava/lang/String;`, this signature is related to both sides. First, the `native` method on the Java side defines the type of the parameter list and the return value, that is, it limits the form of the signature. Secondly, Java's data types need to be converted to C/C++ here, that is, the parameter list and return value need to be written in C/C++ form, which is related to C/C++. The last one, `fnPtr`, is a function pointer, which is purely C/C++, and represents the C/C++ implementation of the `native` method on the Java side, that is, the jump pointer mentioned above. Knowing all this, we still can't write code, because, we still have the core of JNI left unsaid, that is, the type system.
## JNI's type system
The type system of JNI is messy due to the two language systems involved, Java and C/C++, but it is not untraceable. The first thing that needs to be made clear is that both ends have their own type systems, `boolean`, `int`, `String` in Java, `bool`, `int`, `string` and so on in C/C++, which unfortunately don't correspond one to the other. In other words, C/C++ does not recognize Java's types. Since the types are not compatible, how can we call them. This is the problem that JNI is trying to deal with.
### JNI type mapping
In order to solve the problem of type incompatibility, JNI introduces its own type system, which defines types compatible with C/C++, and also specifies the type conversion relationship from Java to C/C++. Here's a table showing how the conversion works

| Java Types | C/C++ Types | Description |
| --- | --- | --- | --- |
| boolean | jboolean | unsigned 8 bits
| byte | jbyte |signed 8 bits
| char | jchar |unsigned 16 bits
| short |jshort |signed 16 bits
| int |jint |signed 32 bits
| long |jlong |signed 64 bits
| float |jfloat |32 bits
| double |jdouble |64 bits
|void |void |N/A

At first glance, there is nothing special, but just add `j` prefix (except `void`), but this is only the basic type, we should not forget that Java is a pure object-oriented language. Complex objects of all kinds are the main battlefield of Java. And with complex objects, things get complicated. We know that in Java, any object is a subclass of the `Object` class. So can we except the above basic types of all complex types are treated as `Object` class object to deal with it, but can, but not convenient, such as arrays, strings, exceptions and other common classes, if you do not do the conversion to use the more cumbersome. In order to facilitate our development, JNI will be complex types are divided into the following cases
```
jobject (all Java objects)
    |
    |--jclass (java.lang.Class)
    |--jstring (java.lang.String)
    |--jarray (array)
    ||
    || jobjectArray (Object array)
    || jbooleanArray (boolean array)
    || jbyteArray (byte array)
    || jcharArray (char array)
    || jshortArray (short array)
    || jintArray (int array)
    || jlongArray (long array)
    || jfloatArray (float array)
    || jdoubleArray (double array)
    |--jthrowable (java.lang.Throwable exception)
```
The two tables together are the type conversion relationship from the Java side to C/C++. That is to say, when we declare `native` code in Java, the correspondence between `native` function parameters and return values is also the correspondence between C/C++ calling Java code parameter passing. But after all, the two systems are still separated, the type system only defines the compatibility way, and does not define the conversion way, the two sides of the parameter still can not recognize each other, so the JNI and a type signature, want to deal with the type of automatic conversion problem.

### Type signatures for JNI
Type signatures are similar to class type mappings in that there are correspondences, so let's look at a correspondence table.
| Type Signatures | Java Types |
| --- | --- | 
| Z | boolean |
| B | byte |
| C | char |
| S | short |
| I | int |
| J | long |
| F | float |
| D | double |
| L fully-qualified-class ; | fully-qualified-class |
| [type | type[] |
| (arg-types)ret-type | method type |

For basic types, it's also simple to take the initial letter, except for `boolean` (the initial letter is taken by `byte`), and `long` (the letter is used as a prefix identifier for conforming objects).
The important thing to note is the case of a composite type, i.e., a class. ***Its signature consists of three parts, the prefix `L`, the fully qualified name of the type in the middle, followed by the suffix `;`, all three of which are missing, and the qualifier separator is replaced by a /. Note that type signatures and type systems are not the same concept. Types are usually plain strings that are used by the JVM in places like function registration. A type system is the same as a normal type, where variables can be defined and used as parameter lists by the user. Additionally, array objects have their own type signature, also with the type prefix `[` followed by the type signature. The final method type, which is what we're going to talk about next, also consists of three parts: the `()` and the parameter list inside the `()`, and the return value after the `()`. All the types used here refer to type signatures.***

Let's look at an example.
```cpp
long f (int n, String s, boolean[] arr); 
```
How does it write its type signature? Let's analyze it step by step
1. Determine its type inside Java, find the correspondence in the table and determine the form of the signature.
2. Determine the type of its components using the methodology of step 1.
3. Putting together the identified signatures

This example is a method type, which corresponds to the last item in the table, so the signature is of the form `(parameter) return value`. The method has three parameters, which we determine one by one in the same way as in step 1.
1. `int n` corresponds to the type `int` and is signed `I`.
2. `String s` corresponds to the type `String`, which is a composite type corresponding to the penultimate item in the table, so its basic signature takes the form `L fully qualified name;`. The fully qualified name of `String`, `java.lang.String`, becomes `java/lang/String` after replacing `,` with `/`. Putting them together is `Ljava/lang/String;`, as per step 3.
3. `boolean[] arr` corresponds to an array type with a signature of the form `[type`, and `boolean` has a signature of `Z`. Combined they are `[Z`.
4. Finally, the return value, which is of type `long`, is signed `J`.

Combining this information according to the signature form is `(ILjava/lang/String;[Z)J`, ***Note that there is no separator between the type signature and the signature, nor is it needed; the type signatures are tightly packed***.
## Look again at dynamic registration
With JNI's type system support, go back and move on to the dynamic registration example and let's go on to refine it.
1. Get `JNIEnv` object with JVM object, i.e. `auto status=vm->AttachCurrentThread(&jniEnv, nullptr);`
2. Use the `JNIEnv` object obtained in step 1 to obtain the `jclass` object, i.e. `auto cls=jniEnv->FindClass("me/hongui/demo/Test");`
3. Define the `JNINativeMethod` array, i.e. `JNINativeMethod methods[]={{"jniString", "()Ljava/lang/String;",reinterpret_cast<void *>(jniString)}} ;`, see the previous section for method signatures here.
4. Call the `RegisterNatives` function of `JNIEnv`. That is, `status=jniEnv->RegisterNatives(cls,methods,sizeof(methods)/sizeof(methods[0]));`.
5. Of course, don't forget to implement the corresponding `native` function, i.e. here `jniString` - the third parameter of `JNINativeMethod`.

These five steps are the template for the implementation of the `JNI_OnLoad` function in the dynamic registration, the main changes still come from the `jclass` to get the parameters and `JNINativeMethod` signatures, etc., must be strictly one-to-one correspondence. Such as the following example
```cpp
extern "C" jint JNI_OnLoad(JavaVM *vm, void *reserved){
    JNIEnv* jniEnv= nullptr;
    auto status=vm->AttachCurrentThread(&jniEnv, nullptr);
    if(JNI_OK==status){
        JNINativeMethod methods[]={{"jniString", "() Ljava/lang/String;",reinterpret_cast<void *>(jniString)}};
        auto cls=jniEnv->FindClass("me/hongui/demo/Test");
        status=jniEnv->RegisterNatives(cls,methods,sizeof(methods)/sizeof(methods[0]));
        if(JNI_OK==status) {
            return JNI_VERSION_1_6.
        }
    }
    return JNI_VERSION_1_1;
}
```

## Using data in JNI
After all the previous grating, it's really only about one thing - how to find it. Although complicated, but the good thing is that there is a trace, the big deal is to run the run. The following to talk about this problem is much more tricky, need a little patience and careful. This part can also be divided into two smaller problems - *** accessing the data of a known object and creating a new object. It is important to mention that the access and creation here are for Java programs, that is, the object exists on the heap of the JVM virtual machine, and our operations are based on the operation of the heap object.*** In C/C++ code, the only way to manipulate heap objects is through the methods provided by `JNIenv`. So, this part is actually an explanation of the application of `JNIenv` methods.

### Java object access
When we say accessing an object in the object-oriented world, we usually mean two things; accessing the object's properties, and calling the object's methods. These operations are well implemented in the Java world, but not in the C/C++ world. In the section on JNI's type system, we also learned that complex objects in Java correspond to the class `jobject` in C/C++, so obviously, no matter how awesome that object is in the Java world, it's treated the same in C/C++. In order to realize C/C++ access to Java's complex objects, combined with the way of accessing objects, `JNIEnv` provides two major classes of methods, one corresponding to properties and one corresponding to methods. With `JNIEnv`, C/C++ can realize the goal of accessing objects. There is also a more uniform procedure for using them:
1. Prepare the corresponding id (fieldid or methodid) according to the content to be accessed.
2. Identification of the objects to be accessed and the data to be invoked
3. Object access is accomplished through `JNIEnv` method calls.
   
As you can see, this uses a few more preparation stages (steps 1, 2) than the normal object-oriented approach. As mentioned before, this part of the process requires more patience and care, and less cool maneuvers; after all, there is only so much room to play. This is specifically also reflected in steps 1, 2 above. it is this preparation phase that makes the whole C/C++ code ugly and fragile, but - it's not like it doesn't work, is it?

Look at an example of a `Person` class defined in Java with the following class definition
```java
public class Person(){
    private int age.
    private String name.

    public void setName(String name){
        return this.name=name;
    }
}
```
Now, how do we access the object of this class in our C/C++ code. Suppose we need to read the `age` value of this object and set the `name` value of this object. Based on the above steps, we have the following steps
1. Prepare the `fieldid` of `age` and `methodid` of `setName`. According to the methods of `JNIEnv`, we can see four related ones, two for `fieldid` and two for `methodid`, divided into normal and static ones. We're all about the normal ones here, so the methods identified are `GetFieldID` and `GetMethodID`. The first parameter is the `jclass` object, which is retrieved as described earlier, i.e., through the `FindClass` method of `JNIEnv`, with the parameter being the fully-qualified class name, with `/` replacing `. `. The last two parameters correspond to the name and type signature of the Java side, `age` belongs to field, `int` type signature is `I`, `setName` belongs to method, the signature form is `(parameter) return value`, here the signature of the parameter is `Ljava/lang/String;`, the signature of the return value is `V`, the combination is `. "(Ljava/lang/String;)V"`.
2. Assuming we already have the `Person` object `obj`, passed through Java.
3. Two methods need to be called, `age` is a plastic attribute, to get its value, the corresponding `GetIntField` method needs to be used. `setName` is a method that returns a `void` value. So `CallVoidMethod` should be used.
   
The above analysis leads to the following sample code.

```cpp
auto cls=jniEnv->FindClass("me/hongui/demo/Person");
auto ageId=jniEnv->GetFieldID(cls, "age", "I");
auto nameId=jniEnv->GetMethodID(cls, "setName","(Ljava/lang/String;)V");
jint age=jniEnv->GetIntField(obj,ageId);
auto name=jniEnv->NewStringUTF("ZhangSan");
jniEnv->CallVoidMethod(obj,nameId,name);
```
From the analysis and examples above, patience and attentiveness are mainly reflected in the
1. Be patient in determining the type and name of the property or method to be accessed, and keep the types in the three steps identical. That is, the type of the call to `GetFieldID` should be consistent with the type of `GetXXXField`, and the same goes for the method.
2. Be careful with static and non-static modifiers of properties or methods, as static ones usually require the use of a method with the `static` keyword, while normal ones do not. For example, `GetStaticIntField` corresponds to getting the value of a static integer attribute, while `GetIntField` gets the value of an integer attribute of a normal object.
3. Attribute-related set methods are of the form `SetXField`, where `X` stands for the specific type, corresponding to the type in the previous type system, or `Object` in the case of complex objects, as in `SetObjectField`. Accessing a property is simply a matter of replacing the prefix `Set` with `Get`. For static properties, a fixed `Static` is added between `Set` and `X`, i.e. `SetStaticIntField`.
4. Method calls are prefixed with `Call` followed by the type of return value, in the form of `CallXMethod`. Here `X` stands for the return value. For example, `CallVoidMethod` calls a method of an object whose return value is of type `void`. The equivalent static method is `Static` between `Call` and `X`, as in `CallStaticVoidMethod`.
### Passing data to the Java world
Passing data to the Java world requires even more patience. Because we need to keep constructing objects, combining them, and setting properties. And each of these is a form of access to the Java object above.

#### Constructing Java objects
C/C++ constructs Java objects and calls methods similarly. However, there are still a lot of details worth paying attention to. According to the previous method, we construct the object, first we need to know the id of the constructor method, and to get the id, we need to get `jclass`, the name and signature of the constructor method. We know that in the Java world, the constructor method has the same name as the class, but this is not the case in C/C++, it has a special name - `<init>`, note that `<>` can't be missing here. ***That means that no matter what the class is called, the name of its constructor is `<init>`.*** And the key point of the function signature is the return value, the return value of the constructor method is `void` which corresponds to the signature type `V`.

Picking up on the previous example of the `Person` class, how do you construct a `Person` object.
1. Get the `jclass` object by `FindClass` of `JNIEnv`. Remember to replace `'` with `/`.
2. Get the appropriate id of the constructor method as needed. i don't define a constructor method, then the compiler will provide it with a constructor method with no parameters. That is, the function signature is `()V`. Call `GetMethodID` of `JNIEnv` to get the id.
3. Call `NewObject` of `JNIEnv` to create the object, remember to pass the constructor parameter. I don't need to pass it here.

To summarize, this creation process is similar to the following example
```cpp
auto cls=env->FindClass("me/hongui/demo/Person");
auto construct=env->GetMethodID(cls,"<init>","()V");
auto age=env->GetFieldID(cls, "age", "I");
auto name=env->GetFieldID(cls, "name", "Ljava/lang/String;");
auto p=env->NewObject(cls,construct);
auto nameValue=env->NewStringUTF("ZhangSan");
env->SetIntField(p,age,18);
env->SetObjectField(p,name,nameValue);
return p
```
The above example has an interesting point, in fact the example creates two Java objects, one is `Person` object and the other is `String` object. Since the probability of a `String` exit is too high in programming, JNI provides this easy way. Also special is the creation of array objects. And because the type of the array is uncertain, there are multiple versions of the creation method, such as `NewIntArray` for creating an integer array. The method signatures are also quite regular, all in the form of `NewX Array`, where `X` stands for the type of the array, and all of these methods take one parameter, the size of the array. Since we are mentioning arrays, the methods for setting arrays have to be mentioned. There are methods for setting the value of an array element, in the form of `SetXArrayRegion`, such as `SetIntArrayRegion` which sets the value of an integer array element. Unlike the Java world, these methods support setting multiple values at the same time. The signature of an integer array looks like this - `void SetIntArrayRegion(jintArray array,jsize start, jsize len,const jint* buf)` The second parameter represents the start index of the set value, the third parameter is the number, and the fourth argument is a pointer to the true value. The rest of the types are similar.
### Take data access a step further
There are times when we don't access an object when we call a `native` method, but sometime in the future. This is well realized in the Java world, where there is always a suitable class to hold the object reference passed in during this call, and it can be used directly at a later time. Is it the same in the `native` world? It's the same in terms of usage flow, but it's very different in terms of implementation.

The Java world has GC, which means that after passing some temporary object `X` to some object `Y`, the life cycle of `X` is transferred to `Y`, and `X` is not destroyed at the end of the call, but is recycled together with `Y` when `Y` is recycled. This approach is fine in the pure Java world, but when we pass this temporary object `X` to the `native` world and try to get it to work as it does in the Java world, the application crashes, reporting the error `JNI DETECTED ERROR IN APPLICATION: native code passing in JNI DETECTED ERROR IN APPLICATION: native code passing in reference to invalid stack indirect reference table or invalid reference: 0xxxxx`. Why does the same operation work in Java but not in `native`? The root of the problem is Java's GC, which can determine whether an object needs to be marked as garbage through various garbage detection algorithms. In the `native` world, there is no GC, so in order not to cause memory leaks, you have to adopt the strictest policy, **where the `native` method is called by default is where the Java object is used**. So at the end of the scope of the `native` method call, the temporary object is marked as garbage by the GC, and if you want to use it again later, it may already be recycled. Luckily, the powerful `JNIEnv` class also provides methods for us to change this default strategy - `NewGlobalRef`. All an object needs to do is tell the JVM that it wants to live a little longer in this way, and the JVM will not mark it as garbage when performing garbage detection, and the object will live on. In until `DeleteGlobalRef` is called.***Here `NewGlobalRef`, `DeleteGlobalRef` are one-to-one correspondence, and it is better to call `DeleteGlobalRef` to free memory when the object is no longer needed to avoid memory leaks***.

## Summary
***JNI development will involve knowledge of Java and C/C++ development, in the C/C++ implementation of JNI, the basic idea is to use C/C++ syntax to write Java logic, that is, everything for the service of Java.JNI development process, the main two issues to be dealt with, function registration and data access.*** 

Function registration is recommended to use dynamic registration, use `RegisterNatives` of `JNIEnv` to register the function in `JNI_OnLoad` function, pay attention to keep the consistency of Java's `native` methods and type signatures, and don't forget to prefix the prefix `L`, suffix `;` for composite types, and replace `. ` for `/`.

Data access first needs to determine the access period, objects that need to be accessed in multiple places or at different times, remember to use `NewGlobalRef` to prevent the object from being recycled, and of course remember `DeleteGlobalRef`. To access an object, you need to get the id of the object and then determine the access method based on the type of access. Setting a property is usually in the form of `SetXField` and getting the value of a property is usually in the form of `GetXField`. To call a method, you need to determine the calling method based on the type of the return value, usually in the form of `CallXMethod`. Of course, all these are for normal objects, if you need to access static properties or methods, you add `Static` in front of the normal version of `X`. All `X`s here refer to types, except for basic types, where `Object` is substituted.

When registering functions and accessing data, one of the things you need to keep an eye on is the data type; C/C++ data types, except for the basic types, cannot be passed directly to Java, but need to be passed by creating an object. The general object creation method `NewObject` can create any object, and there are quick methods `NewStringUTF` and `NewXArray` for strings and arrays, which are frequently used. These two methods are essential for passing strings and arrays to Java.

That's all for now — we'll see you in the next post!