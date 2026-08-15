---
title: Android NDK Development Primer
description: This section introduces the toolchain used in Android NDK development, explains why these tools are necessary, and provides corresponding examples for each stage.
date: 2022-03-06
updated: 2026-04-05
tags: ["Android", "JNI", "C++", "NDK"]
draft: false
---

In Android development, there are times when you need to use libraries written in C/C++ for reasons like security, performance, or code reuse. While modern toolchains have significantly reduced the difficulty of this task, getting started is always the hardest part, and beginners often encounter many unpredictable issues. This guide was written to help readers who are just starting to write C/C++ libraries. To minimize cognitive gaps as much as possible, this article will start from the simplest functionality and gradually introduce toolchains until we achieve the final goal—truly understanding not just how things work, but why they work that way.

## Target

The goal of this article is straightforward: to be able to call a C/C++ function from an Android application—a function that takes two integer values and returns their sum. Let's call this function `plus` for now.

## Starting with C++ Source Files

To begin from the most familiar ground, let's skip the complex tools for now and start with the most basic C++ source file.

Open any text editor you prefer—VS Code, Notepad++, or even Notepad—and create a new text file, saving it as `math.cpp`. Now you can write code in this file.

Our objective is clear: implement a `plus` function that takes two integers and returns their sum. It might look like this:

```c
int plus(int left, int right)
{
    return left + right;
}
```

That's it—our source file is complete. Pretty simple, right?

However, having a source file alone isn't enough because this is only human-readable—the machine can't understand it. That's why we need our first tool: the compiler. A compiler helps convert what humans can read into something machines can understand as well.

## Compilers

A compiler is a complex piece of engineering, but it serves two fundamental purposes:

1. **Understanding source file content** (what humans can read)—detecting syntax errors in the source file
2. **Understanding binary content** (what machines can read)—generating binary machine code

While these functions seem simple, compilers are incredibly complex. The real challenge lies in function 2. Because of this challenge, compilers have evolved into many different types. Common ones include VS for Windows, G++ for Linux, and Clang for Apple. For Android, the situation is slightly different—all these compilers run on specific systems and produce programs that can only run on their corresponding systems. Using my machine as an example, I'm writing C++ code on Deepin Linux, but our goal is to run the code on an Android phone—two completely different platforms. More pessimistically, there still isn't a compiler that can run directly on phones. So does that mean we can't run C++ code on phones? Of course not—because cross-compilation exists.

Cross-compilation is a technology that generates executable objects for one platform from another platform. Its biggest difference from regular compilation lies in linking. Regular linking can directly find suitable library files in the system library, but cross-compilation can't do this because the current platform isn't the final execution platform. Therefore, cross-compilation also needs the common libraries of the target platform. Fortunately, Google has prepared all of this for us, and it's called the NDK.

## NDK

NDK stands for Native Development Kit and contains many tools, compilers, linkers, standard libraries, and shared libraries. These are all essential for cross-compilation. For easier understanding, let's first look at its file structure. Using the version on my machine as an example—`/home/Andy/Android/Sdk/ndk/21.4.7075529` (on Windows, the default location is `c:\Users\xxx\AppData\Local\Android\Sdk\`). The NDK is saved in the Sdk directory, named `ndk`, and uses the version number as the root directory for that version. In the example, my installed NDK version is `21.4.7075529`. This path is also the value of the `ANDROID_NDK` environment variable. In other words, before setting environment variables, we need to determine the NDK version to use, and the path value should go up to the version directory.

Now that we understand the storage location, we need to recognize two important directories:

- `build/cmake/`—we'll expand on this folder shortly.
- `toolchains/llvm/prebuild/linux-x86_64`—the final `linux-x86_64` varies by platform. On Windows, it would start with `Windows`, but you generally can't go wrong because there's only one folder in this path with a common prefix. Here you'll find the compilers, linkers, libraries, and headers we've been looking for. For example, compilers exist in the `bin` directory under this path, and they all end with `clang` or `clang++`, such as `aarch64-linux-android21-clang++`.

Let's break down this compiler name:

1. `aarch64` indicates that this compiler generates binary files for machines with `arm64` architecture. Other corresponding options include `armv7a`, `x86_64`, etc. Different platforms need matching compilers. This is called the target platform in cross-compilation.
2. `linux` indicates that the compilation operation is being performed on a `linux` machine—this is called the host platform in cross-compilation.
3. `android21` is clearly the target system version.
4. `clang++` indicates it's a C++ compiler; the corresponding C compiler is `clang`.

As you can see, for Android, different hosts, different instruction sets, and different Android versions each correspond to a specific compiler.

After learning all this, it's time for the exciting part—let's compile the C++ file we created earlier.

## Compilation

Running `aarch64-linux-android21-clang++ --help` will show you many parameters and options. Since we just want to verify whether our C++ source file has syntax errors, we'll skip all the complex options and simply run `aarch64-linux-android21-clang++ -c math.cpp` to perform the compilation.

If everything goes smoothly, a `math.o` object file will be generated in the same directory as `math.cpp`, indicating our source code has no syntax errors and can proceed to the linking stage.

But before that, let me interrupt briefly. Typically, our projects will contain many source files and reference third-party libraries. Hand-compiling and linking each time is obviously inefficient and error-prone. With mature tools available today, we should use established tools and focus on our business logic. `CMake` is exactly such a tool.

## CMake

CMake is a cross-platform project build tool. How do we understand this? When writing C++ code, sometimes you need to reference header files from other directories. However, during compilation, the compiler doesn't know where to find these headers, so a configuration is needed to tell the compiler where to search. Moreover, source code distributed across different directories needs to be packaged into different libraries based on certain requirements. Or if the project references third-party libraries, the linker needs to be told where to find them during the linking phase. All of these require configuration.

Different systems and different IDEs support these configurations differently. For example, Visual Studio on Windows requires configuration in the project properties. When developers use the same tools, the problem isn't significant. But once multi-platform, multi-IDE scenarios are involved, collaborative development spends a lot of time on configuration. CMake was born to solve these problems.

All CMake configuration information is written in a file named `CMakeLists.txt`. As mentioned earlier, whether it's header file references, source dependencies, or library dependencies—just write them once in `CMakeLists.txt`, and they can be used seamlessly across major IDEs on Windows, macOS, and Linux. For example, I created a CMake project in Visual Studio on Windows, configured the dependency information, and sent it to a colleague. My colleague develops on macOS and can immediately compile, package, and test without any modifications. This is the power of CMake's cross-platform capability—simple, efficient, and flexible.

## Managing Projects with CMake

### Creating a CMake Project

We already have `math.cpp` and CMake. Now let's combine them.

How do you create a CMake project? It takes three steps:

1. **Create a folder**—in the example, let's create a folder named `math`.
2. **Create a `CMakeLists.txt` text file** in the newly created folder. Note that the filename cannot be changed.
3. **Configure project information** in the newly created `CMakeLists.txt` file.

The simplest CMake project configuration needs to include at least three things:

- **Minimum supported CMake version**

```cmake
cmake_minimum_required(VERSION 3.18.1)
```

- **Project name**

```cmake
project(math)
```

- **Output**—The output can be an executable or a library. Since we're generating a library for Android, the output here is a library.

```cmake
add_library(${PROJECT_NAME} SHARED math.cpp)
```

After these three steps, the CMake project is created. Next, let's try compiling the project with CMake.

### Building a CMake Project

Before the actual compilation, CMake has a preparation phase where it gathers necessary information, generates the appropriate project files, and then performs the compilation.

What is the necessary information? To reduce complexity as much as possible, CMake guesses and collects some information automatically.

For example, when we run the generation on Windows, CMake defaults to assuming the target platform is Windows and generates a VS project. So compiling Windows libraries on Windows is nearly zero-configuration.

1. **Create a `build` directory** under the `math` directory and switch the working directory to `build`.

```shell
cd build
cmake ..
```

After the command executes, you'll find the VS project in the `build` directory. You can open it directly with VS and complete the build without errors. Of course, the faster method is to use CMake directly.

2. **Build with CMake**

```shell
cmake --build .
```

Note that the preceding `..` represents the parent directory, which is where `CMakeLists.txt` exists—the `math` directory. The `.` represents the current directory, which is `build`. If both steps execute successfully, we'll get a library file in the build directory. On Windows it might be called `math.dll`, while on Linux it might be `math.so`. Both are shared libraries because that's what we configured in `CMakeLists.txt`.

From the above process, CMake's workflow isn't complex. But we're using default configuration, meaning the final library can only be used on the platform it's compiled for. To use CMake to build Android libraries, we need to manually tell CMake some configuration during project generation instead of letting CMake guess.

## Cross-Compilation with CMake

### Where Do Configuration Parameters Come From?

Although we don't know the minimum configuration for cross-compilation, we can make some educated guesses.

First, to complete source code compilation, we definitely need compilers and linkers. As we know, Android has dedicated compilers and linkers, so at least one configuration should tell CMake which compiler and linker to use.

Second, the Android system version and architecture are also essential. After all, for Android development, these are important for any Android application.

Can you think of other parameters? Seems like we've covered the essentials. The good news is that Google has thought of this for us—use `CMAKE_TOOLCHAIN_FILE` directly. This option is provided by CMake. When using it, just set the configuration file path as its value. CMake will find the target file through this path and use its configuration instead of guessing. This configuration file is one of the two important folders mentioned earlier: `build/cmake`. Our configuration file is `android.toolchain.cmake` under that folder.

### Google's CMake Configuration File

`android.toolchain.cmake` acts as a wrapper. It uses parameters provided to it, combined with default configuration, to complete CMake's configuration work. This file is actually an excellent CMake learning resource—you can learn many CMake techniques from it. For now, let's not dive into CMake-related learning and first look at what parameters are available. Google has listed all configurable parameters at the beginning of the file:

```cmake
ANDROID_TOOLCHAIN
ANDROID_ABI
ANDROID_PLATFORM
ANDROID_STL
ANDROID_PIE
ANDROID_CPP_FEATURES
ANDROID_ALLOW_UNDEFINED_SYMBOLS
ANDROID_ARM_MODE
ANDROID_ARM_NEON
ANDROID_DISABLE_FORMAT_STRING_CHECKS
ANDROID_CCACHE
```

These parameters aren't actually CMake parameters. During the configuration file execution, they're converted into actual CMake parameters. By specifying values for these parameters, we can let CMake complete different build requirements. If not specified, defaults are used, which may vary across NDK versions.

Let's focus on the most critical ones: `ANDROID_ABI` and `ANDROID_PLATFORM`. The former specifies the CPU instruction set for the built package. Available values include `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`, `mips`, and `mips64`. The latter specifies the Android version of the built package. It has two forms: directly as `android-[version]`, where `[version]` is replaced with the actual system version, such as `android-23`, indicating the minimum supported system version is Android 23. The other form is the string `latest`, which means what it says—use the newest version.

How do we know what values a parameter can take? There's a simple method: first locate the parameter to check in the file header, then search globally. Looking at `set` and `if` related statements will help determine the supported parameter forms.

### Completing Cross-Compilation with the Configuration File

After all that explanation, let's return to our initial example. Now we have `CMakeLists.txt`, `math.cpp`, and the Android configuration file `android.toolchain.cmake`. How do we combine all three? This brings us to CMake's parameter configuration.

Earlier, we directly used:

```shell
cmake ..
```

This completed the project file generation configuration, but it can actually accept parameters. **CMake parameters are key-value pairs separated by whitespace, all starting with `-D`.** CMake's default parameters all start with `CMAKE`, so in most cases, parameters take the form `-DCMAKE_XXX`. For example, passing a toolchain file to CMake looks like this:

```shell
cmake -DCMAKE_TOOLCHAIN_FILE=/home/Andy/Android/Sdk/ndk/21.4.7075529/build/cmake/android.toolchain.cmake
```

This parameter tells CMake to use the file specified after `=` to configure CMake's parameters.

However, to complete cross-compilation, we're still missing one option: `-G`. This option is required for cross-compilation because CMake doesn't know what form of project to generate, so we need to use this option to specify the project type. One option is the traditional Make project:

```shell
cmake -G "Unix Makefiles"
```

This form is based on Unix-style Make projects and uses `make` as the build tool. After specifying this form, you also need to specify the `make` path for the project to complete compilation. The other Google-recommended approach is `Ninja`, which is simpler because there's no need to separately specify Ninja's path—it installs in the same directory as CMake by default, reducing one parameter. Ninja is also a build tool but focuses on speed, so we'll use Ninja this time. Its specification is:

```shell
cmake -GNinja
```

Combining these two parameters, we get the final build command:

```shell
cmake -GNinja -DCMAKE_TOOLCHAIN_FILE=/home/Andy/Android/Sdk/ndk/21.4.7075529/build/cmake/android.toolchain.cmake ..
```

After generating the project, execute the build:

```shell
cmake --build .
```

We now have the final shared library that can run on Android. The library built with my NDK version supports Android version 21 with the armeabi-v7a instruction set. As described earlier, we can pass desired parameters like passing the toolchain file. For example, to build an `x86` library with the latest Android version:

```shell
cmake -GNinja -DCMAKE_TOOLCHAIN_FILE=/home/Andy/Android/Sdk/ndk/21.4.7075529/build/cmake/android.toolchain.cmake -DANDROID_PLATFORM=latest -DANDROID_ABI=x86 ..
```

This gives us a hint: if some third-party libraries don't provide compilation instructions but are managed with CMake, we can directly apply the formula above to compile them.

## JNI

With CMake's help, we obtained the `libmath.so` shared library. However, this library still can't be used directly by Android applications because Android applications are developed in Java (Kotlin), and both are JVM languages where code runs on the JVM. To use this library, we need a way to load it into the JVM before it can be accessed. Fortunately, the JVM has exactly this capability—it's called JNI.

### JNI Fundamentals

JNI provides bidirectional access between Java and C/C++. You can access C/C++ methods or data from Java code, and vice versa. The JVM plays an indispensable role in this process. To understand JNI technology, we need to think from the JVM's perspective.

The JVM is like a cargo distribution center. No matter where goods are going, they must first come to this distribution center, which then distributes them to their destinations. Here, "goods" can be Java methods or C/C++ functions. But unlike regular courier services, goods here don't know their own destination—the distribution center needs to find it. So where does the basis for finding come from? How do we ensure the uniqueness of the distribution center's search results? The simplest method is for the goods to identify themselves and ensure their uniqueness.

For Java, this problem is easy to solve. Java has layered mechanisms for ensuring uniqueness:

1. Package names ensure class name uniqueness
2. Class names ensure class uniqueness within the same package
3. Method names ensure uniqueness within the same class
4. When method overloading occurs, parameter types and counts determine uniqueness

For C/C++, there are no package names or class names. So can method names and parameters ensure uniqueness? The answer is yes—as long as we treat package names and class names as additional qualifiers.

There are two ways to add qualifiers. The first is straightforward: directly include the package name and class name as part of the function name. This way, the JVM doesn't need to look at anything else—it can directly match package name, class name, function name, and parameters to determine the corresponding method on the other end. This method is called static registration. This is actually very similar to broadcasts in Android: static broadcast registration is directly hardcoded in the `AndroidManifest.xml` file, requiring no code configuration—once written, it takes effect immediately. Corresponding to static registration, there's also dynamic registration. Dynamic registration tells the JVM the function mapping through code rather than letting it search at function call time. Clearly, this approach has the advantage of faster call speed since we only need one registration, and subsequent calls can directly access the other end without lookup operations. However, like dynamic broadcast registration in Android, dynamic registration is much more complex, and you need to pay attention to the registration timing to avoid call failures. Let's continue with our `libmath.so` example.

### Using Native Libraries from Java

Accessing C/C++ functions from Java is simple and takes three steps:

1. **Java calls `System.loadLibrary()` to load the library**

```java
System.loadLibrary("math.so");
```

Note that the shared library generated by CMake is `libmath.so`, but only `math.so` is written here—meaning the `lib` prefix isn't needed. After this step completes, the JVM knows there's a `plus` function.

2. **Java declares a `native` method corresponding to the C++ function.** "Corresponding" here means the parameter list and return type must match. The method name doesn't need to match.

```java
public native int nativePlus(int left, int right);
```

By convention, `native` methods often have a `native` prefix.

3. **Call the `native` method directly where needed.** Calling methods works the same as regular Java methods—pass matching parameters and receive the return value with a matching type.

Combining these steps into one class looks like this:

```java
package hongui.me;

import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import hongui.me.databinding.ActivityMainBinding;

public class MainActivity extends AppCompatActivity {

    static {
        System.loadLibrary("me");
    }

    ActivityMainBinding binding;

    private native int nativePlus(int left, int right);

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Example of a call to a native method
        binding.sampleText.setText("1 + 1 = " + nativePlus(1, 1));
    }
}
```

### Introducing JNI on the C/C++ Side

JNI is actually an adaptation layer for C/C++. This layer mainly handles function conversion work rather than specific functionality implementation. So typically, we create a new source file dedicated to handling JNI layer issues, and the main issue at the JNI layer is the method registration problem mentioned earlier.

#### Static Registration

The basic idea of static registration is to write a corresponding C/C++ function signature based on an existing Java `native` method. This takes four steps:

1. **Write the exact same function signature as the Java `native` function**

```c
int nativePlus(int left, int right)
```

2. **Add the package name and class name before the function name.** Since package names use `.` in Java, and `.` in C/C++ is typically used for function calls, we need to replace `.` with `_` to avoid compilation errors.

```c
hongui_me_MainActivity_nativePlus(int left, int right)
```

3. **Convert function parameters.** We mentioned that all operations are based on the JVM. In Java, these happen naturally, but in C/C++ there's no JVM environment. The only way to provide JVM environment is by adding parameters.

To achieve this, any JNI function must add two parameters at the beginning of its parameter list. The smallest environment in Java is a thread, so the first parameter is the `JNIEnv` object representing the caller's thread environment when the function is called. This object is the only channel for C/C++ to access Java. The second parameter is the calling object. Since Java can't directly call methods without a class name or class instance, the second parameter represents that object or class, and its type is `jobject`. From the third parameter onward, the parameter list corresponds one-to-one with Java. However, it's only a correspondence—some types don't exist in C/C++, which brings us to JNI's type system. For our current example, Java's `int` corresponds to JNI's `jint`, so both parameters are `jint` types. This step is critical—any failed parameter conversion can cause program crashes.

```c
hongui_me_MainActivity_nativePlus(
        JNIEnv* env,
        jobject /* this */,
        jint left,
        jint right)
```

4. **Add necessary prefixes.** This step is easy to overlook because it's not as intuitive. First, we need to add the prefix `Java` to the function name, making it `Java_hongui_me_MainActivity_nativePlus`. Second, we need to add `JNIEXPORT` and `JNICALL` around the return type. Since the return type is `jint`, after adding these macros it becomes `JNIEXPORT jint JNICALL`. Finally, we need to add `extern "C"` compatibility directive at the very beginning. Readers interested in why this step is needed can research further. In short, this is JNI specification.

After these four steps, the final C/C++ function signature for static registration looks like this:

```c
#include "math.h"

extern "C" JNIEXPORT jint JNICALL
Java_hongui_me_MainActivity_nativePlus(
        JNIEnv* env,
        jobject /* this */,
        jint left,
        jint right) {
           return plus(left, right);
        }
```

Note that I changed `math.cpp` to `math.h` here and called this function in the JNI adapter file (named `native_jni.cpp`). So now there are two source files, and we need to update `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.18.1)

project(math)

add_library(${PROJECT_NAME} SHARED native_jni.cpp)
```

We only changed the filename in the last line because the current `CMakeLists.txt` directory is also in the `include` search path, so no separate value is needed. If you need to add headers from other locations, you can use `include_directories(dir)`.

Now rebuild with CMake to generate the shared library. This time, Java can run it directly without errors.

#### Dynamic Registration

We mentioned that dynamic registration requires attention to timing. What counts as good timing? From the "Using Native Libraries from Java" section, we know that to use a library, it must first be loaded. After successful loading, JNI methods can be called. Therefore, dynamic registration must occur after loading but before use. JNI thoughtfully addresses this—the `jint JNI_OnLoad(JavaVM *vm, void *reserved)` function is called immediately after the library finishes loading. This function also provides a crucial `JavaVM` object, making it the perfect entry point for dynamic registration. Now that we've determined the registration timing, let's implement it. **Note: Dynamic registration and static registration are both ways to implement JNI functions on the C/C++ side. A function generally uses only one registration method.** So the following steps are parallel to static registration, not sequential.

Dynamic registration has six steps:

1. **Create the `native_jni.cpp` file** and add the implementation of `JNI_OnLoad()`.

```c
extern "C" JNIEXPORT jint JNICALL
JNI_OnLoad(JavaVM *vm, void *reserved) {

   return JNI_VERSION_1_6;
}
```

This is the standard form and implementation of this function. The preceding string is the standard JNI function form. The key points are the function name, parameters, and return value. For this function to be called automatically after library loading, the function name must be exactly this, the parameter form cannot change, and the return value tells the JVM the current JNI version. Basically, these are templates—just copy them.

2. **Get the `JNIEnv` object**

We mentioned that all JNI-related operations are done through the `JNIEnv` object. But now we only have a `JavaVM` object. The secret clearly lies with `JavaVM`.

We can get the `JNIEnv` object through its `GetEnv` method:

```c
JNIEnv *env = nullptr;
vm->GetEnv(env, JNI_VERSION_1_6);
```

3. **Find the target class**

We said both dynamic and static registration require package and class name qualifiers, just used differently. So dynamic registration also uses package and class names, but in a different form. Static registration uses `_` instead of `.` for package and class names. For dynamic registration, use `/` instead of `.`. So our final class form is `hongui/me/MainActivity`. This is a string form. How do we convert it to the `jclass` type in JNI? This is where the `JNIEnv` object from step 2 comes in:

```c
jclass cls = env->FindClass("hongui/me/MainActivity");
```

This `cls` object corresponds one-to-one with `MainActivity` in Java. Now that we have the class object, the next step is methods.

4. **Generate the JNI function object array**

Since dynamic registration can register multiple methods of a class simultaneously, the registration parameter is in array form, with the array type being `JNINativeMethod`. This type connects Java's `native` methods with JNI methods. How does it work? Look at its structure:

```c
typedef struct {
    const char* name;
    const char* signature;
    void* fnPtr;
} JNINativeMethod;
```

- `name` corresponds to the Java `native` method name, so this value should be `nativePlus`.
- `signature` corresponds to the parameter list plus the function type signature.

What is a signature? It's a type abbreviation. Java has eight primitive types, plus methods, objects, classes, arrays, etc. Each has a corresponding string form, like a hash table where keys are the string representation of types and values are the corresponding Java types. For example, `jint` is the actual JNI type, and its type signature is `I`—the uppercase first letter of `int`.

Functions also have their own type signatures: `(paramType)returnType`. Both `paramType` and `returnType` need to be JNI type signatures, with no separators between types.

Therefore, `nativePlus`'s type signature is `(II)I`—two integer parameters returning another integer.

- `fnPtr` is exactly as the name suggests—a function pointer whose value is our actual `nativePlus` implementation (we haven't implemented it yet, so we'll assume it's `jni_plus` for now).

In summary, the final function object array should be:

```c
JNINativeMethod methods[] = {
    {"nativePlus", "(II)I", reinterpret_cast<void *>(jni_plus)}
};
```

5. **Register**

Now we have the `jclass` object representing the class, the `JNINativeMethod` array representing methods, and the `JNIEnv` object. Combining them completes the registration:

```c
env->RegisterNatives(cls, methods, sizeof(methods) / sizeof(methods[0]));
```

The third parameter represents the number of methods. We used the `sizeof` operator to get the total size of `methods` and divided by the size of the first element to get the count. Of course, manually entering 1 directly is also acceptable.

6. **Implement the JNI function**

In step 4, we used `jni_plus` to represent `nativePlus`'s native implementation, but this function hasn't actually been created yet. We need to define it in the source file. Now the function name can be arbitrary—no need for the long name required by static registration. We just need to keep the final function name consistent with the one used during registration. However, we still need to add the `extern "C"` prefix to prevent the compiler from doing special processing on the function name. The parameter list is exactly the same as static registration. So our final function implementation is:

```c
#include "math.h"

extern "C" jint jni_plus(
        JNIEnv* env,
        jobject /* this */,
        jint left,
        jint right) {
           return plus(left, right);
        }
```

Dynamic registration is now complete. After CMake builds it, you'll find the result is exactly the same as static registration. So the choice between these two registration methods depends entirely on personal preference and requirements. When native methods are called frequently, dynamic registration has an advantage. But if the call count is very low, static registration is fine—the lookup cost is negligible.

## One More Thing

I mentioned that CMake is excellent for managing C/C++ projects, but for Android development, Gradle is king. Google is aware of this, so the Gradle plugin provides seamless CMake and Gradle integration. Under the `android` build block, you can directly configure the path and version information for `CMakeLists.txt`:

```groovy
externalNativeBuild {
    cmake {
        path file('src/main/cpp/CMakeLists.txt')
        version '3.20.5'
    }
}
```

With this, whether you modify C/C++ code or Java code, you can just click Run. Gradle will compile the corresponding library and copy it to the final directory—no manual compilation or library copying needed. If you're not satisfied with its default behavior, you can configure it through `defaultConfig`:

```groovy
android {
    compileSdkVersion 29

    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 29

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles 'consumer-rules.pro'

        externalNativeBuild {
            cmake {
                cppFlags += "-std=c++1z"
                arguments '-DANDROID_STL=c++_shared'
                abiFilters 'armeabi-v7a', 'arm64-v8a'
            }
        }
    }
}
```

Here, `cppFlags` specifies C++-related parameters (there's also `cFlags` for C parameters). `arguments` specifies CMake compilation parameters. The last one specifies how many architecture packages the library will generate—we're generating just two here.

With these configurations, developing NDK in Android Studio is just like developing in Java—you get code completion, instant compilation, instant execution—smooth all the way.

## Summary

NDK development actually consists of two parts: C++ development and JNI development.

C++ development is exactly the same as PC C++ development. You can use standard libraries and reference third-party libraries. As project scale grows, CMake is introduced to manage the project. This provides obvious advantages for cross-platform projects and integrates seamlessly with Gradle.

JNI development focuses more on the correspondence between C/C++ and Java sides. Every Java `native` method needs a corresponding C/C++ function. JNI provides two methods—static registration and dynamic registration—to accomplish this, but both rely on using package names, class names, function names, and parameter lists to determine uniqueness. Static registration reflects package and class names in the function name. Dynamic registration uses class objects, native method objects, and `JNIEnv`'s registration method to achieve uniqueness.

NDK is the big boss behind it all. It provides compilers, linkers, and other tools for cross-compilation, along with system libraries like `log`, `z`, `opengl`, etc., for direct use.
