---
title: "Android JNI开发指南"
description: "本文介绍了JNI开发中的一些概念，以及怎么将这些概念应用到实际开发中"
date: "2021-09-12"
updated: "2026-03-18"
tags: ["Android","JNI","C++"]
draft: false
---

## 什么是JNI开发
JNI的全称是Java Native Interface，顾名思义，这是一种解决Java和C/C++相互调用的编程方式。***它其实只解决两个方面的问题，怎么找到和怎么访问。*** 弄清楚这两个话题，我们就学会了JNI开发。***需要注意的是，JNI开发只涉及到一小部分C/C++开发知识，遇到问题的时候我们首先要判断是C/C++的问题还是JNI的问题，这可以节省很多搜索和定位的时间。***

## 用JVM的眼光看函数调用
我们知道Java程序是不能单独运行的，它需要运行在JVM上的，而JVM却又需要跑在物理机上，所以它的任务很重，既要处理Java代码，又要处理各种操作系统，硬件等问题。可以说了解了JVM，就了解了Java的全部，当然包括JNI。所以我们先以JVM的身份来看看Java代码是怎样跑起来的吧（只是粗略的内容，省去了很多步骤，为了突出我们在意的部分）。

运行Java代码前，会先启动一个JVM。在JVM启动后，会加载一些必要的类，这些类中包含一个叫主类的类，也就是含有一个静态成员函数，函数签名为`public static void main(String[] args)`的方法。资源加载完成后，JVM就会调用主类的`main`方法，开始执行Java代码。随着代码的执行，一个类依赖另一个类，层层依赖，共同完成了程序功能。这就是JVM的大概工作流程，可以说JVM就好比一座大桥，连接着Java大山和native大山。

现在问题来了，在Java程序中，某个类需要通过JNI技术访问JVM以外的东西，那么它需要怎样告诉我（我现在是JVM）呢？需要一种方法　把普通的Java方法标记成特殊，这个标记就是`native`关键字（使用Kotlin时虽然也可以使用这个关键字，但是Kotlin有自己的关键字`external`）。当我执行到这个方法时，看到它不一样的标记，我就会从其他地方而不是Class里面寻找执行体，这就是一次JNI调用。也就是说对于Java程序来说，只需要将一个方法标记为`native`，在需要的地方调用这个方法，就可以完成JNI调用了。但是对于我，该怎样处理这一次JNI调用呢？***其实上面的寻找执行体的过程是一个跳转问题，在C/C++的世界，跳转问题就是指针问题。那么这个指针它应该指向哪里呢？***

C/C++代码是一个个函数（下文会将Java方法直接用方法简称，而C/C++函数直接用函数简称）组合起来的，每一个函数都是一个指针，这个特性恰好满足我的需要。但是对于我，外面世界那么大，我并```不知道从哪里，找什么东西```，给我的信息还是不够。为了限定范围，我规定，只有通过`System.loadLibrary(“xxx”)`加载的函数，我才会查找，其余的我直接罢工（抛错）。这一下子减轻了我的工作量，至少我知道从哪里找了。

确定了范围，下一步就是在这个范围里确定真正的目标了。Java世界里怎样唯一标识一个类呢，有的人会脱口而出——类名，其实不全对，因为类名可能会重名，我们需要全限定的类名，也就是包名加类名，如`String`的全限定类名就是`java.lang.String`。但是这和我们查找native的方法有什么联系呢。当然有联系，既然一个全限定的类名是唯一的，那么它的方法也是唯一的，那么假如我规定以这个类的全限定类名加上方法名作为native函数的函数名，这样我是不是就可以通过函数名的方式找到native的函数看呢，答案是肯定的，但是有瑕疵，因为Java系统支持方法重载，也就是一个类里面，同名的方法可能有多个。那么构成重载的条件是什么呢，是参数列表不同。所以，结果就很显然了，我在前面的基础上再加上参数列表，组合成查找条件，我是不是就可以唯一确定某一个native函数了呢，这就是JNI的静态注册。

不过，既然我只需要确定指针的指向，那么我能不能直接给指针赋值，而不是每次都去查找呢，虽然我不知道累，但是还是很耗费时间的。对于这种需求，我当然也是满足的啦，你直接告诉我，我就不找了，我还乐意呢。而且，既然你都给我找到了，我就不需要下那么多规定了，都放开，你说是我就相信你它是。这就是JNI的动态注册。

## JNI的函数注册
上一节我们通过化身JVM的方式了解了JNI函数注册的渊源，并且引出了两种函数注册方式。从例子上，我们也可以总结出两种注册方式的特点

| 注册类型 | 优点 | 缺点 |
| --- | --- | --- |
| 静态注册 |  JVM自动查找  实现简单 | 函数名贼长，限制较多 查找耗时 |
| 动态注册 | 运行快 对函数名无限制 | 实现复杂 |

那么具体怎么做呢？我们接着往下说。
### 静态注册
虽然静态注册限制比较多，但是都是一些浅显的规则，更容易实施，所以先从静态注册开始讲解。

静态注册有着明确的开发步骤
1. 编写Java类，声明`native`方法;
2. 使用`java xxx.java`将Java源文件编译为class文件
3. 使用`javah xxx`生成对应的`.h`文件
4. 构建工具中引入`.h`文件
5. 实现`.h`文件中的函数
   
上面的这个步骤是静态开发的基本步骤，但是其实在如今强大的IDE面前，这些都不需要我们手动完成了，在Android Studio中，定义好`native`方法后，在方法上按`alt + enter`就可以生成正确的函数签名，直接写函数逻辑就可以了。但是学习一门学问，我们还是要抱着求真，求实的态度，所以我用一个例子来阐述一下这些规则，以加深读者的理解。

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
上面就是一个JNI函数在两端声明的例子，不难发现
1. 函数签名以`Java_`为前缀
2. 前缀后面跟着类的全路径，也就是包含包名和类名
3. 以`_`作为路径分隔符
4. 函数的第一个参数永远是`JNIEnv *`类型，第二个参数根据函数类型的不同而不同，`static`类型的方法，对应的是`jclass`类型，否则对应的是`jobject`类型。类型系统后面会详细展开。
   
为什么Java方法对应到C/C++函数后，会多两个参数呢。我们知道JVM是多线程的，而我们的JNI方法可以在任何线程调用，那么怎样保证调用前后JVM能找到对应的线程呢，这就是函数第一个参数的作用，它是对线程环境的一种封装，和线程一一对应，也就是说不能用一个线程的`JNIEnv`对象在另一个线程里使用。另外，它是一个C/C++访问Java世界的窗口，JNI开发的绝大部分时间都是和`JNIEnv`打交道。
### 动态注册
同样按照开发过程，我们一步一步来完成。
我们把前面的`Java_me_hongui_demo_Test_jniString`函数名改成`jniString`（当然不改也可以，毕竟没限制），参数列表保持不变，这时，我们就会发现Java文件报错了，说本地方法未实现。其实我们是实现了的，只是JVM找不到。为了让JVM能找到，我们需要向JVM注册。
那么怎么注册，在哪注册呢，似乎哪里都可以，又似乎都不可以。
前面说过，JVM只会查找通过`System.loadLibrary(“xxx”); `加载的库，所以要想使用native方法，首先要先加载包含该方法的库文件，之后，才可使用。加载了库，说明Java程序要开始使用本地方法了。在加载库之后，调用方法之前，理论上都是可以注册方法的，但是时机怎么确定呢，JNI早就给我们安排好了。JVM在把库加载进虚拟机后，会调用函数`jint JNI_OnLoad(JavaVM *vm, void *reserved)`，以确认JNI的版本，版本信息会以返回值的形式传递给JVM，目前可选的值有`JNI_VERSION_1_1`,`JNI_VERSION_1_2`,`JNI_VERSION_1_4`,`JNI_VERSION_1_6`。假如库没有定义这个函数，那么默认返回的是`JNI_VERSION_1_1`，库将会加载失败，所以，为了支持最新的特性我们通常返回较高的版本。既然有了这么好的注册时机，那么下一步就是实现注册了。

但事情并没有这么简单。由`JNI_OnLoad`函数参数列表可知，目前，可供使用的只有JVM，但是查阅JVM的API，我们并没有发现注册的函数——注册函数是写在`JNIEnv`类里面的。恰巧的是，JVM提供了获取`JNIEnv`对象的函数。

JVM有多个和`JNIEnv`相关的函数，在Android开发中，我们需要使用`AttachCurrentThread`来获取`JNIEnv`对象，这个函数会返回执行状态，当返回值等于`JNI_OK`的时候，说明获取成功。有了`JNIEnv`对象，我们就可以注册函数了。

先来看看注册函数的声明——`jint RegisterNatives(jclass clazz, const JNINativeMethod* methods,jint nMethods`。返回值不用多说，和`AttachCurrentThread`一样，指示执行状态。难点在参数上，第一个参数是`jclass`类型，第二个是`JNINativeMethod`指针，都是没见过的主。

为什么需要这么多参数呢，JVM不只需要一个函数指针吗。还是唯一性的问题，记得前面的静态注册吗，静态注册用全限定类型和方法，参数列表，返回值的组合确定了函数的唯一性。但是对于动态注册，这些都是未知的，但是又是必须的。为了确定这些值，只能通过其他的方式。`jclass`就是限定方法的存在范围，获取`jclass`对象的方式也很简单，使用`JNIEnv`的`jclass FindClass(const char* name)`函数。参数需要串全限定符的类名，并且把`.`换成`/`，也就是类似`me/hongui/demo/Test`的形式，为啥这样写，后面会单独拿一节出来细说。

第二个和第三个参数组合起来就是常见的数组参数形式。先来看看`JNINativeMethod`的定义。
```cpp
typedef struct { 
    char *name; 
    char *signature; 
    void *fnPtr; 

} JNINativeMethod; 
```
有个编写诀窍，按定义顺序，相关性是从Java端转到C/C++端，怎么理解呢？`name`是只的Java端对应的`native`函数的名字，这是纯Java那边的事，Java那边取啥名，这里就是啥名。第二个`signature`代表函数签名，签名信息由参数列表和返回值组成，形如`(I)Ljava/lang/String;`,这个签名就是和两边都有关系了。首先Java那边的`native`方法定义了参数列表和返回值的类型，也就是限定了签名的形式。其次Java的数据类型对应C/C++的转换需要在这里完成，也就是参数列表和返回值要写成C/C++端的形式，这就是和C/C++相关了。最后一个`fnPtr`由名字也可得知它是一个函数指针，这个函数指针就是纯C/C++的内容了，代表着Java端的`native`方法在C/C++对应的实现，也就是前文所说的跳转指针的。知道了这些，其实我们还是写不出代码，因为，我们还有JNI的核心没有说到，那就是类型系统。
## JNI的类型系统
由于涉及到Java和C/C++两个语言体系，JNI的类型系统很乱，但并非无迹可寻。首先需要明确的是，两端都有自己的类型系统，Java里的`boolean`，`int`，`String`,C/C++的`bool`,`int`,`string`等等，遗憾的是，它们并不一一对应。也就是说C/C++不能识别Java的类型。既然类型不兼容，谈何调用呢。这也就是JNI欲处理的问题。
### JNI类型映射
为了解决类型不兼容的问题，JNI引入了自己的类型系统，类型系统里定义了和C/C++兼容的类型，并且还对Java到C/C++的类型转换关系做了规定。怎么转换的呢，这里有个表

| Java类型 | C/C++类型|描述 |
| --- | --- | --- |
| boolean | jboolean |unsigned 8 bits
| byte | jbyte |signed 8 bits
| char | jchar |unsigned 16 bits
| short |jshort |signed 16 bits
| int |jint |signed 32 bits
| long |jlong |signed 64 bits
| float |jfloat |32 bits
|  double |jdouble |64 bits
|void |void |N/A

乍一看，没什么特别的，不过就是加了`j`前缀（除了`void`)，但是，这只是基本类型，我们应该没忘记Java是纯面向对象的语言吧。各种复杂对象才是Java的主战场啊。而对于复杂对象，情况就复杂起来了。我们知道在Java中，任何对象都是`Object`类的子类。那么我们是否可以把除上面的基本类型以外的所有复杂类型都当作`Object`类的对象来处理呢，可是可以，但是不方便,像数组，字符串，异常等常用类，假如不做转换使用起来比较繁琐。为了方便我们开发，JNI又将复杂类型分为下面这几种情况
```
jobject                     (所有的Java对象)
    |
    |--jclass               (java.lang.Class)
    |--jstring              (java.lang.String)
    |--jarray               (数组)
    |     |
    |     |-- jobjectArray  (Object数组)
    |     |-- jbooleanArray (boolean数组)
    |     |-- jbyteArray    (byte数组)
    |     |-- jcharArray    (char数组)
    |     |-- jshortArray   (short数组)
    |     |-- jintArray     (int数组)
    |     |-- jlongArray    (long数组)
    |     |-- jfloatArray   (float数组)
    |     |-- jdoubleArray  (double数组)
    |--jthrowable           (java.lang.Throwable异常)
```
两个表合起来就是Java端到C/C++的类型转换关系了。也就是说，当我们在Java里声明`native`代码时，`native`函数参数和返回值的对应关系，也是C/C++调用Java代码参数传递的对应关系。但是毕竟两套系统还是割裂的，类型系统只定义了兼容方式，并没有定义转换方式，双方的参数还是不能相互识别，所以，JNI又搞了个类型签名，欲处理类型的自动转换问题。

### JNI的类型签名
类型签名和类类型映射类似，也有对应关系，我们先来看个对应关系表
|  类型签名  |  Java类型  |
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

对于基本类型，也很简单，就是取了首字母，除了`boolean`(首字母被`byte`占用了)，`long`（字母被用作了符合对象的前缀标识符）。
着重需要注意的是复合类型，也就是某个类的情况。***它的签名包含三部分，前缀`L`，中间是类型的全限定名称，跟上后缀`;`,三者缺一不可,并且限定符的分隔符要用/替换, 。 注意，类型签名和类型系统不是一个概念。类型通常是纯字符串的，用在函数注册等地方，被JVM使用的。类型系统是和普通类型一样的，可以定义变量，作为参数列表，被用户使用的。 另外，数组对象也有自己的类型签名，也是有着类型前缀`[`，后面跟着类型的签名。最后的方法类型，也就是接下来我们着重要讲的地方，它也是由三部分组成`()`和包含在`()`里面的参数列表，`()`后面的返回值。这里用到的所有类型，都是指类型签名。***

我们来看个例子
```cpp
long f (int n, String s, boolean[] arr); 
```
它的类型签名怎么写呢？我们来一步一步分析
1. 确定它在Java里面的类型，在表中找出对应关系，确定签名形式。
2. 用步骤1的方法确定它的组成部分的类型。
3. 将确定好的签名组合在一起

此例是方法类型，对应表中最后一项，所以签名形式为`(参数)返回值`。该方法有三个参数，我们按照步骤1的方式逐一确定。
1. `int n`对应`int`类型，签名是`I`;
2. `String s`对应`String`类型，是复合类型，对应表中倒数第三项，所以它的基本签名形式是`L全限定名;`。而`String`的全限定名`java.lang.String`，用`/`替换`,`后变成`java/lang/String`。按步骤3，将它们组合在一起就是`Ljava/lang/String;`;
3. `boolean[] arr`对应数组类型，签名形式是`[类型`，`boolean`的签名是`Z`。组合在一起就是`[Z`;
4. 最后来看返回值，返回值是`long`类型，签名形式是`J`。

按照签名形式将这些信息组合起来就是`(ILjava/lang/String;[Z)J`，***注意类型签名和签名之间没有任何分割符，也不需要，类型签名是紧密排列的***。
## 再看动态注册
有了JNI的类型系统的支持，回过头来接着看动态注册的例子，让我们接着完善它。
1. 用JVM对象获取`JNIEnv`对象，即`auto status=vm->AttachCurrentThread(&jniEnv, nullptr);`
2. 用步骤1获取的`JNIEnv`对象获取`jclass`对象，即`auto cls=jniEnv->FindClass("me/hongui/demo/Test");`
3. 定义`JNINativeMethod`数组，即`JNINativeMethod methods[]={{"jniString", "()Ljava/lang/String;",reinterpret_cast<void *>(jniString)}};`，这里的方法签名可以参看上一节。
4. 调用`JNIEnv`的`RegisterNatives`函数。即`status=jniEnv->RegisterNatives(cls,methods,sizeof(methods)/sizeof(methods[0]));`。
5. 当然，别忘了实现对应的`native`函数，即这里的`jniString`——`JNINativeMethod`的第三个参数。

这五步就是动态注册中`JNI_OnLoad`函数的实现模板了，主要的变动还是来自`jclass`的获取参数和`JNINativeMethod`的签名等，必须做到严格的一一对应。如下面的例子
```cpp
extern "C" jint JNI_OnLoad(JavaVM *vm, void *reserved){
    JNIEnv* jniEnv= nullptr;
    auto status=vm->AttachCurrentThread(&jniEnv, nullptr);
    if(JNI_OK==status){
        JNINativeMethod methods[]={{"jniString", "()Ljava/lang/String;",reinterpret_cast<void *>(jniString)}};
        auto cls=jniEnv->FindClass("me/hongui/demo/Test");
        status=jniEnv->RegisterNatives(cls,methods,sizeof(methods)/sizeof(methods[0]));
        if(JNI_OK==status) {
            return JNI_VERSION_1_6;
        }
    }
    return JNI_VERSION_1_1;
}
```

## 在JNI中使用数据
前面磨磨唧唧说了这么一大片，其实才讲了一个问题——怎么找到。虽然繁杂，但好在有迹可循，大不了运行奔溃。下面要讲的这个问题就棘手多了，需要一点点耐性和细心。这一部分也可以划分成两个小问题——***访问已知对象的数据，创建新对象。有一点还是要提一下，这里的访问还创建都是针对Java程序而言的，也就是说，对象是存在JVM虚拟机的堆上的，我们的操作都是基于堆对象的操作。***而在C/C++的代码里，操作堆对象的唯一途径就是通过`JNIenv`提供的方法。所以，这部分其实就是对`JNIenv`方法的应用讲解。

### Java对象的访问
在面向对象的世界中，我们说访问对象，通常指两个方面的内容，访问对象的属性、调用对象的方法。这些操作在Java世界中，很好实现，但是在C/C++世界却并非如此。在JNI的类型系统那一节，我们也了解到，Java中的复杂对象在C/C++中都对应着`jobject`这个类，显然，无论Java世界中，那个对象如何牛逼，在C/C++中都是一视同仁的。为了实现C/C++访问Java的复杂对象，结合访问对象的方式，`JNIEnv`提供了两大类方法，一类是对应属性的，一类是对应方法的。借助`JNIEnv`，C/C++就能实现访问对象的目标了。而且它们还有一个较为统一的使用步骤：
1. 根据要访问的内容准备好对应id（fieldid或者methodid）。
2. 确定访问的对象和调用数据
3. 通过`JNIEnv`的方法调用完成对象访问
   
可以看出来，这使用步骤和普通面向对象的方式多了一些准备阶段（步骤1，2）。之前提到过，这部分的内容需要的更多的是耐心和细心，不需要多少酷炫的操作，毕竟发挥空间也有限。这具体也体现在上面的步骤1，2。正是这个准备阶段让整个C/C++的代码变得丑陋和脆弱，但是——又不是不能用，是吧。

看一个例子，Java里定义了一个`Person`类，类定义如下
```java
public class Person(){
    private int age;
    private String name;

    public void setName(String name){
        return this.name=name;
    }
}
```
现在，我们在C/C++代码里该怎么访问这个类的对象呢。假定需要读取这个对象的`age`值，设置这个对象的`name`值。根据上面的步骤，我们有以下步骤
1. 准备好`age`的`fieldid`,`setName`的`methodid`。根据`JNIEnv`的方法，我们可以看到四个相关的，`fieldid`,`methodid`各两个，分普通的和静态的。我们这里都是普通的，所以确定的方法是`GetFieldID`和`GetMethodID`。第一个参数就是`jclass`对象，获取方法前面已经说过,即通过`JNIEnv`的`FindClass`方法，参数是全限定类名，以`/`替换`.`。后面两个参数对应Java端的名称和类型签名，`age`属于field，`int`的类型签名是`I`，`setName`属于method，签名形式是`(参数)返回值`，这里参数的签名是`Ljava/lang/String;`，返回值的签名是`V`，组合起来就是`"(Ljava/lang/String;)V"`。
2. 假定我们已经有了`Person`对象`obj`,通过Java传过来的。
3. 分别需要调用两个方法，`age`是整形属性，要获取它的值，对应就需要使用`GetIntField`方法。`setName`是返回值为`void`的方法。所以应该使用`CallVoidMethod`。
   
通过上面的分析，得出下面的示例代码。

```cpp
auto cls=jniEnv->FindClass("me/hongui/demo/Person");
auto ageId=jniEnv->GetFieldID(cls,"age","I");
auto nameId=jniEnv->GetMethodID(cls,"setName","(Ljava/lang/String;)V");
jint age=jniEnv->GetIntField(obj,ageId);
auto name=jniEnv->NewStringUTF("张三");
jniEnv->CallVoidMethod(obj,nameId,name);
```
从上面的分析和示例来看，耐心和细心主要体现在
1. 对要访问的属性或者方法要耐心确定类型和名称，并且要保持三个步骤中的类型要一一对应。即调用`GetFieldID`的类型要以`GetXXXField`的类型保持一致，方法也是一样。
2. 对属性或方法的静态非静态修饰也要留心，通常静态的都需要使用带有`static`关键字的方法，普通的则不需要。如`GetStaticIntField`就是对应获取静态整型属性的值，而`GetIntField`则是获取普通对象的整型属性值。
3. 属性相关的设置方法都是类似于`SetXField`的形式，里面的`X`代表着具体类型，和前面的类型系统中的类型一一对应，假如是复杂对象，则用`Object`表示，如`SetObjectField`。而访问属性只需要将前缀`Set`换成`Get`即可。对于静态属性，则是在`Set`和`X`之间加上固定的`Static`，即`SetStaticIntField`这种形式。
4. 方法调用则是以`Call`为前缀，后面跟着返回值的类型，形如`CallXMethod`的形式。这里`X`代表返回值。如`CallVoidMethod`就表示调用对象的某个返回值为`void`类型的方法。同样对应的静态方法则是在`Call`和`X`之间加上固定的`Static`,如`CallStaticVoidMethod`。
### 向Java世界传递数据
向Java世界传递数据更需要耐心。因为我们需要不断地构造对象，组合对象，设置属性。而每一种都是上面Java对象的访问的一种形式。

#### 构造Java对象
C/C++构造Java对象和调用方法类似。但是，还是有很多值得关注的细节。根据前面的方法，我们构造对象，首先要知道构造方法的id，而得到id，我们需要得到`jclass`，构造方法的名字和签名。我们知道在Java世界里，构造方法是和类同名的，但是在C/C++里并不是这样，它有着特殊的名字——`<init>`，注意，这里的`<>`不能少。***也就是说无论这个类叫什么，它的构造函数的名字都是`<init>`。***而函数签名的关键点在于返回值，构造方法的返回值都是`void`也就是对应签名类型`V`。

接前面那个`Person`类的例子，要怎样构造一个`Person`对象呢。
1. 通过`JNIEnv`的`FindClass`得到就`jclass`对象。记得将`'`替换成`/`。
2. 根据需要得到合适的构造方法的id。我没有定义构造方法，那么编译器会为它提供一个无参的构造方法。也就是函数签名为`()V`。调用`JNIEnv`的`GetMethodID`得到id。
3. 调用`JNIEnv`的`NewObject`创建对象，记得传递构造参数。我这里不需要传递。

综上分析，这个创建过程类似于如下示例
```cpp
auto cls=env->FindClass("me/hongui/demo/Person");
auto construct=env->GetMethodID(cls,"<init>","()V");
auto age=env->GetFieldID(cls,"age","I");
auto name=env->GetFieldID(cls,"name","Ljava/lang/String;");
auto p=env->NewObject(cls,construct);
auto nameValue=env->NewStringUTF("张三");
env->SetIntField(p,age,18);
env->SetObjectField(p,name,nameValue);
return p
```
上面的示例有个有意思的点，其实示例中创建了两个Java对象，一个是`Person`对象，另一个是`String`对象。因为在编程中，`String`出境的概率太大了，所以JNI提供了这个简便方法。同样特殊的还有数组对象的创建。并且因为数组类型不确定，还有多个版本的创建方法，如创建整型数组的方法是`NewIntArray`。方法签名也很有规律，都是`NewXArray`的形式，其中`X`代表数组的类型，这些方法都需要一个参数，即数组大小。既然提到了数组，那么数组的设置方法就不得不提。设置数组元素的值也有对应的方法，形如`SetXArrayRegion`，如`SetIntArrayRegion`就是设置整型数组元素的值。和Java世界不同的是，这些方法都是支持同时设置多个值的。整形数组的签名是这样——`void SetIntArrayRegion(jintArray array,jsize start, jsize len,const jint* buf)`第二个参数代表设置值的开始索引，第三个参数是数目，第四个参数是指向真正值的指针。其余类型都是类似的。
### 让数据访问更进一步
有些时候，我们不是在调用`native`方法时访问对象，而是在将来的某个时间。这在Java世界很好实现，总能找到合适的类存放这个调用时传递进来的对象引用，在后面使用时直接用就可以了。`native`世界也是这样吗？从使用流程上是一样的，但是从实现方式上却是很大不同。

Java世界是带有GC的，也就是说，将某个临时对象`X`传递给某个对象`Y`之后，`X`的生命周期被转移到了`Y`上了，`X`不会在调用结束后被销毁，而是在`Y`被回收的时候才会一同回收。这种方式在纯Java的世界里没有问题,但是当我们把这个临时对象`X`传递给`native`世界，试图让它以Java世界那样工作时，应用却崩溃了，报错`JNI DETECTED ERROR IN APPLICATION: native code passing in reference to invalid stack indirect reference table or invalid reference: 0xxxxx`。为什么同样的操作在Java里面可以，在`native`却不行呢。问题的根源就是Java的GC。GC可以通过各种垃圾检测算法判断某个对象是否需要标记为垃圾。而在`native`世界，不存在GC，为了不造成内存泄漏，只能采取最严格的策略，**默认调用`native`方法的地方就是使用Java对象的地方**。所以在`native`方法调用的作用域结束后，临时对象就被GC标记为垃圾，后面想再使用，可能已经被回收了。还好，强大的`JNIEnv`类同样提供了方法让我们改变这种默认策略——`NewGlobalRef`。对象只需要通过这种方式告诉JVM，它想活得更久一点，JVM在执行垃圾检测的时候就不会把它标记为垃圾，这个对象就会一直存。在，直到调用`DeleteGlobalRef`。***这里`NewGlobalRef`，`DeleteGlobalRef`是一一对应的，而且最好是再不需要对象的时候就调用`DeleteGlobalRef`释放内存，避免内存泄漏。***
## 总结
***JNI开发会涉及到Java和C/C++开发的知识，在用C/C++实现JNI时，基本思想就是用C/C++语法写出Java的逻辑，也就是一切为Java服务。JNI开发过程中，主要要处理两个问题，函数注册和数据访问。*** 

函数注册推荐使用动态注册，在`JNI_OnLoad`函数中使用`JNIEnv`的`RegisterNatives`注册函数，注意保持Java的`native`方法和类型签名的一致性，复合类型不要忘记前缀`L`、后缀`;`，并将`.`替换为`/`。

数据访问首先需要确定访问周期，需要在多个地方或者不同时间段访问的对象，记得使用`NewGlobalRef`阻止对象被回收，当然还要记得`DeleteGlobalRef`。访问对象需要先拿到相应的id，然后根据访问类型确定访问方法。设置属性通常是`SetXField`的形式，获取属性值通常是`GetXField`的形式。调用方法，需要根据返回值的类型确定调用方法，通常是`CallXMethod`的形式。当然，这些都是针对普通对象的，假如需要访问静态属性或者方法，则是在普通版本的`X`前面加上`Static`。这里的所有`X`都是指代类型，除了基本类型外，其他对象都用`Object`替换。

在注册函数和访问数据的时候需要时刻关注的就是数据类型。C/C++数据类型除了基本类型外都不能直接传递到Java里，需要通过创建对象的方式传递。一般的创建对象方式`NewObject`可以创建任何对象，而对于使用频繁的字符串和数组有对应的快速方法`NewStringUTF`，`NewXArray`。向Java传递字符串和数组，这两个方法少不了。

青山不改，绿水长流，咱们下期见！