---
title: "CMake个人理解和使用"
description: "介绍CMake的基本使用经验，包括工程构建基础、交叉编译，以及怎么在Android项目中使用CMake。"
date: "2021-08-09"
updated: "2026-03-23"
tags: ["Android", "C++", "JNI","CMake"]
cover: /images/cover/cmake.webp
draft: false
---
## 前言
CMake是一个构建工具，通过它可以很容易创建跨平台的项目。使用CMake的一个主要优势是在多平台或者多人协作的项目中，开发人员可以根据自己的喜好来使选择IDE，不用受其他人工程配置的影响，它有点像跨平台的IDE，通过它配置好相关设置之后，可以在多个平台无缝衔接，提高开发效率。

## 最简单的CMake工程
### 项目搭建
一个用CMake来管理的项目，其项目根目录通常会包含一个`CMakeLists.txt`的文件，当然子目录可能也有，这种情况我们稍后再说。我们先从最简单的项目开始。以下就是一个最简单的工程示例：
```shell
CMakeProject
|    CMakeLists.txt
|    main.cpp
```
这就是完整的可以跑起来的最小项目了。按照顺序，我们来看看文件里的内容

```cmake
# CMakeLists.txt

# 设置版本号
cmake_minimum_required(VERSION 3.10)
# 设置项目名
project(CMakeProject)
# 设置产物由哪些源码构成
add_executable(${CMAKE_PROJECT_NAME} main.cpp)
```

说明：
* CMake中命令不区分大小写
* 以`#`开始的是备注
* 引用变量语法`${变量名}`

所以文档中真正的有效内容就三行，
1. `cmake_minimum_required(VERSION 3.10)`设置了CMake支持的最低版本，`VERSION`是参数名，后面是版本号，可以根据自己的需要修改。 **注意参数名和参数是以空白符分隔的，不是逗号，** 不然会报错。
2. `project(CMakeProject)`CMake中字符串可以带引号或者不带，效果是一致的，这一行就是配置了项目名，后续很多处都会用到这个变量，比如项目名，生成产物的名字等等。
3. `add_executable(\${CMAKE_PROJECT_NAME} main.cpp)`才是真正管理源码和目标产物的地方，这里我们使用了引用变量的写法，而文件中没有定义这个变量，说明这个变量存在于CMake中，在CMake还有很多预定义的变量，我们可以直接通过这种方式引用，上面的写法是将项目名设置为产物的名字，当然也可以直接填字符串，取个另外的名字都是可以的。后面的`main.cpp`则是用来生成产物的源码路径，这就是CMake最灵活的地方。**源码路径可以是多样的，查找出来的，直接写的，相对路径，绝对路径都可以。** 多个源码的话就用空白符分隔，依次写就行了。


在上面的配置文件中，我们配置了它的源文件为`main.cpp`，我们想通过它来生成一个可执行的程序`CMakeProject`，那么我们来看看这个程序具体实现的功能是什么呢?
```cpp
// main.cpp
#include <iostream>
int main()
{
	std::cout<<"hello CMake"<<std::endl;
	return 0;
}
```

功能很简单，就是一个`hello CMake`。

### 项目编译与执行

准备工作已经做完，接下来我们就要使用CMake生成可执行文件了。

第一步当然是要安装CMake啦，这是下载地址 [Download](https://cmake.org/download/) ，根据自己的平台选择下载即可，安装完成之后需要把它添加到环境变量中，便于我们在任何地方都能方便使用。
安装了CMake以后，打开命令行工具，进入到刚才创建的项目根目录，也就是进入到存着`CMakeLists.txt`和`main.cpp`的目录，下一步准备生成项目。

通常为了不影响和污染当前的工作环境，我们会选择新建一个目录来存放生成的工程文件，以下我主要以Windows平台为主要平台讲解，其他平台基本一致。

```shell
mkdir build                 #创建文件夹，存储工程文件；
cd build                    #切换cmake工作目录;
cmake ..                    #生成项目文件；
```

这三步执行完后，我们就可以在build文件夹下看到里面已经生成了一个Visual Studio的工程，我们可以直接用Visual Studio打开这个工程，按照我们的习惯执行编译和调试。当然，假如想最快地生成可执行文件，我还是推荐使用CMake。

使用CMake执行编译，只需要在上一步的基础上（也就是已经成功执行了上面的三个步骤）再执行一个命令`cmake --build .`就可以了。这里切记不能少第三个英文句号，它代表在当前的工作目录中执行CMake的编译。
假如上面的四步都一切顺利的话，那么，我们就可以在`build/debug`目录下看到以`add_executable`的第一个参数命名的可执行文件（这里就是`CMakeProject.exe`），双击或者把它拖到命令行就可以执行它了。

### 项目扩展
在前面的例子中，生成工程文件，我们使用了两个命令，其实，这里可以直接用一个命令就可以完成——`cmake build -S . -B build`。这个命令的意思是以当前路径为工作路径，以`build`目录为生成目录，生成工程文件，也就是不需要我们手动创建`build`文件夹了。其中 `-S`参数配置的是源路径，`-B`配置的是生成路径。

虽然上面的操作已经足够简单，但是考虑到长期的修改和验证需要，还是太繁琐枯燥了，尤其是要反复切换工作目录，还是比较烦人的。所以我推荐使用批处理来完成这些操作。结合清理生成目录和切换工作目录这几个步骤，最终的批处理文件可能是这样的
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
按顺序依次解释一下:

第一行是关闭了命令行的回显功能，因为我们不希望它的回显干扰到CMake的信息输出，以造成不必要的混乱，而且通常我们也只关心它最后有没有完成工作而不是看它在干什么。

然后后面的四句就是我们上面讲的内容了，不再赘述。

一直来到倒数第二句，这里我直接写了可执行文件的名字（需要替换为你自己的名字），为的就是直接在编译完成之后运行可执行文件，这对有些会生成文件的应用来说很有用。

执行结束后，再将目录切回到项目根目录，这就是最后一行的作用，由于我们再编译的时候已经切换了目录到生成目录了，而编译的可执行文件又是在生成目录的子目录中，所以回到根目录，我们需要回退两次，这是保证下次我们能胜利执行批处理的关键。

把上面的内容保存为bat结尾的文件，然后下次就可以直接在命令行输入bat文件名来一次性完成生成和构建了，简直爽歪歪。
以上就是CMake项目我们所需要知道的了。当然实际项目远比这个复杂得多，接下来我将以我踩过的坑为基础，逐一增加项目的复杂度，慢慢形成对CMake的工作流程的理解。

## 多源码项目

### 个人感悟

在开始之前，我先讲一讲我对CMake项目或者说`CMakeLists.txt`文件的理解。**我们不能单独的以某一个配置为理解对象，我们需要对这些命令进行分类甚至提炼出它的核心工作模式。我是以c++文件的编译链接为线索梳理的。** 我们都知道一个c++源文件要想生成可执行代码，需要分三步
* 预处理器处理，拷贝头文件的内容到源文件，宏替换等；
* 编译器将源文件编译为.o的对象文件；
* 链接器以.o文件和其他库为输入，链接生成可执行文件。

我们按照这个思路来理解CMake就简单多了。假如CMake报错，我们就可以根据报错信息定位到是哪个阶段出了问题，进而快速找到解决办法。另外我们也可以依据这些信息对CMake的配置分类，我自己理解的粗略分类如下:
* 配置CMake基本信息的：`cmake_minimum_required`；
* 源码管理的：`file`,`aux_source_directory`；
* 库管理的：`find_libraray`；
* 头文件管理的：`include_directories`；
* 链接库管理的：`link_directories`；
* 子项目管理的：`add_subdirectory`；
* 生成物管理的：`add_executable`,`add_library`；

当然，这些只是很少的一部分，但是对我们理解和搜索问题的解决思路提供了较好的方向。
### CMake管理子目录

很多时候，我们会引入第三方包来减少重复编码的工作，通常这种代码我们需要放在其他目录中，于是我新建了一个子目录，用于模拟存放的第三方代码。对于这种情况，我们有两种包含形式——子模块和子目录。

先说简单一些的子目录吧。子目录的意思就是将第三方代码看作我们代码的一部分，一起合并编译，这种方式可以使我们的项目看起来更紧凑。如以下的项目结构
```shell
CMakeProject

|   auto.bat
|   CMakeLists.txt              //修改
|   main.cpp                    //修改
|   

\---3rd                         //新增
        lib.h       
```

我新建了一个子文件夹，用来模拟第三方代码，现在我们把它引入到`main.cpp`中，编译，就会发现报错了，信息为`fatal error C1083: 无法打开包括文件: “lib.h”: No such file or directory，`。这很正常，结合上面我举的例子，这个报错信息是和头文件相关的，查看CMake文档，我发现了CMake有个`include_directories`的指令，它的意思就是添加文件头的目录，以便让CMake找到头文件。于是，我在`CMakeLists.txt`文件中添加了`include_directories(3rd)`，然后再次执行编译，项目又正确跑起来了。来看看这时的`CMakeLists.txt`
```cmake
# CMakeLists.txt

# 设置版本号
cmake_minimum_required(VERSION 3.10)
# 设置项目名
project(CMakeProject)
# 设置产物由哪些源码构成
add_executable(${CMAKE_PROJECT_NAME} main.cpp)
# 添加头文件目录
include_directories(3rd)
```
添加头文件目录后，我们再执行一次编译，项目又正确跑起来了。

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
注意：这里的`include_directories`和cpp中的`include`是一一对应的，就是说，假如`include_directories`里面配置的目录是`.`，则对应cpp的`include`要写成`3rd/lib.h`这种形式，简单来说，就是`include_directories`被设置为了`include`的根目录。

另一种情况就是子模块。
### CMake管理子模块
子模块的意思是，模块可以单独编译，单独提供给其他库使用，而不是和主项目共生的，适用于和主模块耦合不大的情况。为了满足这个条件，我们修改刚才的目录结构为下面这种
```shell
CMakeProject

|   auto.bat
|   CMakeLists.txt                   //修改
|   main.cpp                    

|   
\---3rd
        CMakeLists.txt               //新增
        lib.cpp                      //新增
        lib.h                        //修改
```
我把`lib.h`中的函数改为声明，实现放在了`lib.cpp`文件中。最大的变化是新建了`3rd`目录下的`CMakeLists.txt`文件，用它统一管理`3rd`目录下的所有源文件（假如文件很多的话，这里是模拟）,使用了`add_library`把`3rd`目录下打包成了子模块。
```cmake
project(sum)
add_library(${PROJECT_NAME} lib.cpp)
```
`add_library`在名字和源代码中间还可以指定构建类型，默认是`STATIC`，也就是静态库，假如想构建动态库需要手动指定为`SHARED`（`add_library(${PROJECT_NAME} SHARED lib.cpp)`）。

重要的改变来自主目录下的`CMakeLists.txt`
```cmake
# 设置版本号
cmake_minimum_required(VERSION 3.10)
# 设置项目名
project(CMakeProject)
# 指定3rd为include的查找目录
include_directories(3rd)
# 子模块
add_subdirectory(3rd)
# 设置产物和源码的关联
add_executable(${PROJECT_NAME} main.cpp)
target_link_libraries(${PROJECT_NAME} sum)
```
新增了`add_subdirectory`，它的作用是将指定目录下的源码作为一个模块编译，前提是这个目录下要有`CMakeLists.txt`文件。另一个改变就是`target_link_libraries`的添加，它的作用是将子模块链接进主模块，假如没有这一句，在链接的时候会报错`error LNK2019: 无法解析的外部符号`。模块的名字需要和子模块中`add_library`中第一个参数保持一致。

## 交叉编译
在前面的示例中，项目的复杂度表现在多目录，多源码，而在使用CMake进行交叉编译的过程中，项目的主要复杂度表现在环境配置。尽管CMake可以几乎不修改`CMakeLists.txt`的情况下，实现交叉编译，但是对于新手，面对陌生的配置，往往会无从下手，企图找到一键就完成配置的简便方法。对于CMake,确实没有这种快捷方法，但是，只要我们理解了**交叉编译就是正确配置属性值的过程。** 这一实质之后，问题就会变得明朗起来。所以，上面的问题就会转化为我们熟悉的问题了——需要配置哪些属性，这些属性有哪些合适的值，这些值怎样传递给CMake等等，这就是交叉编译的全部了。正如之前提到的一样，CMake有很多预设的变量，我们需要从这些预设变量中找到一些，设置一些值，然后让CMake按照这些配置完成工作，这就是我们接下来需要做的事。下面我将以Windows交叉编译Android为例说明这个过程。
### 前期准备
在Windows平台上，默认会使用MS系列工具作为默认配置，比如编译器，链接器等。这对于编译Android的库来说会报错,即使没报错，编译产生的产物也无法在Androidd系统中运行，因为它们的二进制接口不一致。为了让CMake实现交叉编译，我们需要改变这个默认行为，方式就是传递参数，比如使用` -GNinja`来让Cmake生成Ninja的配置。但光这个配置还不够，比如我们常见的编译器，链接器都没指定，肯定是无法生成产物的。而Android上的C,C++编译器通常以NDK的方式提供，所以，我们需要下载NDK。在NDK中，会同时为我们提供多种使用工具，一种就是编译产物需要用到的编译器链接器，另一个就是`android.toolchain.cmake`,里面为我们交叉编译指定了很多预设值，能大大减轻我们的工作。
### 编写编译脚本
前面说过，交叉编译就是改变CMake预设值，而改变这预设值的方式有两种，我们要结合起来使用。一种是通过NDK提供的`android.toolchain.cmake`文件。 `android.toolchain.cmake`中已设置了绝大部分的值，但是这些配置也是很灵活的，还有很大的配置空间。因此，根据用户的需求不同，我们还需要在执行CMake命令时动态传递一些值，以使CMake能正确完成工作。这就是另一种方式——选项。传递选项会以`-D`开头，后面跟着某个CMake的预定义变量由于选项很多，而且大多比较复杂，所以，最好还是通过脚本文件来记录并且修改。以下就是Windows平台上编译Android代码需要指定的几个选项，我将逐个介绍这些必要的配置。
* `-DCMAKE_SYSTEM_NAME=Android`这个配置是告诉CMake需要生成Android平台的库，也就是执行交叉编译。
* `-DANDROID_ABI=x86`这个配置是告诉CMake生成库适用的架构平台。熟悉Android开发的读者应该不会陌生，支持的值会根据NDK的变化而有所变化，如早期的`armeabi`已经在 NDK r17中移除了，现在主流的还有四种`armeabi-v7a`，`arm64-v8a`，`x86`，`x86_64`.根据需要把值替换就行。
* `-DANDROID_PLATFORM=android-28`,这个值其实不是特别必要，因为有预设值，但是为了可控，还是需要指定一个。它是用来确定库支持的最低系统版本的。
* `-DCMAKE_TOOLCHAIN_FILE=C:/Users/Leroene/AppData/Local/Android/Sdk/ndk/21.0.6113669/build/cmake/android.toolchain.cmake`，这是上面提到的预设文件。需要注意的是，NDK中有多个以这个名字命名的文件，假如指定错误，可能会导致CMake出错，所以我的经验就是，更改版本号（`C:/Users/Leroene/AppData/Local/Android/Sdk/ndk/21.0.6113669`）及前面的路径，后面的保持不变。
* `-DCMAKE_BUILD_TYPE=Release`，指定构建类型，这应该很常见了。

至此Windows交叉编译Android库的所有配置都讲解完了。让我们来看看它完整的例子
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
从上面可以看到，这些选项后面都跟着一个`^`符号，这不是cmake的一部分，只是为了我们阅读方便，特意书写成这样的，这是在Windows平台上批处理使用的命令换行符，它的作用就是告诉命令解析器，这个命令还没有结束，接着往下面解析，该功能在Linux,MacOS上对应于`\`。现在有了这些配置之后，该怎么使用呢？其实也很简单，只需要将这些命令存储在`android.bat`文件中，在CMD中切换到当前目录，执行这个文件就能在`build`目录中找到以`libsum.a`命名的静态库文件了。下一步，我们试着用这个库文件运行在模拟器中。
## 在Android项目中使用CMake
在Android平台中，也使用CMake来管理jni的项目，配合Gradle一起完成构建工作。这和普通的CMake项目最大的不同是，我们通常需要引用多个Android相关的库，如`log`,`android`等.这些库通常是由NDK提供的，我们仿照默认生成的`CMakeLists.txt`文件编写就可。
### 目录结构
接下来，为了描述方便，我们先来看一下现在的目录结构（为了避免混乱，这里只列出比较有代表性的文件）
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
    │      │  │                  
    │      │  ├─jniLibs
    │      │  │  └─x86
    │      │  │          libsum.a
```
在原来的目录根目录下新建了`Android`子目录，该目录是一个Android C++工程，所以相比其他普通Android工程，它多了个`cpp`目录，后面我们主要的修改都是发生在该目录下。

原来的根目录，为了不增加复杂度，我们只作为生成静态库的功能存在，所以和上面的示例相比，没有任何修改。
### 构建静态库
首先，我们回到根目录。使用根目录下的`android.bat`批处理生成Android上可用的静态库，也可以修改`android.bat`文件中的`-DANDROID_ABI`选项的值，生成其他架构的静态库，但这需要和`jniLibs`目录下的目录要一一对应，否则可能链接失败。如我生成的`libsum.a`文件是`x86`的架构。那么就需要在`jniLibs`目录下新建`x86`的目录下，然后再把`libsum.a`放到该目录下。至此，静态库的构建工作就算结束了。
### 使用静态库
把静态库放到合适的位置后，我们需要配置`app`目录下的`build.gradle`和`cpp`目录下的`CMakeLists.txt`文件，完成静态库的引入。
#### 配置Gradle
首先说`build.gradle`，该文件主要涉及到修改ABI的问题，因为不指定的话，Gradle默认生成的ABI可能找不到对应的静态库文件来链接，从而导致链接失败。该文件主要的修改如下
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
也就是把`abiFilters`的值指定为刚才构建的静态库相同的值。
#### 配置CMake
而`CMakeLists.txt`文件就复杂一些了，它需要完成两个工作，找到静态库和静态库的头文件，链接静态库。
##### 找到头文件
在文章的第二部分我们已经知道了让CMake找到头文件的`include_directories`命令，把参数设置为`3rd`目录就行了。值得注意的是，CMake是以当前的`CMakeLists.txt`文件为工作目录的，所以，要指定到`3rd`文件，我们需要一直回退目录到根项目，最终就有了`include_directories(../../../../../3rd)`这样的配置。尽量使用相对路径，可以在多人协同的情况下，不用修改配置。
##### 找到静态库
下一步要让CMake找到我们的静态库。说到库，都是和`add_library`相关的，不同的只是参数。使用源码添加库的时候，我们需要指定库的名称和源码位置，而引用第三方库，则是需要指定库的名称和类型，外加一个`IMPORTED`的指示参数，告诉CMake这个库是导入的。所以就有了`add_library(addSum STATIC IMPORTED)`这样的配置。

但是，这里我们只告诉了CMake库的名字，库存储在哪里，还不知道，所以我们还需要另一个命令告诉CMake库的存储位置。涉及到配置参数的，通常就是`set_target_properties`命令了，可以多次调用这个命令设置多种配置。`set_target_properties(addSum PROPERTIES IMPORTED_LOCATION ${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libsum.a)`,第一个参数和上一条的第一个参数是一一对应的，可以随便取。其实`add_library`相当于生成了一种目标产物，用第一个参数来指代这种产物，所以才让我们的`set_target_properties`找得到合适的目标设置属性。第二个参数则是配置属性的标准写法，第三个代表属性变量，第四个是属性值，配置库路径的变量就是`IMPORTED_LOCATION`，而值这里就有个坑了，Android下的CMake限定值必须是绝对路径，不能是相对路径。而这与使用CMake的初衷背道而驰，幸好，我们有几个预设值可以用，`CMAKE_CURRENT_SOURCE_DIR`就是其中之一，它代表着当前这个`CMakelists.txt`文件的绝对路径，有了这个，再加上目录的回退功能，我们就能找到任何合适的目录了。至此，又出现了第二个问题，当有多个架构的静态库需要配置时，我们引入的目录是不一样的，而且会出现很多重复的配置。还好有`ANDROID_ABI`的帮助，它指代了当前编译的某个架构，随着编译的进行，这个值会被设置为合适的值，并且是和正在编译的架构是一一对应的。所以，尽管它们有点奇怪，但是这给我带来了灵活和简单。
##### 链接静态库
现在头文件有了，库也有了，但是C++的编译是分成两步的，目前为止，我们的工作只做完了编译的事情，还没涉及到链接的事情，当然，相比前面的配置，这就简单多了，无疑就是在`target_link_libraries`命令里添加一个参数就可，如
```cmake
target_link_libraries( 
                       native-lib
                       ${log-lib}
                       addSum
        )
```
只需哟注意名字和`add_library`时配置的名字一一对应就可。
#### 在源码中使用
经过漫长的等待，现在我们终于能在`native-lib.cpp`文件中引入`addsum`的头文件，并且使用里面的函数完成工作了。我打算让函数返回一个包含加法运算结果的字符串。最终实现如下
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
至此，点击工具栏上的`run`按钮，我们终于可以在Android的模拟器上看到我们的静态库工作的成果啦。
### 扩展
其实除了引用静态库的方式之外，我们还可以直接通过配置`CMakeLists.txt`文件来引用源码，这样可以随时随地对源码进行定制，但是也降低了编译速度，而且可能会增加`CMakeLists.txt`的复杂度。所以我还是推荐直接使用静态库的方式。
## 总结
CMake其实还有很多很多命令，我们这里涉及到的只是很少的一部分。但是，我觉得理解CMake有这些内容差不多就可以了，后续有需要再针对性学习就行了。学习一门技术，切忌不能贪多，贪细。先要抓住主干，理清脉络，后面的细节就是水到渠成的事。***对于CMake，我觉得就是以C++代码编译为二进制的过程为主干就够了。源码从哪里来，头文件在那里，库文件在哪里，怎么组织编译，参与链接的库有哪些，生成什么产物，还有一些完成这些工作的通用操作，复制文件啊，目录信息啊等，这些操作的集合就构成了CMake的主体。*** 另外，CMake其实只是一种构建工具，它本身不是编译器和链接器，有些问题可能不仅仅会涉及到cmake，还可能会涉及到编译器和连接器。当然，这些都是后面深入了解之后才可能碰到的问题了。
