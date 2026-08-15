---
title: "现代C++学习指南-具体类"
description: "介绍C++中类的各个部分的作用，以及怎样使用这些功能实现开发目标"
date: 2022-08-05
updated: 2022-08-05
tags: ["C++"]
draft: false
cover: /images/cover/modern-cpp-class.webp
---

> 类作为C++中重要的概念之一，有着众多的特性，也是最迷人的部分！

类是一个加工厂，开发者使用C++提供的各种材料组装这个工厂，使得它可以生产出符合自己要求的数据，通过对工厂的改造，可以精细控制对象从出生到死亡的各种行为，真正达到我的代码我做主的境界。

## 类
我们经常说的面向对象三大特征：封装，继承和多态，其实说的是一种抽象维度。最简单的就是具体类，它将数据打包在一起，提供操作数据的函数，使得开发者不再需要通过传参的形式传递数据。它实现了事物的抽象，也就是所谓的封装。第二层是在一堆数据中提取出共性的部分作为基类，然后将特性作为子类，充分利用继承的优点，实现代码复用。它不仅追求数据抽象，也追求行为上的相似性。而更进一步，一套算法不关心实际的数据，只关心它可以用来完成什么工作，甚至相互都不知道对方的存在，唯一的共同点就是都继承自某个类，都能完成那个类指定的操作，至于细节都不关心，这就是多态，类只是一种规范流程。从第一层到第三层，抽象的事物从具体转向抽象，重心也从数据转向行为，只是为了更好的可维护性和解耦性。三者的关系可能是下图这样的：
![class](/images/posts/modern-cpp-class/class.jpg)
为了能将跟高级的继承和多态讲明白，本篇我们将着重介绍他们的第一形态：封装，也就是具体类。
## 类的基本组成
类是一种自定义类型，主要由两部分组成：成员变量保存类管理的数据，成员函数操作数据。
和普通变量相比，类中的成员变量最大的不同是其生命周期。成员变量在类实例化后才占用空间，构造函数完成其初始化工作，在构造完成后，成员函数就可以无限制地使用成员变量，直到析构函数被调用。
成员函数和普通函数的不同之处是成员函数有个隐含的`this`指针，这个指针指向成员变量的存储位置，也就是可以很方便地完成成员变量的访问。
由此可见，具体类研究的主体是数据。接下来我将围绕着数据的生命周期完成对类特性的解析。
## 对象的创建和销毁
类的第一大作用就是控制类怎么生成和销毁。和Java不同，不需要用`new`也会涉及到构造函数的调用，哪怕只是个普通的局部变量，出了变量的作用范围，对象就会被销毁，内存就会被释放。
```cpp
class Sample{
 public:
    Sample(){
        std::cout<<"Creating a Sample object"<<std::endl;
    }
    
    ~Sample(){
        std::cout<<"Destoring a Sample object"<<std::endl;
    }
};

int main(){
    // Sample的构造函数被调用
    Sample a; 
    {
        // 大括号创建了一个局部作用域，对象b只存在大括号范围内，出了大括号后，b就会被销毁，调用Sample的析构函数
        Sample b;
    }
    // 此时只有对象a还存活
}
// 输出
// Creating a Sample object
// Creating a Sample object
// Destoring a Sample object
// Destoring a Sample object
```
上面的Sample是最简单的类定义，我们只创建了类的构造函数和析构函数，在`main`函数中，创建了两个变量。通过检查输出，我们可以确定类的构造函数和析构函数都被调用了。
上面那个类从功能上毫无用处，我们只能创建一个它的对象，然后看着它死去，什么也干不了。接下来，我们来改造下`Sample`类，让它能在构造的时候告诉我们，哪一个对象在构造。
```cpp
class Sample{
    Sample(const std::string name){
            std::cout<<"Creating a Sample object:name = "<<name<<std::endl;
        }
    //其余不变
};

int main(){
    // 由于创建对象a时，用到了string对象，所以要先创建一个string对象
    std::string str{"a"};
    // 此时构造类需要一个名字了，我们已经控制了类的初始化状态
    Sample a{str}; 
    {
        // Sample唯一给构造函数需要一个string的对象，但是编译器推测出传递给Sample构造函数的参数类型是字符串常量
        // 参数不匹配，但这还没达到编译失败的条件，因为编译器还没检查是否存在一种从字符串常量生成字符串对象的构造函数，
        // 答案是有的，string类提供了这样的构造函数
        // 接下来编译器用字符串常量构造出了string对象，自动完成了string对象的创建
        // 并传递给Sample的构造函数，条件满足，编译顺利完成
        Sample b{"b"};
    }
}
// 输出
// Creating a Sample object:name = a
// Creating a Sample object:name = b
// Destoring a Sample object
// Destoring a Sample object
```
上面的例子有一个值得注意的地方，那就是对象`b`直接从字符串常量创建出来了，省略了中间字符串对象，其实这一步是编译器为我们完成了，它的创建过程和`a`是完全一样的，这种行为称为隐式转换。
这时的`Sample`类还是什么也做不了，甚至连哪一个对象被销毁了我们都不知道。析构函数是函数，那么给析构函数添加参数行不行呢？答案是不行，因为析构函数是编译器自动帮我们调用的，它不知道调用时需要什么参数，所以就只能是无参。那么有什么办法能正确标记出是哪个对象被销毁了呢，答案是成员变量。
成员变量和对象是同生共死的，它和对象使用同一块内存。对象创建就为成员变量也分配了空间，但是没有初始化，需要开发者在构造函数或者其他函数使用前初始化。在析构函数调用时，内存尚未被回收，这时候是使用成员变量的最后时机。成员变量还有另一个重要的特点，在类中定义的所有非`static`函数都能使用它，不需要通过函数参数传递。这也是类设计的初衷之一，用类管理数据。
所以，接下来的析构函数可以这样写
```cpp
class Sample {
private:
    // 第一步，创建一个成员变量
    std::string name;
public:
    // 第二步，在构造函数中初始化成员变量
    Sample(const std::string name) :name{ name } {
        std::cout << "Creating a Sample object:name = " << name << std::endl;
    }

    ~Sample() {
        //第三步，使用成员变量
        std::cout << "Destoring a Sample object:name = " << name << std::endl;
    }
};

int main() {
    std::string str{ "a" };
    Sample a{ str };
    {
        Sample b{ "b" };
    }
}
// 输出
// Creating a Sample object:name = a
// Creating a Sample object:name = b
// Destoring a Sample object:name = b
// Destoring a Sample object:name = a
```
可以看到，创建成员变量也很简单，关键在于第二步，这和Java又不一样。第二步中，初始化成员变量使用了特殊的语法，在构造函数小括号后面添加了`:`，然后普通变量初始化的语法，称之为成员变量初始化。这样写的关键原因在于，对象创建需要先申请内存，内存申请后使用`:`后面的初始化方式初始化成员变量，最后才调用构造函数完成对象的创建，每一步都有它对应的位置和作用。假如像Java一样写在构造函数里面，就相当于将第二步放到了第三步，打乱了它本来的顺序。
为了说明成员函数确实在对象的整个生命周期都可以使用，我们再个它添加一个成员函数吧。
```cpp
class Sample{
    void print() {
        std::cout << "Invoke print name = " << name << std::endl;
    }
    //其余不变
}
int main() {
    std::string str{ "a" };
    Sample a{ str };
    {
        Sample b{ "b" };
        b.print();
    }
    a.print();
}
// 输出
// Creating a Sample object:name = a
// Creating a Sample object:name = b
// Invoke print name = b
// Destoring a Sample object:name = b
// Invoke print name = a
// Destoring a Sample object:name = a
```
我们添加了一个成员函数`print`它没有参数，但是它的函数体使用了成员变量`name`，可以看到，它也能正常工作。
至此，对象的创建和销毁就说得差不多了。还没说到的是构造函数可以有很多个，在创建对象的时候可以选择使用哪种方式创建，编译器会根据传递的参数来推导出实际使用的构造函数，开发者需要考虑的是提供的构造函数都能完成成员函数的正确初始化，以便在调用成员函数时，成员函数都能按预期工作。如`Sample`，我们还可以提供一个无参的构造函数，然后将`name`初始化为空字符串，这样`print`和析构函数也能正常工作。
总结一下，类是管理数据的容器，它的数据随着对象的创建而创建，并在对象存在的整个生命周期都可用。构造函数需要保证数据的初始化，并可以控制它构造的方式，成员函数可以随时使用，析构函数是对象销毁时最后一个调用，它需要保证数据到此都被清理。
## 数据的转移和共享
### 数据拷贝
数据创建之后，不仅可以供成员函数使用，还可能被转移到其他对象中去。或者和其他对象共享。复制构造函数可以控制数据以怎样的方式和其他对象共享。
```cpp
class Sample {
private:
    int value;
public:
    Sample(const int value) :value{ value } {
        std::cout << "Create value = " << value << std::endl;
    }

    // 以Sample命名，是构造函数，函数参数是自己的类型，说明是复制构造函数
    // 这个复制构造函数选择用赋值的形式共享value数据
    Sample(const Sample& sample) :value{ sample.value } {
        std::cout << "Copy create object" << std::endl;
    }

};

void use(Sample sample) {
    //函数返回，sample对象被销毁
}

int main() {
    Sample a{ 1 };
    // a的数据被分享给一个临时对象了，此时出现了两个对象，它们的value都是1
    use(a);
}
// 输出
// Create value = 1
// Copy create object
```
复制构造函数有以下几个特征

1. 会出现至少两个同类型的对象。因为复制需要先有一个存在的对象，再用这个存在的对象数据初始化另一个正在创建的对象的成员变量。这也是复制构造函数参数是自己的原因。
1. 存在变量从无到有初始化的情况都会调用复制构造函数。函数调用，形参需要初始化为实参，参数本来不存在，调用函数会传递一个已存在的对象，就会调用到复制构造函数。这也是为什么复制构造函数参数是引用的类型。假如是普通变量，调用复制构造的时候需要产生临时变量，临时变量又需要调用复制构造函数，程序就会陷入无限递归中。
1. 除了函数调用，函数返回值，用对象初始化新变量的情况也会调用到复制构造函数。函数返回后，函数体中所有的局部变量都会被销毁，返回值也属于一种局部变量肯定也要被销毁，但是返回后的值却需要被 外部使用，它们的生命周期是不一样的，由此我们就知道肯定创建了一个新的对象，这个对象被局部返回值初始化，但是有着和外部一样的生命周期。用对象初始化变量就更直观了，初始化的对象是从无到有创建的。符合构造函数出现的特点。

我们可以来验证一下
```cpp
//其余不变
Sample returnSample() {
    // 用普通构造函数初始化的
    Sample sample{ 2 };
    return sample;
}
int main() {
    Sample a{ 1 };
    std::cout << "init local variable" << std::endl;
    // b是新对象，用a初始化的，所以调用了复制构造函数
    Sample b = a;
    // use的形参被用来初始化
    std::cout << "Use Sample as parameter" << std::endl;
    use(a);
    //返回的sample被用来初始化c
    std::cout << "return sample" << std::endl;
    Sample c = returnSample();
}
// 输出
// Create value = 1
// init local variable
// Copy create object
// Use Sample as parameter
// Copy create object
// return sample
// Create value = 2
// Copy create object
```
可以看到，这三种情况都会造成复制构造函数的调用。
### 数据移动
数据拷贝虽然简单易行，但是还是有个小瑕疵。考虑下面这种场景：
```cpp
void swap(Object& left,Object& right){
    // 有新对象产生，拷贝构造，目前内存中有两份一模一样的left
    Object temp=left;
    // 赋值操作，生成了一个right的临时对象
    left=right;
    // 赋值操作，生成了一个temp的临时对象
    right=temp;
    // 三个临时对象都被销毁
}

int main(){
    Object a;
    Object b;
    swap(a,b);
    return 0;
}
```
一个简单的交换逻辑，我们就生成了很多的临时对象，假如我们操作的是列表，大对象，短时间内大量创建并销毁对象，就会造成内存抖动，严重影响系统的稳定性，而且，我们的真正目的只是将两个变量的值交换一下而已。所以相较于拷贝，我们还有更好的选择：移动。
#### 左值和右值
说起移动，就不得不提到左值和右值。这里的左和右是相对于`=`来说的。
我们知道`=`是用来赋值的，这下面隐藏着三个动作：生，取，写。在内存中生成一个临时数据，读取变量保存位置，将临时变量内容写入保存位置。生就是指的右值，它保存在我们不知道的内存位置，在写动作完成后，它就被回收了。而取对应的就是左值，我们用变量名保存了它的内存位置，在它作用域内可以反复读写。所以右值最大的特点就是不知道地址，如`i=i+1`就会先生成一个`i+1`的临时对象，我们不知道地址，所以它是右值。与之相对的左值，是可以通过`&`读到地址的。
接下来我们再来谈一谈引用。我们通常是用别名来理解引用的，但是可能会忽略一个小细节，别名也是需要有归属的，也就是它代表的地址在哪里。基于这个前提，我们就可以推导出凡是存在内存中的数据，理都是有地址的，而右值是存在内存中的，它也应该需要一种方式来获得地址，称之为右值引用，相对的一般变量的引用就称为左值引用。
说回到移动，前面的复制构造函数虽然能将数据和其他对象共享，但是大部分情况下，数据其实不需要共享的，只需要转移，也就是将数据的所有权移动到另一个对象上，原始对象就不再有效。所以C++提供了移动构造函数来完成这个操作。
```cpp
class Sample {
private:
	int* value;

public:
	Sample(const int value) :value{ new int{value} } {
		std::cout << "Create value = " << value << std::endl;
	}

	Sample(const Sample& sample) :value{ new int {*sample.value} } {
		std::cout << "Copy create object" << std::endl;
	}

	Sample(Sample&& sample) :value{ sample.value } {
		sample.value = nullptr;
		std::cout << "Move create object" << std::endl;
	}

	~Sample() {
		delete value;
		std::cout << "destory sample" << std::endl;
	}

	friend std::ostream& operator<<(std::ostream& os, const Sample& sample) {
		os << "Sample value is " << sample.value;
		return os;
	}

};

void use(Sample sample) {
	std::cout << "Use sample " << sample << std::endl;
}


int main() {
	// 普通变量，1被使用后马上销毁了
	int a = 1;
	//左值引用
	int& b = a;
	//右值引用，引用的就是1那个暂存的地址
	int&& c = 1;
	//可以修改引用的值
	c = 2;

	Sample sample{ 1 };

	use(std::move(sample));

	std::cout << sample << std::endl;
}
// 输出
// Create value = 1
// Move create object
// Use sample Sample value is 009B8E90
// destory sample
// Sample value is 00000000
// destory sample
```
在上面的代码里，我们真正使用`sample`对象的是函数`use`，`use`执行完后，`sample`就没用了。所以我们用`std::move`将数据转移到了函数实参中，外部的`sample`不再拥有那块内存的占用。很多场景其实都是类似的情况：外部配置参数后，传递给某个函数使用，所以这种情况下就没必要构造一个新的对象出来，假如业务很长的话，`sample`对象就会一直占用内存，但是它是早就没用了的。所以移动构造函数就发挥了大作用。
### 数据共享
除了通过复制构造函数和成员函数共享数据外，还可以通过友元类和友元函数。它们都是一种特殊的访问数据的形式，可以直接访问到数据，不经过成员函数的调用。所以在有些时候友元能帮助减少函数调用的花销，有些时候则会引入不可预期的行为。
```cpp
class FriendClass {

public:
    void useSample(const Sample& sample) {
        std::cout << "Sample value is " << sample.value << std::endl;
    }
};
```
上面的例子，如果按照常规是无法通过编译的，因为`sample`的`value`是私有的。前面我们知道，成员函数是可以访问私有变量的，但是这个类是定义在`Sample`外的，这个函数是另一个类的成员函数，完全没办法完成这种访问。当然，这种情况下，我们可以修改`Sample`类的定义，添加一个成员函数就解决了。但是假如`FriendClass`有多个成员函数都需要访问`Sample`的私有成员呢，这个时候添加成员函数的方式就不再适用，所以出现了友元类。
实现友元类很简单，简单到只需要添加一条声明。首先友元类需要至少两个类，一个类是想要访问私有成员的源类，另一个是含有私有成员的目标类，然后我们把友元声明放在目标类里，源类就可以顺利访问到目标类的私有成员了。在上面的例子`FriendClass`想要访问`Sample`的私有成员，所以它是源类，是普普通通的类。`Sample`含有`FeiendClass`想访问的私有成员`value`，所以它是目标类，声明需要添加到它的类定义里面。
```cpp
Class Sample{
    private:
    int value;
    friend class FriendClass;
    
    //其余不变
}
```
加上这一条之后，前面的`FriendClass`就可以正常通过编译了。这一句的威力很大，大到`FriendClass`的所有成员函数都能访问到`value`。假如这不是你的期望，但是还是想要直接访问到`value`，那么就可以适用友元函数。
友元函数是普通的函数，虽然它声明在类里，但是不能直接访问到类的私有成员，而是通过函数参数的形式。为了和普通的成员函数区分开来，它的声明最前面需要添加关键字`friend`。`friend`仿佛像打开了权限控制的开关，可以使函数访问到参数的私有成员。
```cpp
class Sample{
    friend std::ostream& operator<<(std::ostream& os,const Sample& sample) {
        os << "Sample value is " << sample.value << std::endl;
        return os;
    }
    //其余不变
}

int main() {
    Sample a{ 1 };
    std::cout << a << std::endl;
}

// 输出
// Create value = 1
// Sample value is 1
```
函数`<<`是友元函数，因为函数声明有关键字`friend`。友元函数不是成员函数，想在函数体访问到成员变量，需要添加函数参数。那么函数参数有很多个，怎样确定参数私有成员的可访问性呢，这就得看这个友元函数声明在哪个类里面了，友元函数的声明位置直接确定了它访问私有成员的范围。
## 特殊的成员函数
C++的类有极大的定制性，这种定制性不仅仅表现在数据上，还表现在成员函数上。我们知道一般的成员函数都是使用`.`来调用的，但是出于特殊的场景，有些情况下这种调用形式不仅仅不直观，还效率不高。所以C++提出了运算符的概念。之所以称为运算符，是因为函数的调用和传参形式和普通的成员函数不一样。定义良好的运算符可大大提高代码的可读性。如

- `[]`操作符是下标运算符，有了它的帮助，我们就可以像`obj[2]`这样取容器中的元素了。
- `()`则可以把对象当成函数一样直接调用，实现函数式编程的效果。
- `->`可以返回另外的对象，使得它可以表现出另一个对象的行为。

还有其他的诸如`++`，`--`等操作符，在定义特定类型的类时，提供合适的运算符函数能使我们的类更简洁、好用。
## 总结
总的来说，类是一个数据管理器，构造函数控制数据生成，来源可以使其他类型，也可以是相同类型。用相同类型生成新数据的时候，有复制和移动两种选择。复制构造函数控制相同类型的数据共享行为，其主要目标就是实现两个类型在构造函数完成那一刻，在内存中的数据是完全一致的。移动构造函数的目标则是将现有的数据转移到当前构造的对象上来，然后使现有的数据失效，从而达到减少对象创建、销毁，增加内存利用率的目的。除此之外，还能使用成员函数改变或者访问数据，最终在析构函数中结束数据的生命。此外友元类或者友元函数也是一种数据访问途径。
具体类的主要矛盾是数据，设计类的关键还是要弄清数据流向。数据自身在内部能有什么状态，能实现什么行为，是成员函数该完成的工作。此外还要考虑相同类型相互构造时数据的共享情况，是完全隔离，还是相互影响，这些都是应该考虑的问题。毕竟确保数据从创建到销毁的可靠性和有效性是一个具体类应该完成的基本功能。

