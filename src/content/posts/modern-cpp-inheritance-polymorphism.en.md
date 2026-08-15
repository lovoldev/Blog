---
title: "Modern C++ Learning Guide - Inheritance and Polymorphism"
description: "Covers the fundamentals of C++ inheritance and polymorphism — including virtual functions, abstract classes, and when to use virtual functions — and how to apply them."
date: 2022-10-01
updated: 2022-10-01
tags: ["Study Guide","C++"]
draft: false
cover: /images/cover/modern-cpp-inheritance-polymorphism.webp
---

> In the previous chapter, we learned how to encapsulate data within a class. In this chapter, we will continue to explore how to handle data and behavior distributed across different classes and appreciate the charm of object-oriented programming.

## Overview
When I first started learning programming, many teachers explained object-oriented programming as encapsulating data internally and accessing it through member functions. I memorized this concept and strictly followed it. However, during use, I found that this approach was not much different from procedural programming. Whether the data was inside or outside the class made only a minor difference. It wasn't until I gained a deeper understanding and application of inheritance and polymorphism that I realized the essence of object-oriented programming is not just encapsulation but achieving inheritance and polymorphism through encapsulation. If inheritance is like upgrading from a handcart to a horse-drawn carriage, then polymorphism is like the leap from a horse-drawn carriage to an internal combustion engine.

After implementing data encapsulation, you'll find many similar types of data that differ only slightly but are encapsulated in separate classes. This seems unreasonable. A straightforward solution would be to add another layer of abstraction before encapsulating the data. **Identify commonalities among these data types, provide a first-level common encapsulation, and then complete specific encapsulations based on this initial level. This approach is called inheritance**. The main purpose of inheritance is to achieve code reuse. Since these data types share commonalities, behaviors can be directly implemented in the parent class, while specific behaviors and data can be defined in the child classes. Child classes can achieve significant functionality with minimal code. Of course, this level of abstraction also has its limitations. For complex data, adding more intermediate layers can help manage complexity, but it may lead to unreadable code and maintenance challenges. Therefore, inheritance is not a panacea; it can only mitigate complexity to some extent, and overuse can increase complexity.

So, the path of data abstraction reaches its limit with inheritance. We need to consider abstraction from another dimension. In Python, there's a widely circulated saying: **if an object can quack, it can be treated as a duck. The core idea is that we don't care about the actual data contained in the object; as long as it can perform the required actions, it can be considered part of a certain type**. Similarly, in many scenarios, what we need to control is not the data itself but the flow of data. Since member functions control the data, controlling the flow of data essentially means controlling member functions, i.e., controlling behavior. **This approach of abstracting behavior is called polymorphism**. Polymorphism breaks away from traditional data classification methods and extends the applicability of classes to a broader scope. Thus, the emergence of polymorphism has established the dominance of object-oriented programming for nearly two decades. Of course, it is not without flaws. Polymorphism's control over data is loose, and without strict control measures, it can lead to system paralysis.

## Inheritance
In the previous section, I mentioned that inheritance involves identifying commonalities. So, what are commonalities? Commonalities are attributes that apply universally in any context. Take a person as a simple example. A person's name is an identifier in any scenario, so the name can be considered a commonality and placed in the parent class.

```cpp
class Person {
private:
	std::string name;

public:
	Person(const std::string name) :name{ name } {
		std::cout << "Create person = " << name << std::endl;
	}

	void introduction() {
		std::cout << "My name is " << name << std::endl;
	}

};

int main() {
	Person p{ "Zhang San" };
	p.introduction();
}
// Output
// Create person = Zhang San
// My name is Zhang San
```
This is a simple class using the encapsulation techniques discussed in the previous article. Now, let's say Zhang San goes to a friend's house where there are many people, both familiar and unfamiliar. Familiar people call him Dog Egg, while strangers still call him Zhang San. Both Dog Egg and Zhang San refer to the same person, but the context changes, shifting the focus. In a familiar environment, the focus is on his nickname, while in an unfamiliar environment, the focus is on his name. Should we create another class to encapsulate the nickname under this context? Clearly not. These characteristics refer to the same person and should be unified in one object. Should we place this characteristic in the `Person` class? No! Remember, only commonalities belong in the parent class, and a nickname is not a commonality; it is used only in familiar circles. Since neither creating separate classes nor combining them works, what should we do? The answer is inheritance. A familiar circle is a specific scenario, so there should be a specialized class to describe the properties of a person in this context.

```cpp
// Person class remains unchanged
class Friends : public Person {
	std::string nickname;
public:
	Friends(const std::string name, const std::string nickname) : Person(name), nickname{ nickname } {
		std::cout << "Create person = " << name << " with nickname " << nickname << std::endl;
	}

	void hi() {
		std::cout << "My nickname is " << nickname << std::endl;
	}
};

int main() {
	Friends f{ "Zhang San", "Dog Egg" };
	// Stranger
	f.introduction();
	// Friend
	f.hi();
}
// Output
// Create person = Zhang San
// Create person = Zhang San with nickname Dog Egg
// My name is Zhang San
// My nickname is Dog Egg
```
From the output, we can see that with almost the same structure as the `Person` class, we have achieved the functionality of two classes, demonstrating the power of inheritance. There are two key points in the code:

1. On line 1, `Friends` is followed by : `:public Person`, which is the inheritance syntax. It tells the compiler that `Friends` shares commonalities with `Person`. This allows us to **avoid redefining** the `introduction` member function.
2. On line 5, in the member initialization list, I used the class name with arguments to initialize the `name` member variable in `Person`, ensuring that the inherited `introduction` member function works as expected. This form is called **delegating constructor**.

Inheritance effectively addresses code reuse issues, allowing each class to focus on managing its own specific characteristics, adhering to the single responsibility principle. However, the transition from commonalities to specifics is not always perfect. As the inheritance chain grows, dependencies between classes become more complex and uncontrollable, making modifications to the parent class increasingly costly and potentially causing destructive changes to child classes, leading to uncontrollable bugs.

## Virtual Functions
With inheritance, a natural requirement is to modify a behavior defined in the parent class. This need is as natural as changing a parent class member variable during construction. The way **to change a parent class behavior is through virtual functions**. Virtual functions are member functions with a special feature: they allow a subclass to define a function with the same name, parameter list, and return type as a parent class member function. When a subclass object calls this method, the actual execution will be the subclass-defined member function, thus modifying the parent class behavior.

To achieve this goal, there are two steps: defining the parent class and overriding in the child class.

The key point in the parent class definition is to mark the member function with the `virtual` keyword.

```cpp
class Person {
protected:
	std::string name;

public:
	Person(const std::string name) :name{ name } {
		std::cout << "Create person = " << name << std::endl;
	}

	virtual void introduction() {
		std::cout << "My name is " << name << std::endl;
	}

};
```

1. On line 2, we changed `private` to `protected`, meaning that members defined from this line to the next access specifier can be accessed by subclasses. Thus, `name` can be directly used in subclasses.
2. On line 10, we added the `virtual` keyword to the member function header to indicate that `introduction` is a virtual function whose behavior can be modified by subclasses.

```cpp
class Friends :public Person {
	std::string nickname;
public:
	Friends(const std::string name, const std::string nickname) :Person(name), nickname{ nickname }{
		std::cout << "Create person = " << name << "with nickname " << nickname << std::endl;
	}

	void hi() {
		std::cout << "My nickname is " << nickname << std::endl;
	}

    void introduction() override{
        std::cout << "From Friends -> my name is " << name << std::endl;
    }
};
```
Compared to the previous example, this definition adds an `introduction` function with the `override` keyword, indicating to the compiler that this member function overrides a parent class function and not a new definition.

Let's see what happens when using a `Friends` object:

```cpp
int main() {
	Friends f{ "Zhang San", "Dog Egg" };
	// Stranger
	f.introduction();
	// Friend
	f.hi();

	return 0;
}

// Output
// Create person = Zhang San
// Create person = Zhang San with nickname Dog Egg
// From Friends -> my name is Zhang San
// My nickname is Dog Egg
```
From the output, it's clear that calling `introduction` on a `Friends` object modifies the behavior of the function. This way of modifying parent class behavior is called overriding.

Differences between overriding (override) and overloading (overload):
- Overloading and overriding both require the same function name, but determining the function also includes the parameter list and return type. Overloading requires all three to be the same, while overloading requires different parameter lists and does not restrict return types.
- Overriding can only exist in subclasses with inheritance relationships, used to change parent class behavior.
- Overloading occurs within the same scope where function names are the same but parameter lists differ.

## Polymorphism
Polymorphism builds on inheritance but focuses on behavior inheritance. For the parent class, its primary function is to define what actions can be performed without providing the data needed to complete these actions. For example, geometric shapes can all calculate perimeter and area, but rectangles and circles have different methods for calculating perimeter and area. Therefore, the parent class cannot store the basic fields needed for calculations but can specify that inheriting classes must implement methods to calculate perimeter and area. When using these classes, we typically rely on their actions rather than the data they store.

```cpp
// Geometric shape, defining actions that inheriting classes must implement
class Shape {
public:
    // Action to calculate area
	virtual float area() { return 0; }

    // Action to calculate perimeter
	virtual float perimeter() { return 0; }
};

class Rect : public Shape {
	float x, y;
public:

	Rect(float x, float y) : x{ x }, y{ y } {}

	float area() override {
		return x * y;
	}

	float perimeter() override {
		return 2 * (x + y);
	}
};

void calc(Shape& shape) {
	cout << "Area of this shape is " << shape.area() << endl;
	cout << "Perimeter of this shape is " << shape.perimeter() << endl;
}

int main() {
	Rect r{ 2, 3 };
	calc(r);

	return 0;
}

// Output
// Area of this shape is 6
// Perimeter of this shape is 10
```
In this example, `calc` defines a calculation process without using specific classes, only using the parent class `Shape`. Polymorphism ensures that when this algorithm runs, it calls the specific (`Rect`) virtual functions (`area`, `perimeter`). This is the meaning of polymorphism: multiple subclasses inheriting from the same parent class, when calling virtual functions via pointers or references, invoke the subclass function bodies, not the parent class function bodies. Thus, the algorithm process remains the same, but the results differ. Using this characteristic, we can enhance software functionality without modifying the core algorithm.

## Abstract Classes
In the previous example, the main goal of `Shape` is to **define interfaces and ensure that subclasses implement those interfaces while preventing users from directly creating Shape objects**. However, the example did not achieve this goal. Subclasses could omit interface implementations, and the program would still work, and Shape objects could be created directly. To achieve this goal, we need a new feature: abstract classes.

**Abstract classes primarily define interfaces and prevent users from directly creating objects of this class.** The implementation uses the `virtual` keyword along with = `= 0;`; Let's apply this idea to the previous example.

```cpp
// Geometric shape, defining actions that inheriting classes must implement
class Shape {
public:
    // Action to calculate area
	virtual float area() = 0;

    // Action to calculate perimeter
	virtual float perimeter() = 0;
};

// Rect, main function, and output remain unchanged
```
In this improved version, the main changes are removing the virtual function bodies and replacing them with = 0;. = 0; is a fixed syntax telling the compiler that this virtual function is **a pure virtual function with no function body, and any subclass inheriting from this class must implement this virtual function.** Any class containing pure virtual functions automatically becomes an abstract class, preventing users from directly creating objects of this class.

## One More Thing — Virtual Destructors
Previously, destructors were discussed as tools for cleaning up data. However, in classes with virtual functions, the situation is slightly different. When using virtual functions, we often use abstract classes to implement polymorphic behavior, but abstract classes cannot create objects. Therefore, the actual object must come from a subclass. When we finish using this object, we may need to clean up the space it occupies using the `delete` operator. The problem arises because the object's declared type is the parent class, but the actual type is the subclass. Thus, when calling `delete`, the form is to clean up the parent class, but our goal is to clean up the subclass. The solution is to make the parent class destructor virtual, ensuring that `delete` cleans up the correct target object.

## When to Use Virtual Functions?
In the previous article, we mainly discussed concrete classes, which are convenient for data encapsulation and some functional extensions but are not suitable for expansion. This article focuses on expansion capabilities. Therefore, using them depends on the business requirements.

If we only need a class to provide some functionalities, we can directly use concrete classes, which are simple, quick, reliable, and stable. If we need to abstract data or behavior, we should use virtual functions. Although virtual functions are convenient, they come with costs.

Firstly, the power of virtual functions is unleashed through pointers or references, which introduce time and space overheads.

1. Pointers and references need to dereference to find the actual object.
2. After finding the actual object, virtual functions need to look up the actual virtual function address through the virtual pointer.
3. Finally, the function is called based on the looked-up address.

These steps add overhead compared to regular member function calls, including additional virtual function tables and virtual pointers. Therefore, virtual functions are slightly slower than regular functions.

Secondly, virtual functions can be error-prone. Some behaviors are determined by subclasses, which act like black boxes. If these behaviors are not well-tested, they can introduce unpredictable bugs that are difficult to locate.

## Summary
Inheritance and polymorphism are powerful features, but compared to concrete classes, they have a broader impact. In scenarios requiring extension capabilities, they can significantly reduce code volume and simplify understanding. However, they also come with time and space costs, so their use should be carefully considered based on business needs. Always remember to define virtual destructors to ensure objects are correctly cleaned up.

Inheritance and polymorphism are abstract language solutions. They are not panaceas but depend on developers' ability to decompose problems and abstract them. Language provides guarantees for good abstractions. Therefore, when encountering issues, start by examining the actual problem and the abstraction process, as the problem may lie in the abstraction itself.


