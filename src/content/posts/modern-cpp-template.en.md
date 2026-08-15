---
title: "Modern C++ Learning Guide - Template"
description: "An introduction to C++ templates — function templates, class templates, type deduction, specialization and partial specialization, and type qualifiers."
date: 2022-10-31
updated: 2022-10-31
tags: ["Study guide","C++"]
draft: false
cover: /images/cover/modern-cpp-template.webp
---

> Template have always had a pivotal role as an important feature of C++, and are a great tool for writing highly abstract code.

## What is template
Template are real-life examples: fix the parts that are all the same, leave the parts that change empty, and combine the two parts to form something valid when you use it. Application forms and Word templates are examples of this, as are templates in C++, but more explicitly in C++, where the variable part is a surrogate type, called a generic parameter.

Let's look at an example to see how templates evolved. If we need to calculate the result of adding two objects, how do we write the code? Before we write the code, we have a couple of issues that we need to discuss clearly:
The first thing we need to determine is that the two objects are of what type, after all, C++ is a strongly typed programming language, variables, functions, and classes are explicitly specified as to what the type is, and the compilation of an unspecified type will not pass. Let's assume for a moment that the two types are integers. Once we have determined the type, we need to determine how the two objects need to be added together. Based on our assumption that they are integers, we know that we can just call the operator `+`. Finally, we need to determine what the result type of the addition of the two objects will be, and the result of the addition of an integer type will also be an integer type. To summarize, the code for this example might look something like this
```cpp
int sum(int left,int right){
	return left + right;
}
```
This example is simple, so simple that it doesn't even need to be written as a separate function. What if the data we need to calculate is not two numbers, but the sum of an array? Based on the previous analysis and assumptions, we can also quickly implement the corresponding code
```cpp
int sum(const int data[], const std::size_t length) {
	int result{};
	for (int i = 0; i < length;++i) {
		result += *(data + i);
	}
	return result;
}
```
Again, very simple. Unfortunately, this function is not very general, it can only compute integer sums, if we need to compute a sum with a decimal point, it doesn't work because the first argument type doesn't match, even though we know that almost all of `sum`'s code can be reused, except for the `int` in the first line, which needs to be replaced with `double`. But it can't! We can only make a copy and change the `int` places to `double`.
```cpp
double sum(const double data[], const std::size_t length) {
	double result{};
	for (int i = 0; i < length;++i) {
		result += *(data + i);
	}
	return result;
}
```
This is where you see the problem, **this process, we have only changed the type information**. The problem continues to grow, we may need to ask for an array sum of `float` again, the same array sum of `double` above won't match, because `float`, `double` are two types. It is because the data types are different that many times we need to provide similar code for different data, which is painful in the case of bloated data types, and when making changes to the algorithm we need to make sure that all the data types are modified and tested one by one, which definitely increases the workload and amplifies the error rate. But the actual valid code is to specify the type, if the type is not clear, the compiler can not determine whether the code is legal, not sure things the compiler has to report an error, so in accordance with the ordinary thinking, this problem is not solved.

But in fact, very often, these similar codes are simply different data types, and dealing with this repetitive work should be left to the computer, i.e. the compiler. So we need a technique that allows the **compiler to not care what the specific type is in the first place, but to replace it with a special type that can be replaced with any type, complete the specific algorithm with this special type, and provide the type information to the algorithm based on the actual needs at the time of use to allow the compiler to generate a specific algorithm that satisfies the provided type, which is a template**. This is ideologically common with templates in life. The algorithm is the fixed part, the data type is the variable part, and the two together make legal C++ code. That is, using templates, we can write just one algorithm, and with the help of the compiler generate algorithms of all types, and the only difference between these algorithms is the type.

Of course the template is not enough, the above only solves the problem of the type, did not solve the problem of algorithm implementation. How so, e.g. we have a requirement to sort the data first and then find the maximum value. This is valid for numeric (`int`, `float`, `double`, etc.) types, and can be done using comparison operators (`<`, `>`), but what if we want to make this algorithm work for custom types? Writing the comparison operator directly in the template implementation won't work for custom types because they don't have a corresponding comparison function. The solution is simple: the custom type implements the corresponding comparison operator. Problems such as these will often be encountered in the template, because we do not know anything about the type of information, but to ensure that almost all types can work properly, which will have to use a variety of techniques to qualify or detect the type, which is actually the essence of the template problem. So the template problem is not just a type problem, or a combination of other C++ problems, and requires a more complete understanding of C++ features in order to write useful and efficient code.
In C++, templates are usually divided into function templates and template classes, so let's start with the simpler function templates.
## Function template
A function template is a function that differs from a regular function in that at least one of its argument list is of indeterminate type. Continue with our example above:
```cpp
template <typename T>
T sum(const T data[], const std::size_t length) {
	T result{};
	for (int i = 0; i < length;++i) {
		result += *(data + i);
	}
	return result;
}

int main() {
	int intData[] = { 1, 1, 2, 2 };
	float floatData[] = { 1, 1, 2, 2 };
	double doubleData[] = { 1, 1, 2, 2 };
	auto len = sizeof(intData)/sizeof(intData[0]);

	std::cout << "intSum = " << sum<int>(intData,len) << ", floatSum = " << sum<float>(floatData,len) <<", doubleSum = " <<sum<double>(doubleData,len)<<std::endl;
	return 0;
}
// output
// intSum = 6, floatSum = 6, doubleSum = 6
```
Here, we've just written a function that works for `int`, `float`, and `double`. If there are other types that implement the default initialization and operator `+=` you can also use this function to sum without changing any existing code, that's the beauty of templates.
Before moving on to something new, let's recognize the difference between a function template and a regular function:

1. Function templates require a template header, `template<typename T>`. It serves to tell the compiler that none of the following functions where `T` is encountered are of a specific type, and that it needs to be determined again when the function is called.
2. In the function declaration, the type position is replaced by `T`, which means that `T` is a placeholder type that can be used as a normal type. This is useful when writing boilerplate code.

Looking again at the use of functions, that is, statements like `sum<xxx>(xxxData,len)`, where `xxx` represents the data type, which is the actual type of `T` in the function template. This simply tells the compiler to replace the type `T` in the function template with the type `xxx`, a process that has an official name, **instantiation**, which is another thing that is different from normal functions.... Using function templates is a two-step process.

1. Define the template. This step does not have a specific type and requires the use of a generic parameter to placeholder the type, i.e., wherever an actual type occurs, use the generic parameter to placeholder it and use this generic parameter to implement the complete algorithm. In this step the compiler, since it does not know the exact type, will not disable some type operations, but only check if the identifier exists, if the syntax is legal etc.
2. Instantiation. The process of instantiation happens only where the developer calls the function template, the code of the function template that is not instantiated does not appear in the most executable file. The compiler will replace the generic parameter with the actual parameter for each place where instantiation occurs, and check whether the actual type supports all the operations in the algorithm, if not, the compilation fails, and the developer needs to implement the relevant operations or modify the function template. As in the above example, if we instantiate a custom type, we will find that the compilation fails because the custom type does not define the operator `+=` (unless that operator is already defined), and this process occurs in the instantiation. The solution is simple: add the operator `+=` to the custom type.
## Type derivation
In the above example, we found that in the process of instantiation, we have to pass both the type parameter and the data parameter to the function template, and the type parameter is often one-to-one with the type of the data, which is a redundant syntax for modern C++ is unacceptable, so modern C++ compilers all support type derivation. Type derivation allows the developer to omit the type parameter and derive the type parameter directly from the data type, so the above example instantiation can be written in the form of `sum(xxxData,len)`, and the compiler will be able to derive the type of `xxx` to be `int`, `float`, and `double` respectively.
Of course, type derivation is not foolproof, let's look at the following example
```cpp
template <typename T>
T max(T a, T b) {
	return a > b ? a : b;
}
int main() {
	int a = 1;
	int b = 2;
	std::cout << "max(" << a << ","<<b<<") = " <<max(a,b) << std::endl;
	return 0;
}

// output
// max(1,2) = 2
```
This example is intuitive, and the result is certainly unsurprising. Now we're going to morph: we change the type of the variable `b` to `float` and realize that the compilation won't pass. The hint is that we have a data type mismatch, because `a` is `int` and `b` is `float`, so the deduction is `max<int,float>()`, whereas in reality we have only one type parameter.
So since the problem is clear, the solution seems simple enough, wouldn't it be enough to add another parameter to `max`? Let's take a look.
```cpp
template <typename A,typename B>
A max(A a, B b) {
	return a > b ? a : b;
}
int main() {
	int a = 1;
	float b = 2;
	std::cout << "max(" << a << ","<<b<<") = " <<max(a,b) << std::endl;
	return 0;
}

// output
// max(1,2) = 2
```
After this change, it compiles and runs without errors, so the problem seems to be solved, right?
No, it's not. Let's replace `float b = 2;` with `float b = 2.5;`.
```cpp
int main() {
	int a = 1;
	float b = 2.5;
	std::cout << "max(" << a << ","<<b<<") = " <<max(a,b) << std::endl;
	return 0;
}

// output
// max(1,2.5) = 2
```
Run the program again, and you'll see that the output is wrong. This is because in the function template, we defined the return value as `A`, and at instantiation time `A` was derived to be of type `int`, so in fact the return value of `max` became of type `int`, and the maximum value, `B`, was forcibly converted from a `float` to an `int`, and the data precision was lost. So is there a solution? There is, and there is more than one!
According to the above analysis, the root of the problem is that the data has been forcibly converted, and the solution is of course to prevent it from happening, that is, to keep the two data types consistent, so how to ensure it? Block the compiler's type derivation, manually fill in the type parameter.
```cpp
int main() {
	int a = 1;
	float b = 2.5;
	std::cout << "max(" << a << ","<<b<<") = " <<max<float>(a,b) << std::endl;
	return 0;
}

// outout
// max(1,2.5) = 2.5
```
As you can see in this example, we only filled in one type parameter, because type `B` is automatically deduced to `float`. Yes, type derivation can be partially disabled!
Another solution is to let the compiler calculate the type entirely. How to calculate it, C++11 provides `auto` and `decltype`. `auto` calculates the type of a variable, and `decltype` calculates the type of an expression, as follows:
```cpp
auto a=1; // a is derived as type int
auto b=1.5; // b is derived as type double
decltype(a+b) //the result is type double
```
That is, you can set the return value to `auto` and let the compiler decide the return type
```cpp
template <typename A,typename B>
auto max(A a, B b) {
	return a > b ? a : b;
}
int main() {
	int a = 1;
	float b = 2.5;
	std::cout << "max(" << a << ","<<b<<") = " <<max<float>(a,b) << std::endl;
	return 0;
}

// output
// max(1,2.5) = 2.5
```
If the compiler only supported C++11, it would be a bit tricky to not only front `auto`, but also use `decltype` after the function header to compute the return type, a feature known as **tailed return derivation.**
```cpp
template <typename A,typename B>
auto max(A a, B b)->decltype(a + b) {
	return a > b ? a : b;
}
```
Here `decltype` is written inside the
Let's put the function templates aside for now, and let's take a look at what the class template look like.
## Class template
Like function templates, class templates contain at least one generic parameter that is scoped to the entire class, meaning that member variables and member functions can be defined using this generic parameter.
```cpp
template <typename T>
class Result {
	T data;
	int code;
	std::string reason;

public:
	Result(T data, int code = 0, std::string reason = "success") :data{ data }, code{ code }, reason{ reason } {

	}

	friend std::ostream& operator<<(std::ostream& os, const Result result) {
		os << "Result(data = " << result.data <<", code = " << result.code <<", reason = " << result.reason <<")" << std::endl;
		return os;
	}
};
int main() {
	Result<int> result{ 9527 };
	std::cout << result << std::endl;
	return 0;
}

// output
// Result(data = 9527, code = 0, reason = success)
```
As you can see, the class template is similar to a regular class in that it has everything that a regular class has - member functions, member variables, constructors, etc. It's still worth mentioning the generic parameter `T`. The above example is a common data class in the SDK, used to indicate whether an operation was successful or not and to return the result of the operation if necessary. For returning normal data types, this class is sufficient, but if one of our interfaces does not have a return value, and traditionally returns a `void` type, a problem arises. The actual type of `data` is `void`, but we can't find any value to initialize it. Further, when returning `void`, we don't need the `data` member variable at all. To solve problems like this one, templates provide specializations.
## Specialization and partial specialization
**Specialization is the reimplementation of a class template or function template with a specific type instead of a generic parameter, which depends on the original template**. As in the above example, we already have the original template class `Result<T>`, in order to solve the case where `void` cannot be used, we need to redefine a `Result` for the `void` type, i.e., `Result<void>`, then `Result<void>` is known as a kind of specialization of `Result<T>` and the original ` Result<T>` is called the original template class. There can be many such specializations, and a type is a specialization which **perfectly combines the advantages of both generality and specificity**. When instantiation is done, if the instantiated type and the specialization type are the same, the instantiation will be done using that class (function) of the specialization, as in the following example
```cpp
// Result definition remains unchanged, new specialization version added
template <>
class Result<void>{
	int code;
	std::string reason;
public:
	Result(int code = 0, std::string reason = "success"): code{ code }, reason{ reason }{}

	friend std::ostream& operator<<(std::ostream& os, const Result result) {
		os << "Result("<<"code = " << result.code << ", reason = " << result.reason << ")" << std::endl;
		return os;
	}
};

int main() {
	Result<void> voidResult;
	Result<int> intResult{9527};
	std::cout << "void = "<< voidResult<<std::endl<<"int = " << intResult << std::endl;
	return 0;
}

// output
// void = Result(code = 0, reason = success)
// int = Result(data = 9527, code = 0, reason = success)
```
As you can see, when instantiated to the `int` type, the original template class is used. And when instantiated as a `void` type, the specialization version is used.
In addition to specialization, there is also **preferential specialization**. A partial specialization is much like a specialization in that it is a narrower qualification of the type to make it apply to a certain class of types, such as `const`, pointers, references, etc. Or partial specialization for classes with multiple generic parameters.
Specialization and partial specialization are complementary to template special types and solve some problems with template implementation. Very often if the generic template is not well implemented, you can consider using specialization. Of course, the more versions of specialization, the higher the maintenance cost of the template, it is time to consider whether there is a design flaw.
## Type qualification
The power of C++ templates is not only in the manipulation of types, but sometimes in order to prevent our classes from being abused, we need to qualify these abilities, such as disallowing the instantiation of certain specific types.
In the example above, suppose we specify that `Result` must return actual data, what would be the best way to prohibit `void` instantiation? It's easy to think that we would first need a way to **determine whether the type at instantiation is of a particular type**, and then we would need to tell the compiler to fail to compile if **the instantiated type is a forbidden type**. All of this is supported by the standard library `type_traits`. It provides a number of tools to help us recognize type parameters such as numbers, strings, pointers, etc. It also provides a number of other tools to assist these type parameter tools with more complex functions.
In this case, we want the instantiation type not to be `void`, and after looking up `type_traits`, we find that there is a class `is_void`, which has a `value` constant that is `true` if the type parameter is `void`, and `false` otherwise. Of course it's not enough to have a determination method, we also need a way for the compiler to report an error if the types don't match, and as it happens, we have `enable_if_t`. It has two type parameters, the first is a boolean expression and the second is a type parameter. The type parameter is defined when the expression is true, otherwise the compilation fails. So in order to accomplish the function of disabling `void` instantiation, we need to use two tools, `is_void` to determine whether the type parameter is `void` or not, and `enable_if_t` to accomplish the conversion from boolean expression to type parameter. To summarize, let's take a look at the implementation:
```cpp
template <typename T>
class Result {
	std::enable_if_t<!std::is_void<T>::value,T> data;
	int code;
	std::string reason; 

public:
	Result(std::enable_if_t< !std::is_void<T>::value,T> data, int code = 0, std::string reason = "success") :data{ data }, code{ code }, reason{ reason } {

	}

	friend std::ostream& operator<<(std::ostream& os, const Result< std::enable_if_t< !std::is_void<T>::value, T>> result) {
		os << "Result(data = " << result.data <<", code = " << result.code <<", reason = " << result.reason <<")" << std::endl;
		return os;
	}
};
```
In the example, lines 3 and 8 both use type qualification, when in fact we only need to qualify `T` in the constructor. When instantiating `Result` with `void`, it will not compile.
## Other issues
There are two aspects of C++ templates that need to be addressed, one is the template-related issues and the other is working with other features. For example, C++11 introduced right-valued references, but right-valued references passed through parameters can cause references to collapse, losing their right-valued nature and behaving like normal reference types. This is fine for normal functions, but what if it's a template function? C++ also provides the **perfect forwarding** solution.
Perfect forwarding means that a right-valued reference stays a right-valued reference, and a left-valued reference stays a left-valued reference. It needs to be used in conjunction with universal references. Universal references are very similar to right-valued references, except that the **universal reference type is indeterminate and can only be determined at compile time**. Look at the following example
```cpp
template <typename T>
void test(T&& p) {
	std::cout << "p = " << std::forward<T>(p) << std::endl;
}

int main() {
	int a = 1;
	test(a);
	test(std::move(a));

	return 0;
}

// output
// p = 1
// p = 1
```
`T&&` is a universal reference because it is of indeterminate type, and then the arguments are forwarded through `std::forward<>`. As you can see in lines 8 and 9, we successfully pass the left and right values to `test` and also successfully get the expected result without having to write a separate function for the right value to handle it. This feature of templates greatly simplifies function design and is a lifesaver for API design.
In addition, function templates have the problem of overloading. Generally speaking, the priority of ordinary functions will be higher than the priority of function templates, function templates between the more special will be preferred to match and so on. These problems with the depth of understanding of the template, will slowly appear, but in the early stages of learning there is no need to spend too much effort to understand these features, everything to the main practical.
## Summary
Templates are a big topic in C++, combining the type system, the standard library, classes, and a host of other big topics. So writing perfect template code requires a complete understanding of these topics. Secondly, because the template type control is more relaxed, but also need to developers on the scope of application of the template has a global control, what is prohibited, what types need to be specialization of the treatment, should be considered in place, a little inattention will hide a difficult to detect the bugs.
In short, it is a word, the template is always learning, often used often new, need to learn in practice, but also in the learning of things in practice, I wish you every time there are new gains!
## Reference

1. [type_traints](https://en.cppreference.com/w/cpp/meta#Type_traits)

