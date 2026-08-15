---
title: Drawing Triangles in Android Applications Using OpenGL ES
description: Concepts of using OpenGL ES in Android applications and how to connect these concepts together to draw a triangle
tags: ["Learning Guide","Android","OpenGLES"]
date: 2023-07-23
updated: 2026-04-24
draft: false
---

> During college, there was a course called "Signals and Systems." In class, the professor explained the concept of systems—a system is a black box that produces output from input. In a stable system, the output is always fixed as long as the input is fixed. So to analyze a system, we can start by analyzing its input and output. **OpenGL ES APIs also form a system**, and to understand how it works, we can also start from its input and output.

## The OpenGL ES System

The output of the OpenGL ES system is easy to define—it **always outputs color values**, which also clarifies the system's function: generating color values. But to implement this function, OpenGL ES defines a set of rules that can convert all valid inputs into color values through appropriate transformations. From this perspective, **OpenGL ES is a system that generates color values according to certain rules**.

How are these rules generated? Although we don't know the answer, we can guess based on life experience: our output is a fixed color type. Regardless of the original input format, values closer to the output should be more similar to color values, otherwise the final function definitely cannot be completed. Following this reasoning, if we divide the system into multiple subsystems, where the output of the previous subsystem becomes the input of the next subsystem, and each subsystem produces some fixed intermediate value, then we have transformed a complex large system into simpler, smaller systems. So a basic guiding principle emerges: **divide the system's transformation process into several stages, where each stage is an independent subsystem with its own input and output, responsible for specific functionality and producing specific values**.

OpenGL ES calls this subsystem division the rendering pipeline. Each subsystem is called a shader, and shaders have dependencies on each other—the input of the later shader depends on the output of the previous shader.

![LearnOpenGL diagram](/images/posts/opengl-es-drawing-triangles/opengles-pipeline.png)

This diagram shows how the system is divided into subsystems. The arrow direction indicates the data flow direction. The output produced by the previous system can be directly used by subsequent systems. It's through this method that a set of vertex data can be converted into various colors. The upper part of the diagram is about how to convert a set of vertex data into coordinate information. The key part here is the vertex shader, which we can program to receive appropriate data and then produce useful output. As for the lower part of the diagram, the key is the fragment shader, which uses the coordinate information and intermediate calculation values generated earlier to produce color values.

For users of the OpenGL ES API, we only need to understand the vertex shader and fragment shader.

## Vertex Shader

Before explaining the vertex shader, we first need to be clear that **shaders run on the GPU**, and the data they operate on needs to be stored in video memory. Regular code runs on the CPU, with data stored in RAM. To keep the GPU busy, we need to be responsible for moving data from RAM to video memory—this is the first task. Where does the data come from, and how is it organized? This is the job of vertex attributes.

We talked about vertex data for a while earlier but haven't explained what it is. From the simplest perspective, it can be understood as a collection of coordinate values, where each group contains the same data, such as x, y, z, etc. But why not simply call it coordinate values? Because besides coordinate values, it can also contain color values, size values, or any other data you want to store. Group the data you want to store, where each group contains the same data and the data storage order remains consistent. Then transfer them from RAM to GPU video memory. At this point, it can be called vertex data. This is also the first stage in the diagram above.

Having data stored in video memory but never used won't work. So we assign a program to it—the program reads groups of information from video memory and forms the program's input. This is the vertex shader, and the input is called a vertex attribute. Based on the different data formats, the vertex shader defines different attributes and may also define attributes that the fragment shader might need as output.

The magic of the vertex shader lies in **coordinate transformations—rotation, scaling, translation, etc.—all completed at this stage**.

## Fragment Shader

The fragment shader can have two types of input: one is a uniform, and the other is output from the vertex shader, which is coordinate values. Its main function is to output color values.

Compared to the vertex shader, the fragment shader is where the magic happens—various filters and effects are all created here. For now, we just need to know that it calculates color values based on coordinates. The magic will be explored later.

## Shader Program

In the previous section, we said that shaders exist as subsystems. To complete the entire system's functionality, we need to connect these subsystems together. What completes this task is the shader program. What does this mean? It's like shaders being an office. Vertex shaders, geometry shaders, fragment shaders, and others all work in this office. When work comes in, it can only be handled through the window opened by the shader program. How the shader program specifically coordinates doesn't need to concern us. In other words, **the shader program's functionality is implemented by shaders, and shaders compose the shader program**.

## How OpenGL ES Draws

We laid out a lot of knowledge above, all just to be able to draw a triangle. But up to now, many readers may still be confused because I've been building the framework without touching on any details. There's no helping it—there are too many new concepts to cover at this stage. To avoid confusion, I need to place concepts in their proper positions first, then slowly unfold their details. To help readers connect the above material once more, let's look at how the above concepts connect from the perspective of the OpenGL ES drawing workflow.

1. Create a shader program to obtain the credential for accessing the shader office's service window
2. Create vertex and fragment shaders, write and associate source code
3. Use the credential obtained in step 2 to associate the two shaders from step 3 with the shader program
4. Use the credential obtained in step 2 to set up the vertex attributes it references and fill in the data
5. Draw

As you can see, the shader program plays the absolute leading role. As the interaction interface for data, shaders, and drawing, all operations revolve around it. Next, I'll use these conceptual models and the workflow above to dive deeper into more details. If you forget your position in the ocean of details, you can refer back to this section—I'm sure it can give you some hints.

## Preparation

Before starting the actual code implementation, I assume readers have read my previous article or understand EGL-related knowledge and can set up the EGL environment. Additionally, the project will follow the previous article's project with the following changes:

1. EGL-related code in a separate file
2. OpenGL ES in a separate file
3. Using OpenGL ES 3.0 API

In addition, we need to prepare some knowledge about OpenGL ES APIs.

OpenGL ES provides many APIs that help developers implement various high-performance, high-complexity features, but this may not be beginner-friendly. As beginners, we only need a limited number of APIs to verify our understanding and complete some simple effects. Therefore, I think it's necessary to categorize and summarize these APIs.

Although OpenGL ES APIs are C interfaces, conceptually they are configured by objects. In my view, these APIs can be divided into three categories: **object creation, configuration, and data transfer**, and most interfaces are used in this order. For example, OpenGL ES APIs can create various Buffers, and almost all Buffer usage flows are the same: **first create a Buffer, then bind the Buffer, and finally transfer data to the Buffer**.

Another pattern is: **if an interface doesn't pass a configuration object, then the configuration object refers to the last bound one**.

Alright, let's do this much preparation and begin for real.

## Creating a Shader Program

As the most important role in OpenGL ES APIs, the shader program object definitely needs an object to start working. Following the pattern I mentioned earlier—create, configure, transfer—we found the API specifically for creating shader programs—`glCreateProgram`. It returns an integer. If it equals `GL_NONE`, creation failed; otherwise, the integer represents a shader program object. All subsequent interfaces using the shader program can pass this value, which is the service window mentioned above. If it fails, you can use `glGetError` to check the error code and locate the problem. If everything goes well, we get an empty office waiting for business units to move in. Following the pattern, the second step should be configuration. The most important configuration work for the shader program is binding shaders, which are the specific business units.

In summary, the code for this step is very simple—just two lines:

```kotlin
val program = GLES30.glCreateProgram()
if (GLES30.GL_NONE == program) {
    return null
}
```

## Adding Shaders

Shaders are another new object, following the create, configure, transfer steps. But please stay alert: this is a sub-step of configuring the shader program. So we found the API for creating shaders—`glCreateShader(type:Int)`. You can see it has an additional type parameter because we have vertex shaders and fragment shaders. To create which type, pass the corresponding type. If creation succeeds, the return value also represents this shader object. With the object ready, next is the configuration step.

Since shaders exist to run code, their main configuration work is to associate the string blocks written in GLSL (OpenGL Shading Language) with the shader object and ensure it can work normally. So the first step is to use `glShaderSource(type:Int,source:String)` to associate the code, then use `glCompileShader` to check if the associated code has errors. If everything goes well, the shader's configuration work is complete.

Since the two shader types have completely consistent configuration processes except for different code and types, we can write the following method. By passing the type and code, we get the corresponding working shader object.

```kotlin
fun createShader(type: Int, source: String): Int? {
    val shader = GLES30.glCreateShader(
        when (type) {
            VERTEX -> GLES30.GL_VERTEX_SHADER
            FRAGMENT -> GLES30.GL_FRAGMENT_SHADER
            else -> return null
        }
    )
    if (GLES30.GL_NONE == shader) {
        log()
        return null
    }
    GLES30.glShaderSource(shader, source)
    GLES30.glCompileShader(shader)
    if (GLES30.GL_NO_ERROR != GLES30.glGetError()) {
        log()
        return null
    }
    return shader
}
```

After completing the shader sub-process, we continue configuring the shader program. Although shader objects have been created, they are scattered islands—nobody knows nobody, let alone working together. So we need to use the shader program to connect them together. Connecting involves two steps. The first step associates the shader program object with the shader object, so the shader program knows where the shaders are. This step uses `glAttachShader`. Note that we have two shader objects, so we call it twice. The second step associates the entire system objects together and checks if they can work together. Because shaders depend on each other, even if each shader works normally, if a shader's input and output don't match, the entire system won't work normally. The first step can only solve whether individual shaders are normal, and the second step determines whether the entire system is normal.

```kotlin
openGLES.use {
    GLES30.glAttachShader(it,vertexShader)
    GLES30.glAttachShader(it, fragmentShader)
    GLES30.glLinkProgram(it)
}
```

## Data and Drawing

After the previous two major configuration tasks, the office construction is finally complete. We have the office and the departments, but no work to do. To make them busy, we first need data, and data usually comes from RAM.

The way to transfer data is to assign values to the vertex attributes of the vertex shader. But how do we ensure the data is passed to the corresponding vertex attribute? Obviously we don't know, so we need a way to identify vertex attributes. OpenGL ES APIs use integer values to identify vertex attributes. To explain this method, we need to look at the vertex shader code we generated earlier:

```glsl
#version 300 es
layout (location = 0) in vec3 aPos;
void main(){
  gl_Position=vec4(aPos,1.0);
}
```

Setting aside other parts for now, let's look at the second line's `layout (location = 0)`. This syntax tells the shader program that when configuring the vertex attribute `aPos`, I will use its identifier `0` instead. Simply put, when calling the API, passing `0` to the vertex attribute variable means the data will be passed to the vertex attribute `aPos`. Like the line of code below:

```kotlin
GLES30.glEnableVertexAttribArray(0)
```

This line of code enables the vertex attribute to make it usable. Enable which one? The `0` vertex attribute. What does `0` represent? The `aPos` vertex attribute. Now that `aPos` is usable, how do we pass vertex data to it? This brings us to the most complex API so far. Let's look at how the example code is written:

```kotlin
GLES30.glVertexAttribPointer(0,3,GLES30.GL_FLOAT,false,0,buffer)
```

1. The first parameter is the simplest—it's the identifier of the vertex attribute mentioned earlier. In the example, `0` is passed, representing that data will be passed to the `aPos` vertex attribute.
2. The second parameter requires looking at the second line of code in the vertex shader: `layout (location = 0) in vec3 aPos;`. We've already understood the first part. `in` indicates this is an input variable. The key is `vec3`. `vec3` is a built-in GLSL type that can be divided into two parts: `vec` means the data type is `float`, and `3` means three elements. Combined, it represents a vector of three `float` values. The second parameter's meaning is the number of elements in the vertex attribute. So the answer is clear: `aPos` is a 3-vector type, with 3 elements.
3. The third parameter is actually closely related to the second parameter. The second is the vertex attribute element count, and the third is the vertex attribute element type. So the answer was revealed in the second parameter—it's `float` type. At this point, I realize the first three types only **describe the vertex attribute type**.
4. The fourth parameter decides whether to normalize the data, i.e., convert it to values in the [0,1] range. Our own data is already in the [0,1] range, so we don't convert.
5. The fifth parameter is also not easy to understand. Let's look at the example data first:

```plain
-0.5f, -0.5f, 1.0f,
0.0f, 0.5f, 1.0f,
0.5f, -0.5f, 1.0f
```

Since we want to draw a triangle, we need three points. Each point consists of `x`, `y`, `z`, so the example data has 9 values. If we want to add other data after each point, such as the color's `alpha` value, then each point changes from 3 values to 4 values. How do we ensure that in this case, the three points of the triangle are still the original values? This is the purpose of this parameter. This parameter tells the shader program **how to group the data passed to it**. Since the first three parameters have determined how much data to read for each attribute, when that much data has been read, subsequent data should logically be the start of another group's data. But actually this group of data isn't finished yet—there's a fourth `alpha` value. Its size needs to add 1 to the original vertex attribute data size. This is the meaning of this parameter—**in addition to the vertex data size, how many more values are needed to make a complete group**. The example passes `0` because each group of vertex data is exactly 3 values, with no extra values. If an `alpha` value is added, then when passing the parameter, this value should be `1`.

6. The last one is naturally the specific values. There are two points worth noting here: first, the `ByteBuffer` must be created with `allocateDirect`. Second, you need to call `order(ByteOrder.nativeOrder())` to set the byte order. Nothing else matters.

Finally, we've gotten through the hardest part. So far, the drawing program and drawing data are ready. We can finally draw a triangle. Drawing only needs one instruction: `GLES30.glDrawArrays(GLES30.GL_TRIANGLES,0,3)`. The most critical parameter of this API is the first one, which determines how to organize the points output by the vertex shader—whether to draw points one by one, or lines formed by these points, or triangles composed of three points. You can see the different effects with different parameters:

![GL_TRIANGLES](/images/posts/opengl-es-drawing-triangles/opengles-triangle.png) ![GL_LINE_LOOP](/images/posts/opengl-es-drawing-triangles/opengles-line-loop.png)![GL_POINTS](/images/posts/opengl-es-drawing-triangles/opengles-points.png)

The acceptable values include GL_POINTS, GL_LINE_STRIP, GL_LINE_LOOP, GL_LINES, GL_LINE_STRIP_ADJACENCY, GL_LINES_ADJACENCY, GL_TRIANGLE_STRIP, GL_TRIANGLE_FAN, GL_TRIANGLES, GL_TRIANGLE_STRIP_ADJACENCY, GL_TRIANGLES_ADJACENCY, GL_PATCHES. Those interested can study them slowly.

## Summary

OpenGL ES is more difficult than general development because you need to manage both programs and data. Programs and data complement each other—programs run based on data, and data determines how programs organize code.

Programs include shader programs and shaders. Shader programs are responsible for providing interfaces and managing shaders and data, while shaders are an important part of the entire system. They determine how the entire system operates. Vertex shaders are responsible for converting vertex attributes into coordinate information and outputs usable by fragment shaders. Fragment shaders are responsible for calculating color values. The calculation sources can use the output from vertex shaders or uniforms.

Data is another important topic. It can be regular vertex data, texture data stored in video memory, or even color values calculated by the previous system.

Whether for programs or data, OpenGL ES has rich APIs available. Still following the classification and order: create, configure, transfer. Create Buffer objects, shader objects, and shader program objects. Configure Buffer data, shader source code, and shader programs. Transfer vertex data, uniforms, texture data, etc. All need to be used according to different situations and scenarios.

That's all for today's sharing. As the old saying goes, "The mountains remain, the rivers flow on—see you in the next installment."

### Related Resources

[Project Source Code](https://github.com/zevarc/OpenGLES/releases/tag/triangle)

[Reference Documentation](https://registry.khronos.org/OpenGL-Refpages/es3.0/)