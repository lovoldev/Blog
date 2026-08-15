---
title: "How to use the find and xargs commands to process files"
description: "How to use find to filter files, and how to use xargs to perform further processing on the filtered files."
date: 2022-02-18
updated: 2022-02-18
tags: ["Linux","shell","Command line"]
draft: false
---

## Preface
In the beginning stages of a project, it is common to encounter various file operations, copying header files, libraries, batch renaming, and so on. Once the file structure is complex, this will be a boring job.

## Find the files
`find` searches for files in the directory structure, which is how it is described inside `man`. So how do you search? There are various ways, by file time, by size, by filename, by pathname, by file type, by permissions, by user. These methods can be combined with or without logic to accomplish more demanding searches, which is a boon to file searching.
Usually, the introduction of a command starts with a command, `find`, in the following format
```bash
find [-H] [-L] [-P] [-D debugopts] [-Olevel] [starting-point...] [expression]
```
[-H] [-L] [-P] [-D debugopts] [-Olevel] it doesn't matter.
[-H] [-L] [-P] it's for soft link, not commonly used.[-D debugopts]is to display additional information during the run, information that is too cluttered and mixed to be of much use.[-Olevel]On the other hand, it is used to optimize the lookup, and the default is sufficient, so there is no need to go deeper.
The biggest magic of `find` is in the `[expression]` at the end, and the following is an example of how this `[expression]` actually plays with, with the original file structure as follows
```bash
├── alice.h
├── andy
│   ├── jack
│   │   └── mary.h
│   ├── mark.cpp
│   ├── mark.h
│   └── pony.txt
├── andy.c
├── bill.cpp
├── bill.h
├── mark.h
└── mary
```
Now, I want to find the file named `andy`, what should I write the command. Intuition tells me it should be something like the following
```bash
find andy
```
But is the intuition right? Let's look at the output
```bash
andy
andy/mark.cpp
andy/jack
andy/jack/mary.h
andy/pony.txt
andy/mark.h
```
It only finds the `andy` directory, not even `andy.c`, so it seems that we need a way to tell `find` that we're looking for something that's a file, not a directory, and that option is `-type`.
The option `-type` takes a parameter immediately after `-type`, which is commonly taken as `d` for directories and `f` for files. Now we need to find files, so we should add the `-type f` option. But is that enough? If you execute the command, you'll see an error, because the `andy` at the end is considered to be a path, whereas we're looking for a filename. So, we need the help of another option, `-name`. `-name` can be followed by a specific name or a regular. Combining these two conditions, we arrive at the final command
```bash
find -type f -name "andy*"
```
Two things are worth noting here, first of all `-type` and `-name` are actually two separate options that can be used individually or in combination, and when used in combination, when they are not connected by an operator (`-o`(Or), `-a`(AND),`-not`), `-a` alone is used as a concatenation, which means that all the conditions are met before they appear back in the the final result. From this, a reverse lookup method can be extended that
```bash
find -type f -not -name "andy*"
```
This command will then find all files that do not start with `andy`.
```bash
./andy/mark.cpp
./andy/jack/mary.h
./andy/pony.txt
./andy/mark.h
./bill.h
./bill.cpp
./mark.h
./alice.h
```
Another point worth noting is that `"andy*"` is enclosed in double quotes because `*` is a special character, so it needs to be enclosed in double quotes; if there were no special characters, there would be no need for double quotes. Going back to the original command, why didn't the first command we took for granted find the target we were hoping for? Because `find` is a strict match, we only wrote `andy` and left out the suffix `.c`, which is the easiest place to make a mistake.
In fact, by this point, we've learned 50% of this command, so what's in the rest? Remember the main function of `find`, which mentions a directory structure? That's right, `find` can also control the scope of the search.

Here comes a new requirement, how to find all direct sub `.h` files in a certain directory? Here direct and child together means that the scope of the search can only be the current directory, not the subdirectories of the current directory. Before solving this problem, we need to know one thing - there are two kinds of interrelationships between two directories, brother or father and son. A brother directory has the same depth, while a parent-child directory has a depth difference of 1. Knowing this, let's look at the requirements - `.h` files are simple enough to be satisfied using `-name "*.h"`. However, this will find `.h` files in the `andy` directory, so we need something that controls the level of directory lookup, and they are `-mindepth`, `maxdepth`. These two parameters are not the same as the previous ones, they belong to `Global options`. What's meant by `Global options` is that they are global in their effect, and they always return `true`, which means that they are only considered in conjunction with other options. And, to emphasize their global nature, they must be written at the top of the command, otherwise a warning will be triggered. As below, they are written before `-name "*.h"`.
```bash
find -maxdepth 1 -name "*.h"
```
These two parameters are a bit counter-intuitive, can be understood in this way - up to where to find a maximum, there is a maximum, is `maxdepth`, the reverse is from where to start looking, is `mindepth`.

After talking about the directory structure, the name of these obvious parts, the file also has access (`access`) create (`create`), modify (`modiffy`) time, permissions (`permission`), the size (`size`) of these are not involved, and these can be used as a `find` find conditions, before you start, there are some small Before we get started, there are a few rules to do a quick grouping of these options - the options will start with the first letter of the attribute, such as

* Time-related options are `time` and `min`, which denote the `n` days and `n` minutes before an event occurs, respectively, where an event can be replaced by `a` (`access`) `c`create`, `m`modify`, which combine to make a complete option, e.g., `mmin n` would means to look for files that have been modified within `n` minutes.
* By analogy, `i` stands for case-sensitive, as in `iname`, `l` for `link` files.

Of course, these may not be used much, the actual use to check again may also be more convenient, but there are two very good options have to talk about.
Consider the following scenario, one day old Ben sent a bunch of user log files, let you give these users according to the frequency of use of grading, what should you do? First of all, we can use the size of the log file as a basis, according to the largest and smallest division of a good interval, such as (0-100M), and then set a good level (such as 5 levels) divided into intervals of each level (0-20, 20-40, ... ) , so that we run the command several times and get all the grading. The idea is wonderful, but does `find` provide that option yet? It provides `-size n`. Let's try to find files in the 0-20 range
```bash
find -size 20M
```
Enter, and you'll see that the results don't seem to be exactly right, it may have found some files that meet the conditions, but not some that do, so what's the problem? It turns out that the `n` in `-size n` is a strict match, that is, if you enter 20M, it will only find files that happen to be 20M, not 20M and 20M or so as we expect. So is there a solution, of course there is, is the number in front of the `+`, `-` sign, `+` means greater than or equal to the value, `-` means less than. So our command to find files under 20M should be
```bash
find -size -20M
```
Having resolved the issue of sign, there is also the issue of units which is worth noting, namely the `M` in `-20M`. Actually, the standard form of `-size` is `-size [+-]n[cwbkMG]`. `[+-]` and `n` are stated, and those that follow are units. They are listed in increasing order of size and are described as follows
- `c`: byte
- `w`: double byte, also known as `word`.
- `b`: block of 512 bytes, ***this is the default if the number `n` is not followed by units***
- `k`: 1024 bytes, also known as kb
- `M`: 1024 * 1024 bytes, i.e. Mb
- `c`: 1024 * 1024 * 1024 bytes, i.e. Gb
  
Having said that about units, let's move on to come out with a 20 - 40 grading, do we change 20 to 40 directly? Of course not, changing it to 40 finds files less than or equal to 40M, so we need an interval calibration method. `find` doesn't provide direct option support, but as I said before, the options are combinable, that is, we can reuse `-size` to identify an interval. That is, something like the following
```bash
find -size +20M -size -40M
```
According to this method, change the value many times, you can complete the task.
In fact, there is still a little mistake in the above scheme, that is, we did not find out the users who have not used it, that is, the size is 0, then change the number to 0, can we? The answer is yes, but if we want to find empty directories instead of empty files, `-size` can't solve the problem, because usually the size of empty directories is not 0. So, `find` provides an option `-empty` to detect whether a file is empty, which can not only find empty files, but also empty directories. In our example, using ` find -size 0` finds the following results
```bash
./andy/mark.cpp
./andy/jack/mary.h
./andy/pony.txt
./andy/mark.h
./andy.c
./alice.h
```
The empty directory `mary` was not found. Instead, a search using `find -empty` resulted in the following
```bash
./mary
./andy/mark.cpp
./andy/jack/mary.h
./andy/pony.txt
./andy/mark.h
./andy.c
./alice.h
```
Not only was the `mary` empty directory found, but other empty files were found as well.
At this point, `find` related things have been understood almost. However, in many cases, just finding is not enough to satisfy our needs, we may need to copy the found files to other places or delete them, can we combine these operations? That's where our `xargs` comes in.

## xargs
`xargs` has one simple function: it reads content from standard input, builds a command, and executes it. How should we understand this? Suppose we are running the `find` command. Running `find` always involves a process with some logic. According to certain logic and rules, `find` evaluates files one by one; if a file satisfies the conditions, it outputs the result. As the command runs, the results may keep growing. What if we need to execute a command for every result produced? The conventional approach would be to save the results and then write a script that reads each record and executes the corresponding action. But with `xargs`, we don't need to go to that trouble—we can do it in one step. We use a pipe to connect the output to `xargs` on the terminal. Each time `xargs` receives a piece of information, it uses that information as an argument to build a command, just as if we had typed the command manually, and after building it, the command is executed automatically. The end result is that for every output produced, a command using that output as an argument is generated and executed automatically. In short, this achieves multiple functions with a single command.

## Combining find with xargs
Now that we are challenged to upgrade, there is a requirement to extract all the header files in a directory to another directory. This requirement can be divided into two parts, one part is to find the header files, which can be done with the `find` command. The other part is to copy the found header files, which requires the involvement of xargs.

The first step is to find the header file. A header file is a file ending in `.h` (ignoring `.hpp` for the moment), and this suffix appears in the name, so we can use the `-name "*. h"` option, and in order to avoid interference with certain directory names, we will qualify the type as well `-type f` to look for files only. This completes the first step.
The second step is to copy the file. The standard way to copy a file is as follows
```bash
cp [OPTION]... SOURCE... DIRECTORY
```
According to the format of this command, we need to determine a few parameters, the source file is of course the file we find, which will be left aside for now. The destination folder is where we copy to, so let's just create a new `test` directory for now, and the destination folder is `test`. Is that the end of the story? Header files often need to form a dependency path with their parent directory, so it's not a good idea to copy all the header files directly into the `test` directory, as this will mess up the header file dependencies, and we'll have to copy the parent directory associated with the header file. As it happens, `cp` provides the option `-parents` - which copies the completion filenames of the source files, i.e. the containing directories. So the crux of the matter comes down to the source file parameter.


