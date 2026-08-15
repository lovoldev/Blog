---
title: Personal Understanding and Usage of CMake
description: "A practical, structured introduction to CMake, covering the basics of building projects, cross-compilation, and using CMake in Android projects."
date: "2021-08-09"
updated: "2026-03-23"
tags: ["Android", "C++", "JNI","CMake"]
cover: /images/cover/cmake.webp
draft: false
---

# Understanding and Using CMake

## Introduction

CMake is a cross-platform build system generator that abstracts away platform-specific build details. It allows developers to work with their preferred tools and environments without being constrained by project-specific configurations.

In practice, CMake acts as a coordination layer over compilers, linkers, and build systems. Once configured correctly, it enables consistent builds across environments and significantly improves collaboration efficiency.

## A Minimal CMake Project
### Project Setup

A project managed by CMake typically contains a `CMakeLists.txt` file in its root directory. Subdirectories may also have their own `CMakeLists.txt` files, but we'll address that later. Let's start with the simplest project possible. Here's an example of a minimal project structure:

```shell
CMakeProject
|    CMakeLists.txt
|    main.cpp
```
This is a complete, runnable minimum viable project. Let's go through the file contents step by step.

```cmake
# CMakeLists.txt

# Set minimum CMake version
cmake_minimum_required(VERSION 3.10)
# Set project name
project(CMakeProject)
# Specify source files for the executable
add_executable(${CMAKE_PROJECT_NAME} main.cpp)
```

Notes:

- CMake commands are case-insensitive
- Lines starting with `#` are comments
- Variable references use the syntax `${variable_name}`

The actual meaningful content in the file boils down to just three lines:

1. `cmake_minimum_required(VERSION 3.10)` sets the minimum CMake version. `VERSION` is the parameter name, followed by the version number—you can adjust this based on your needs. **Note that parameters and their values are separated by whitespace, not commas**, otherwise you'll get an error.
2. `project(CMakeProject)` In CMake, strings can be quoted or unquoted with identical results. This line configures the project name, which is used in many places throughout the build process, such as for the project name and the output binary name.
3. `add_executable(${CMAKE_PROJECT_NAME} main.cpp)` is where we actually manage source files and the final target. Here we're using variable reference syntax, but this variable isn't defined in the file—it exists as a CMake predefined variable. CMake has many predefined variables we can reference directly. This particular syntax sets the project name as the executable name, though you could also just use a string literal for a different name. The `main.cpp` specifies the source file path for generating the output. This is where CMake shows its flexibility. **Source paths can be diverse—found automatically, written directly, relative, or absolute.** For multiple source files, just separate them with whitespace and list them sequentially.

In the configuration above, we specified `main.cpp` as the source file and want to generate an executable program called `CMakeProject`. Let's see what this program actually does:

```cpp
// main.cpp
#include <iostream>
int main()
{
	std::cout<<"hello CMake"<<std::endl;
	return 0;
}
```

It's quite simple—just prints "hello CMake".

### Building and Running the Project

The preparation is done. Now let's use CMake to generate the executable.

First, you'll need to install CMake. You can download it from [Download](https://cmake.org/download/). Choose the appropriate version for your platform, and after installation, add it to your system PATH so you can use it from anywhere.

Once CMake is installed, open your command line tool, navigate to the project root directory (where `CMakeLists.txt` and `main.cpp` are located), and prepare to generate the project.

Typically, to avoid cluttering and polluting your current working environment, we create a separate directory for generated project files. I'll primarily use Windows for explanation here, but other platforms work essentially the same.

```shell
mkdir build                # Create directory to store project files
cd build                   # Switch to CMake working directory
cmake ..                   # Generate project files
```

After executing these three steps, you'll see that Visual Studio project files have been generated in the build folder. You can open the project directly in Visual Studio and compile and debug as usual. However, if you want to generate the executable as quickly as possible, I recommend using CMake directly.

To compile with CMake, you simply need to run one additional command after the steps above (assuming the three steps completed successfully): `cmake --build .`. Be careful not to miss the final dot—it tells CMake to build in the current working directory.

If all four steps went smoothly, you'll find the executable named after the first parameter in `add_executable` (in this case, `CMakeProject.exe`) in the `build/debug` directory. Double-click it or drag it to the command line to run it.

### Project Extension

In the previous example, we used two commands to generate project files. However, this can actually be done with a single command: `cmake -S . -B build`. This command uses the current directory as the source path and `build` as the output directory for generated files—in other words, you don't need to manually create the `build` folder. The `-S` parameter specifies the source path, while `-B` specifies the build path.

While the operations above are already quite simple, for ongoing development requiring frequent modifications and testing, it can still feel tedious and repetitive, especially constantly switching directories. So I recommend using a batch script to handle these operations. Combining directory cleanup and directory switching, the final batch script would look like this:

```shell

@echo off
mkdir build
cd build
cmake ..
cmake --build .
cd debug
CMakeProject
cd ../..
```

Let me explain each line in order:

The first line disables command echo, because we don't want the batch script's output cluttering CMake's output and causing unnecessary confusion. Usually, we only care about whether it completed successfully, not the details of what it's doing.

The next four lines are what we covered earlier, so I won't repeat the explanation.

The second-to-last line directly executes the executable (replace with your own executable name). This is useful because some applications generate files during execution.

After execution completes, we switch back to the project root directory—hence the last line. Since we changed to the build directory during compilation, and the executable is in a subdirectory of the build directory, we need to go back up two levels to return to the root. This is crucial for ensuring the batch script can run successfully the next time.

Save the content above as a file ending with `.bat`, and next time you can simply type the batch filename in the command line to complete generation and building in one go. Pretty convenient, right?

That's essentially all you need to know about CMake projects. However, real projects are far more complex. Next, I'll build on the pitfalls I've encountered, gradually increasing project complexity to develop a solid understanding of CMake's workflow.

## Multi-Source Projects

### Personal Insights

Before we begin, let me share my understanding of CMake projects, or more specifically, `CMakeLists.txt` files. **We shouldn't understand individual configurations in isolation. We need to categorize these commands and even distill their core working patterns. I approach this using the C++ file compilation and linking process as a guide.**

As we all know, transforming a C++ source file into executable code requires three steps:

- **Preprocessing**: Copying header file contents into the source file, macro substitution, etc.
- **Compilation**: Compiling source files into `.o` object files
- **Linking**: Taking `.o` files and other libraries as input to generate the executable

Understanding CMake through this lens makes it much simpler. If CMake throws an error, we can pinpoint which stage caused the problem based on the error message, enabling us to quickly find a solution. Additionally, this framework helps us categorize CMake configurations. Here's my rough categorization:

- **Basic CMake configuration**: `cmake_minimum_required`
- **Source file management**: `file`, `aux_source_directory`
- **Library management**: `find_library`
- **Header file management**: `include_directories`
- **Link library management**: `link_directories`
- **Subproject management**: `add_subdirectory`
- **Output management**: `add_executable`, `add_library`

Of course, these are just a small portion of what's available, but they provide a solid framework for understanding and troubleshooting issues.

### Managing Subdirectories with CMake

In many cases, we'll introduce third-party packages to avoid duplicating work. Typically, such code is placed in a separate directory. To simulate this scenario, I created a subdirectory for third-party code. For this situation, there are two inclusion methods—subdirectory and sub-module.

Let's start with the simpler one: subdirectory. A subdirectory treats third-party code as part of your own code, merged and compiled together. This approach keeps your project more compact. Here's the project structure:

```shell
CMakeProject

|   auto.bat
|   CMakeLists.txt              // Modified
|   main.cpp                    // Modified
|

\---3rd                         // New
        lib.h
```

I created a subfolder to simulate third-party code. Now when we include it in `main.cpp` and compile, we'll get an error: `fatal error C1083: Cannot open include file: "lib.h": No such file or directory`. This is expected. Combined with my earlier explanation, this error relates to header files. Checking the CMake documentation, I found the `include_directories` command, which adds header file search paths so CMake can find them. So I added `include_directories(3rd)` to `CMakeLists.txt`, and when I recompiled, the project ran correctly. Here's the updated `CMakeLists.txt`:

```cmake
# CMakeLists.txt

# Set minimum CMake version
cmake_minimum_required(VERSION 3.10)
# Set project name
project(CMakeProject)
# Specify source files for the executable
add_executable(${CMAKE_PROJECT_NAME} main.cpp)
# Add header file directory
include_directories(3rd)
```

After adding the header file directory, when we recompile, the project runs correctly again.

```cpp
// main.cpp
#include <iostream>
#include <lib.h>

int main()
{
    int a=1,b=1;
	std::cout<<"hello CMake"<<std::endl;
    std::cout<<"a + b = "<<sum(a,b)<<std::endl;
	return 0;
}
```

Note: `include_directories` in CMake corresponds one-to-one with `include` in C++. That is, if `include_directories` is set to `.`, then the corresponding C++ include would be written as `3rd/lib.h`. Simply put, `include_directories` sets the root directory for includes.

Now let's look at the other approach: sub-modules.

### Managing Sub-modules with CMake

Sub-modules mean that the module can be compiled separately and provided to other libraries independently, rather than being tightly coupled with the main project. To satisfy this condition, let's modify our directory structure:

```shell
CMakeProject

|   auto.bat
|   CMakeLists.txt                   // Modified
|   main.cpp

|
\---3rd
        CMakeLists.txt               // New
        lib.cpp                      // New
        lib.h                        // Modified
```

I moved the function implementation in `lib.h` to a declaration, with the actual implementation in `lib.cpp`. The biggest change is adding the `CMakeLists.txt` file in the `3rd` directory, which uniformly manages all source files in that directory. Using `add_library`, the files in `3rd` are packaged as a sub-module.

```cmake
project(sum)
add_library(${PROJECT_NAME} lib.cpp)
```

`add_library` can also specify the build type between the name and source code. The default is `STATIC` (static library). To build a shared library, you need to explicitly specify `SHARED` (`add_library(${PROJECT_NAME} SHARED lib.cpp)`).

The significant change comes in the main directory's `CMakeLists.txt`:

```cmake
# Set minimum CMake version
cmake_minimum_required(VERSION 3.10)
# Set project name
project(CMakeProject)
# Specify 3rd as include search directory
include_directories(3rd)
# Sub-module
add_subdirectory(3rd)
# Link source files to executable
add_executable(${PROJECT_NAME} main.cpp)
target_link_libraries(${PROJECT_NAME} sum)
```

I added `add_subdirectory`, which compiles source files in a specified directory as a module, but only if that directory contains a `CMakeLists.txt` file. Another addition is `target_link_libraries`, which links the sub-module to the main module. Without this line, you'll get a linker error: `error LNK2019: Unresolved external symbol`. The module name must match the first parameter in the sub-module's `add_library` command.

## Cross-Compilation

In the previous examples, project complexity manifested as multiple directories and source files. However, when using CMake for cross-compilation, the main complexity lies in environment configuration. Although CMake can perform cross-compilation with almost no modifications to `CMakeLists.txt`, newcomers often feel overwhelmed by unfamiliar configurations, hoping to find a one-click solution. For CMake, there truly isn't such a shortcut. However, once you understand that **cross-compilation is fundamentally a process of correctly configuring property values**, the problem becomes clear. So the question transforms into a familiar one—which properties need configuration, what valid values do they have, and how do we pass these values to CMake? This is cross-compilation in its entirety.

As mentioned earlier, CMake has many predefined variables. We need to find some of these, set appropriate values, and let CMake work according to these configurations. This is what we need to do next. I'll use Windows cross-compiling for Android as an example.

### Prerequisites

On Windows, the default configuration uses MS toolchains—compilers, linkers, etc. This will cause errors when compiling libraries for Android, or even if it doesn't error, the generated binaries won't run on Android because their binary interfaces don't match. To enable CMake cross-compilation, we need to change this default behavior by passing parameters. For example, using `-GNinja` tells CMake to generate Ninja configuration files. But this alone isn't enough—common tools like compilers and linkers still need to be specified. Android C/C++ compilers are typically provided via the NDK, so we need to download it. The NDK provides multiple toolchains: one for the compilers and linkers needed to build binaries, and `android.toolchain.cmake`, which provides many predefined values for cross-compilation, significantly reducing our workload.

### Writing Build Scripts

Earlier, I mentioned that cross-compilation is about modifying CMake's default values, and there are two ways to do this. We should use them together.

The first method uses the `android.toolchain.cmake` file provided by the NDK. It has most values preconfigured, but these are flexible with plenty of room for customization. Therefore, depending on different user needs, we need to dynamically pass some values when executing CMake commands. This is the second method—options. Options start with `-D`, followed by a CMake predefined variable.

Since there are many options and they're quite complex, it's best to record and modify them through a script file. Here are the necessary options for compiling Android code on Windows. I'll introduce each one:

- `-DCMAKE_SYSTEM_NAME=Android` tells CMake we're building for the Android platform, i.e., performing cross-compilation.
- `-DANDROID_ABI=x86` tells CMake the target CPU architecture. Readers familiar with Android development should recognize this. Supported values change with NDK versions. For example, `armeabi` was removed in NDK r17. The current mainstream options are `armeabi-v7a`, `arm64-v8a`, `x86`, and `x86_64`. Replace the value as needed.
- `-DANDROID_PLATFORM=android-28` This isn't strictly necessary since there are defaults, but specifying it gives you more control. It determines the minimum supported system version.
- `-DCMAKE_TOOLCHAIN_FILE=C:/Users/Leroene/AppData/Local/Android/Sdk/ndk/21.0.6113669/build/cmake/android.toolchain.cmake` This is the predefined toolchain file mentioned above. Note that there are multiple files with this name in the NDK. Specifying the wrong one may cause CMake errors. My experience is to change the version number (`C:/Users/Leroene/AppData/Local/Android/Sdk/ndk/21.0.6113669`) and the preceding path, keeping the rest unchanged.
- `-DCMAKE_BUILD_TYPE=Release` specifies the build type, which is quite common.

That's all the configurations for Windows cross-compiling for Android. Let's look at the complete example:

```shell
@echo off
rd /s /q build
mkdir build
cd build
cmake -GNinja ^
-DCMAKE_TOOLCHAIN_FILE=C:/Users/Leroene/AppData/Local/Android/Sdk/ndk/21.0.6113669/build/cmake/android.toolchain.cmake ^
-DANDROID_PLATFORM=android-28 ^
-DCMAKE_SYSTEM_NAME=Android ^
-DANDROID_ABI=x86 ^
-DCMAKE_BUILD_TYPE=Release ^
../3rd
cmake --build .
```

You can see that each option is followed by a `^` symbol. This isn't part of CMake—it's a line continuation character in Windows batch scripts for readability. It tells the command parser that the command isn't finished yet. On Linux and macOS, this corresponds to `\`. Now that we have these configurations, how do we use them? It's simple—just save these commands in an `android.bat` file, navigate to the current directory in CMD, and execute it. You'll find the static library named `libsum.a` in the `build` directory. Next, let's try running this library in the emulator.

## Using CMake in Android Projects

On the Android platform, CMake is also used to manage JNI projects, working with Gradle for building. The biggest difference from regular CMake projects is that we typically need to reference several Android-related libraries, such as `log`, `android`, etc. These libraries are provided by the NDK, and we can model our `CMakeLists.txt` on the default generated one.

### Directory Structure

For clarity, let's look at the current directory structure (only representative files are listed):

```shell
CMakeProject
│  android.bat
│  CMakeLists.txt
│  main.cpp
│
├─3rd
│      CMakeLists.txt
│      lib.cpp
│      lib.h
│
└─Android
    │  build.gradle
    │
    ├─app
    │  │  build.gradle
    │  │
    │  ├─libs
    │  └─src
    │      ├─main
    │      │  │  AndroidManifest.xml
    │      │  │
    │      │  ├─cpp
    │      │  │      CMakeLists.txt
    │      │  │      native-lib.cpp
    │      │  │
    │      │  ├─java
    │      │  │  └─me
    │      │  │      └─hongui
    │      │  │          └─cmakesum
    │      │  │                  MainActivity.kt
    │      │
    │      ├─jniLibs
    │      │  └─x86
    │      │          libsum.a
```

A new `Android` subdirectory was created under the original root. This is an Android C++ project, so unlike standard Android projects, it has an additional `cpp` directory. Most of our subsequent modifications will happen in this directory.

The original root directory, to avoid adding complexity, only serves the purpose of generating static libraries, so compared to the example above, it remains unchanged.

### Building the Static Library

First, let's return to the root directory. Use the `android.bat` batch script to generate an Android-compatible static library. You can also modify the `-DANDROID_ABI` option in `android.bat` to generate static libraries for other architectures, but these must match the directories under `jniLibs`, otherwise linking may fail. For example, I generated `libsum.a` for the `x86` architecture, so I need to create an `x86` directory under `jniLibs` and place `libsum.a` there. With this, the static library build is complete.

### Using the Static Library

After placing the static library in the appropriate location, we need to configure `build.gradle` in the `app` directory and `CMakeLists.txt` in the `cpp` directory to include the static library.

#### Configuring Gradle

Let's start with `build.gradle`. This file mainly involves modifying the ABI, because if not specified, Gradle's default generated ABI may not find the corresponding static library to link, causing linking failure. Here's the main modification:

```groovy
android {
    defaultConfig {
        externalNativeBuild {
                cmake {
                    cppFlags ""
                    abiFilters "x86"
                }
            }
    }
}
```

Simply set `abiFilters` to the same value as the static library you just built.

#### Configuring CMake

The `CMakeLists.txt` file is more complex. It needs to accomplish two tasks: locate the static library and its header files, then link the static library.

##### Finding Header Files

From the second section, we already know the `include_directories` command for telling CMake where to find headers. Set the parameter to the `3rd` directory. Note that CMake uses the current `CMakeLists.txt` file's location as the working directory. So to reach the `3rd` directory, we need to navigate back up to the root project. This results in `include_directories(../../../../../3rd)`. Using relative paths is preferable in collaborative environments, eliminating the need to modify configurations.

##### Finding the Static Library

Next, we need CMake to find our static library. When it comes to libraries, everything relates to `add_library`—the only difference is the parameters. When adding a library from source code, you specify the library name and source location. When referencing a third-party library, you specify the library name and type, plus the `IMPORTED` directive to tell CMake this is an imported library. Hence: `add_library(addSum STATIC IMPORTED)`.

But here's the problem—we've only told CMake the library name and where it's stored. We need another command to specify the storage location. For configuring properties, `set_target_properties` is typically used. This command can be called multiple times to set various configurations.

`set_target_properties(addSum PROPERTIES IMPORTED_LOCATION ${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libsum.a)`

The first parameter corresponds one-to-one with the first parameter in the previous `add_library` command—you can choose any name. Actually, `add_library` generates a target, and the first parameter is used to refer to that target. That's why `set_target_properties` can find the appropriate target to configure. The second parameter is standard syntax for configuring properties. The third is the property variable, and the fourth is the value. For library path configuration, the property variable is `IMPORTED_LOCATION`. Here's a gotcha: CMake on Android requires absolute paths, not relative paths. This seems to contradict CMake's philosophy, but fortunately, we have some predefined variables available. `CMAKE_CURRENT_SOURCE_DIR` represents the absolute path of the current `CMakeLists.txt` file. With this, combined with directory traversal, we can find any directory we need.

Here's the second issue: when multiple architecture static libraries need configuration, the paths differ, leading to lots of repetitive configuration. Fortunately, `ANDROID_ABI` helps—it represents the currently compiled architecture. As compilation progresses, this value is set to the appropriate value, and it's a one-to-one match with the architecture being compiled. So while they might seem strange, they provide flexibility and simplicity.

##### Linking the Static Library

Now we have the headers and the library, but C++ compilation happens in two stages. So far, we've only handled compilation—linking hasn't been addressed yet. Fortunately, this is simpler than the previous configurations: just add a parameter in the `target_link_libraries` command:

```cmake
target_link_libraries(
                      native-lib
                      ${log-lib}
                      addSum
     )
```

Just make sure the name matches the name configured in `add_library`.

#### Using in Source Code

After this lengthy process, we can finally include the `addsum` header file in `native-lib.cpp` and use its functions. I want the function to return a string containing the sum result. Here's the implementation:

```cpp
#include <jni.h>
#include <string>
#include <lib.h>

extern "C" JNIEXPORT jstring JNICALL
Java_me_hongui_cmakesum_MainActivity_stringFromJNI(
        JNIEnv* env,
        jobject /* this */) {
    std::string hello = std::to_string(sum(1,1));
    return env->NewStringUTF(hello.c_str());
}
```

Now, click the `run` button in the toolbar, and we can finally see our static library working on the Android emulator!

### Extensions

Actually, besides using static libraries, we can also reference source code directly by configuring the `CMakeLists.txt` file. This allows on-the-fly customization, but it also reduces compilation speed and may increase `CMakeLists.txt` complexity. So I still recommend using the static library approach.

## Summary

CMake has many, many commands, and what we've covered here is just a small portion. However, I believe understanding these key concepts is sufficient for working with CMake. Further learning can be targeted as needs arise. When learning a technology, avoid trying to learn everything at once or going too deep into details. First, grasp the main concepts and clarify the overall structure—subsequent details will naturally fall into place. ***For CMake, I think understanding it through the lens of the C++ code-to-binary compilation process is sufficient. Where do the source files come from? Where are the headers? Where are the library files? How should compilation be organized? Which libraries are linked? What outputs are generated? And some common operations for these tasks—copying files, directory information, etc. This collection of concepts constitutes CMake's core.***

Additionally, CMake is just a build tool—it is not itself a compiler or linker. Some issues may not only involve CMake but also compilers and linkers. Of course, these are problems you might only encounter with deeper understanding.
