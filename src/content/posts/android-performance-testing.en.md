---
title: "Performance Testing Guide for Android Audio-Video Applications"
description: "A practical guide to performance testing Android audio-video applications — measuring CPU, GPU, memory, bitrate, frame rate, temperature, and power consumption with adb and Snapdragon Profiler.webp"
date: 2024-11-24
updated: 2024-11-24
tags: ["Android","Performance Testing","ADB","Python"]
draft: false
---

With the development of the Android platform, the scale of Android applications is getting larger and more diverse.webp To ensure the quality of applications, the role of performance testing has become increasingly prominent.webp During the process of performance testing, we find that different types of applications have varying focuses, so it is necessary to formulate appropriate metrics based on the application type.webp Meanwhile, performance testing tools are also evolving constantly, and many performance testing tools have become outdated by 2024.webp Therefore, this article will discuss the performance testing metrics for audio-video applications in combination with actual projects, and provide some recommendations for performance testing tools.webp
## Performance Testing Metrics
The principle of selecting performance testing metrics is: referring to core business, focusing on aspects that significantly impact user perception, and aspects that do not strongly affect users can be appropriately ignored.webp The primary business of audio-video applications is audio-video processing, which requires handling large amounts of data, consuming substantial CPU and GPU time, and occupying a lot of memory.webp Continuous high-load operation of the CPU and GPU can lead to increased heat generation and higher power consumption.webp Therefore, the performance metrics for audio-video applications become clear.webp
1.webp CPU Utilization Rate
2.webp GPU Utilization Rate
3.webp Memory Utilization Rate
4.webp Bitrate and Frame Rate
5.webp Temperature Changes
6.webp Power Consumption
Having established the metrics, the next major task is to obtain these metric data.webp There are many ways to acquire data, broadly divided into in-app acquisition and out-of-app acquisition.webp In-app acquisition is more direct but can affect the application itself during the process of obtaining data, impacting the metric results.webp Therefore, in most cases, out-of-app acquisition methods are adopted.webp The most important tool for out-of-app acquisition is ADB.webp

## ADB
As its name suggests, adb serves as a bridge between PC and Android devices, being an extremely important tool in Android development.webp We need it not only during the development process but also for performance testing.webp Through this medium, we can use many tools on the Android platform, such as the star of this issue's performance testing—`dumpsys`.webp `Dumpsys` can obtain a lot of information from system services.webp We will introduce these services one by one and provide corresponding Python scripts to parse the service data, saving the parsed data in `.csv` files.webp

## Preparations
After laying the groundwork, we have clarified the tasks ahead, but before formally starting, let's summarize what preparations need to be made:
* Test Device - Running the test application
* PC - Running Python scripts
* ADB - Obtaining data from the phone on the PC
* Python - Parsing data
### Connecting Test Device and PC
Many people may wonder, isn't it enough to simply plug the phone into the PC with a data cable and configure the adb environment variables? Isn't there anything worth elaborating on? Actually, there is.webp Directly connecting via a data cable, although simple and quick, has a significant impact on performance testing.webp Firstly, it does not allow for obtaining power consumption data.webp Secondly, due to the charging state, the frequency of the CPU and GPU may differ greatly from when using the battery, making the entire set of test data unreliable.webp Therefore, wireless connection methods need to be used.webp There are two options for wireless connections.webp One is the wireless debugging feature available on Android 11 and above.webp I found this feature unstable and it has system limitations, so I use the second method.webp The second method involves using the ADB WiFi plugin, which can be downloaded and installed directly from the plugin market.webp The following is its detail page.webp
![adb Wi-Fi](/images/posts/android-performance-testing/adb-wifi.webp "ADB Wi-Fi")
This plugin needs to be connected once with a data cable upon first use, and after clicking the Wi-Fi icon on the right side of the screen, the page will display as follows:
![adb Wi-Fi no device connect](/images/posts/android-performance-testing/adb-wifi-no-device-connected.webp "ADB Wi-Fi no device connected")
It will show two devices, one with a signal icon representing a wired connection, and one with a Wi-Fi icon representing a wireless connection.webp Now click the connect button to the right of the device with the Wi-Fi icon to start the connection.webp After the connection is complete, the page status will change to Disconnect, as shown below:
![adb Wi-Fi connnected a device](/images/posts/android-performance-testing/adb-wifi-connected-a-device.webp "adb Wi-Fi connnected a device")
At this point, it means the device connection has been successful.webp Remove the data cable and run the `adb devices` command again, which will display the connected device.webp The result is similar to the following image:
![adb devices command](/images/posts/android-performance-testing/adb-devices-command.webp "adb devices command")
This indicates that adb preparation is complete.webp
### Preparation of Python Scripts
Since each metric is obtained through an adb command, the result will also be echoed back by adb, and executing a command once yields a metric data.webp These are fixed and repetitive tasks that can be placed in a script, so let's analyze the structure of the script first.webp To clarify the script's task, let's first analyze the scenario—at a certain moment during the test, the script needs to execute an adb command, read the output after the command execution, then parse the output, and finally save the parsed result in a csv file.webp
This process involves several variable elements:
1.webp Command.webp Different metrics naturally require different commands.webp
2.webp Output.webp The output result may consist of many lines or just one number.webp
3.webp Parsing.webp Due to different results, the method of obtaining valid metric data naturally varies.webp
There are also several fixed elements:
Command Execution
1.webp Output Reading
2.webp Result Parsing
3.webp Saving Parsing Results
Based on the decomposition of these variable and invariant tasks, we can break down the task into multiple steps and implement them through inheritance and overriding.webp
```python
class Record:
    def __init__(self,file,cmd):
        self.file=file  # csv file name
        self.cmd=cmd    # adb command

    def write_title(self):
        origin=self.title()
        header=('Timestamp',*origin)    # table header
        self.write([header],'w')

    def execute(self):
        # execute adb command and fetch result
        records=self.fetch()
        if records:
            self.write(records)

    def write(self, rows,mode='a'):
        # write data to csv file
        with open(self.file, mode=mode, newline='') as file:
            writer = csv.writer(file)
            writer.writerows(rows)

    def fetch(self):
        # fetch data from adb
        lines = self.adb()
        result=self.compose(lines)
        return ([datetime.now().strftime("%Y-%m-%d %H:%M:%S"),*line] for line in result)
        
    def compose(self,lines):
        # compose data
        for line in lines:
            c=self.convert(line)
            if c:
                yield c

    def title(self):
        # csv header
        return []

    def adb(self,cmd=None):
        # execute adb command
        result = subprocess.run((cmd if cmd else self.cmd).split(), capture_output=True, text=True,encoding='utf-8')
        result=result.stdout.strip()
        return result.splitlines()

    def convert(self,line):
        # convert line to csv row
        return [line]
```
`Record` is an abstract class that defines the workflow of the script, including command execution, result reading, and parsing.webp It also defines several abstract methods for subclasses to implement.webp Special attention should be paid to the `execute` method, which defines the entire work process, combining steps such as command execution, result reading, and parsing.webp Another method to focus on is `title` and `convert`, both of which are generic implementations that need to be overridden by subclasses.webp
## CPU Utilization Rate
The easiest and most convenient metric to obtain is CPU utilization rate, which can be acquired using the `top` command or the `dumpsys cpuinfo` command.webp The `top` command provides more intuitive data, so it will be used here to illustrate.webp However, if the `adb shell top` command is run directly, the command will keep running, refreshing data every second until manually stopped.webp When running the script, we hope that it refreshes once and then exits immediately, so we need to check its help documentation.webp The help documentation is as follows:
```shell
Toybox 0.8.9-android multicall binary (see toybox --help)

usage: top [-Hhbq] [-k FIELD,] [-o FIELD,] [-s SORT] [-n NUMBER] [-m LINES] [-d SECONDS] [-p PID,] [-u USER,]

Show process activity in real time.webp

-H	Show threads
-h	Usage graphs instead of text
-k	Fallback sort FIELDS (default -S,-%CPU,-ETIME,-PID)
-o	Show FIELDS (def PID,USER,PR,NI,VIRT,RES,SHR,S,%CPU,%MEM,TIME+,CMDLINE)
-O	Add FIELDS (replacing PR,NI,VIRT,RES,SHR,S from default)
-s	Sort by field number (1-X, default 9)
-b	Batch mode (no tty)
-d	Delay SECONDS between each cycle (default 3)
-m	Maximum number of tasks to show
-n	Exit after NUMBER iterations
-p	Show these PIDs
-u	Show these USERs
-q	Quiet (no header lines)

Cursor UP/DOWN or LEFT/RIGHT to move list, SHIFT LEFT/RIGHT to change sort,
space to force update, R to reverse sort, Q to exit.webp
```
It provides the `-n` parameter, under which the command will exit after cycling `n` times.webp So, we only need to set this parameter to 1 to get data once and then exit immediately, thus the final command is determined to be `adb shell top -n 1`.webp
With the command in hand, let's look at the output.webp The output is relatively straightforward; since the content includes a header, we only need to find the appropriate column according to the header and then obtain the value of that column.webp Noticing a `[%cpu]` column in the header, it clearly represents CPU utilization rate.webp But which line is the percentage occupied by the test application? By observing the output values, we find that the value of the `args` parameter is very suitable for differentiation—it is the application's package name.webp So, by finding the line corresponding to the test application through `args` and reading the value of the `[%cpu]` column, we can obtain the application's occupancy percentage.webp 
Talking about all this is not because the problem is particularly difficult, but rather to demonstrate the thought process through specific examples.webp Many subsequent metrics are obtained through similar methods, involving the same analytical steps: ***first, find the appropriate command, then add appropriate limiting parameters through the command's help documentation, execute the command, observe the command output, and then locate the correct line according to the output results to find the final value.*** With the command and output data in hand, we can refine the script.webp
```python
class CPURecord(Record):
    
    def __init__(self,file):
        super().__init__(file,'adb shell top -n 1 | grep com.xxx') #xxx represent package name

    def title(self):
        return ["CPU Usage (%)"]    # csv header

    def convert(self,line):
        parts = line.split()
        try:
            cpu_usage = float(parts[8].replace('%', ''))
            return [cpu_usage]
        except (ValueError, IndexError):
            return None
```
`CPURecord` overrides two methods, the corresponding explanations have already been mentioned above.webp

## GPU Utilization Rate
For GPU utilization rate, many articles online suggest using the `adb shell dumpsys gfxinfo xxx` command to obtain it, but this command cannot actually retrieve the GPU utilization rate; it can only get GPU frame information.webp So we need to use other methods.webp After much searching and experimentation, I found no suitable commands, but discovered a useful tool called [snapdragon profiler](https://www.qualcomm.com/developer/software/snapdragon-profiler).webp
### Using Snapdragon Profiler
Snapdragon Profiler can not only obtain CPU, GPU, and various other information but also offers rich configuration options to meet the data acquisition needs of many metrics.webp However, note that some configuration items vary depending on the system version of the currently connected device.webp For example, in my testing, GPU Busy was not available on Android 9, whereas it was fully displayed on Android 14.webp In this example, we only want to obtain the GPU utilization rate, i.e., GPU Busy.webp 
Open Snapdragon Profiler, where many configurations are grayed out; you need to connect a device first.webp
![Snapdragon profiler no device connect](/images/posts/android-performance-testing/snapdragon-profiler-no-device-connect.webp "Snapdragon profiler no device connect")
Click "Start a Session"
If an Android device is connected at this point, it will display the following interface:
![Snapdragon profiler device avaliable](/images/posts/android-performance-testing/snapdragon-profiler-device-avaliable.webp "Snapdragon profiler device avaliable")
Click "Connect" to start the connection
![Snapdragon profiler connect device](/images/posts/android-performance-testing/snapdragon-profiler-connect-device.webp "Snapdragon profiler connect device")
Wait a few seconds, and if everything goes smoothly, the three options below will become available:
![Snapdragon profiler avaliable options](/images/posts/android-performance-testing/snapdragon-profiler-avaliable-options.webp "Snapdragon profiler avaliable options")
Select the second option "Real-time performance analysis," enter the package name in the filter box to select the target application
![Snapdragon profiler realtime performance analysis](/images/posts/android-performance-testing/snapdragon-profiler-realtime-performance-analysis.webp "Snapdragon profiler realtime performance analysis")
Then double-click the corresponding GPU Busy metric in the box below
![Snapdragon profiler filter](/images/posts/android-performance-testing/snapdragon-profiler-filter.webp "Snapdragon profiler filter")
The GPU utilization rate of the current application will be plotted in real-time in the upper right corner of the page.webp
![Snapdragon profiler gpu busy](/images/posts/android-performance-testing/snapdragon-profiler-gpu-busy.webp "Snapdragon profiler gpu busy")
If you need to export data, click the following button:
![Snapdragon profiler export](/images/posts/android-performance-testing/snapdragon-profiler-export.webp "Snapdragon profiler export")
Then export it as a csv file, which can be used directly, or you can re-parse it with Python.webp
## Memory Utilization Rate
For memory utilization rate, the corresponding command is `adb shell dumpsys meminfo com.xxx` to obtain it.webp Since the application package name is specified directly at the end of the command, the output information pertains only to the designated application, eliminating the need for further filtering.webp Here is a small tip regarding the `adb shell dumpsys` command: ***if the application package name is specified at the end of the command, the data will be limited to the specified application.***
 The output of this command directly includes a "TOTAL" row, so we only need to read this row and parse it according to the format.webp Note that the output may vary slightly across different devices, requiring adjustments to the parsing.webp
 ```python
class MemoryRecord(Record):

    def __init__(self,file):
        super().__init__(file,'adb shell dumpsys meminfo com.xxx')

    def title(self):
        return ["Memory Total (MB)"]

    def convert(self,line):
        if "TOTAL" in line:
            contents=line.split()
            try:
                memory_total = int(contents[1]) / 1024  # MB
                return [memory_total]
            except (ValueError):
                return None
        return None
```
## Bitrate and Frame Rate
Since the application being tested is an audio-video application, bitrate and frame rate are key metrics.webp However, this data is internal to the application, making it difficult to obtain accurately through external tools.webp Or, if obtained, the data may not be precise enough.webp Therefore, a new method is adopted here: collecting data within the application and then sending it out through some method.webp At the time, I considered methods such as logging data to a file within the application or logging it.webp Concerned that logging might impact CPU and content testing within the application, I ultimately chose logging.webp
Logging involves adding a logging module to the application and printing collected data through logs.webp Finally, the effective results are obtained by parsing the logs through the `adb logcat` command and saving them in a csv file.webp 

Through practical testing, this method is feasible, but proper data filtering is necessary to avoid data repetition or loss.webp Here, I chose the `-T` parameter for data filtering, which specifies that the output data is after a certain time.webp
```python
class FPSRecord(Record):

    def __init__(self,file):
        super().__init__(file,'')
        self.pat=r'Frame reports\((.+)\)\:Frames received = (\d+),Frames lost = (\d+),Frame render = (\d+)'

    def title(self):
        return ["User","Received fps","Render fps"]

    def execute(self):
        self.format_cmd()
        return super().execute()

    def convert(self,line):
        match=re.search(self.pat,line)
        if match:
            return (match.group(1),match.group(2),match.group(4))
        return None

    def format_cmd(self):
        self.cmd='adb logcat -T {} -d tag:V *:S'.format(time.time())
        print(self.cmd)
```
Here, only FPSRecord is listed, and others are similar.webp
## Temperature Changes
In the Android system, the temperature range is extensive, including CPU temperature, camera temperature, screen temperature, case temperature, battery temperature, and temperatures from various sensors.webp Some can be read through commands, while others cannot.webp Of course, more scientific and accurate data may require instruments.webp Here, I only explored the temperatures that can be obtained through commands.webp 
In the Android system, components that generate heat record their data under the `/sys/class/thermal/` directory, prefixed with `thermal_zone`.webp Each directory contains two files: `type` records the name of the heat source, and `temp` records the temperature value.webp To record all heat source data, the directory can be traversed using `ls`.webp During each command execution, these directories and files are read sequentially, and the names and temperature values are saved together to get the final temperature data.webp
```python
class TemperatureRecord(Record):

    def __init__(self,file):
        zones=self.adb("adb shell ls /sys/class/thermal/")
        zones=[temp for temp in zones if temp.startswith("thermal_zone")]
        temps_types=["cat /sys/class/thermal/{}/type".format(temp) for temp in zones]
        temps_values=["cat /sys/class/thermal/{}/temp".format(temp) for temp in zones]
        types=';'.join(temps_types)
        values=';'.join(temps_values)
        cmd_types="adb shell {}".format(types)
        cmd_value="adb shell {}".format(values)

        super().__init__(file,cmd_value)
        self.cmd_title=cmd_types
        self.zones=zones

    def title(self):
        types=self.adb(self.cmd_title)
        return [f"{zone} ({t})" for zone,t in zip(self.zones,types)]
    
    def compose(self,lines):
        yield (int(temp) / 1000 for temp in lines)
```
## Power Consumption
Power consumption can be obtained using the command `adb shell dumpsys battery`.webp The analysis and processing procedures are similar to those previously described, so they are not repeated here.webp Instead, the script is provided directly.webp
```python
class BatteryRecord(Record):

    def __init__(self,file):
        super().__init__(file,'adb shell dumpsys battery')

    def title(self):
        return ["Battery Level (%)"]

    def convert(self,line):
        if "level" in line:
            battery_level = int(line.split(':')[1].strip())
            return [battery_level]
        return None
```
## Integrating Everything
Now that we have defined all the required metric data, they need to be integrated for easier use.webp Ideally, running the script once should execute each metric at regular intervals until a certain condition triggers the script to stop.webp Therefore, a condition is needed that keeps the script running while the application is running.webp

### Determining if the Application Has Exited
In Android, the Activity component is the only one capable of direct interaction with users, so determining whether the application has exited means checking if the Activity has exited.webp Conveniently, `dumpsys` has an `activity` command.webp By specifying the package name and examining the output, we can determine if the corresponding Activity exists to judge whether the application has exited.webp The determination method is as follows:
```python
def can_be_continue(self):
        lines=self.adb('adb shell dumpsys activity -p "{}" r'.format(PACKAGE))
        for l in lines:
            if "Activities" in l and PACKAGE in l:
                return True
        return False
```
### Determining if the Application is in the Foreground
Determining if the application is in the foreground is similar.webp While Activities can be used, finding a suitable judgment condition is challenging.webp Alternatively, windows can be used, as they are similar to Activities.webp By using the `dumpsys window` command, window information can be obtained.webp Filtering the focused window (`mFocusedApp`) and comparing the package name can determine if the application is in the foreground.webp
```python
lines=self.adb('adb shell dumpsys window d')
        for l in lines:
            if 'mFocusedApp' in l:
                return PACKAGE in l
        return False
```
### Multithreaded Execution
The loop condition is identified, but testing revealed that some commands take longer to execute.webp To collect data within a short period, the execution of each metric command should be placed in separate threads.webp To ensure that each command executes at nearly equal intervals, the time taken to execute the command should be measured, and an appropriate sleep duration selected based on the interval.webp Thus, the entire script is tied together.webp
```python
def run(record):
    while record.can_be_continue():
        before=time.time_ns()
        record.execute()
        usage=time.time_ns()-before
        if usage>=S_UNIT:
            continue
        else:
            time.sleep(1-usage/S_UNIT)

def main():
    records=[MemoryRecord("memory_stats.csv"),CPURecord('cpu_stats.csv'),FPSRecord('fps_stats.csv'),NetworkRecord('network_stats.csv'),BatteryRecord('battery_stats.csv'),TemperatureRecord('temperature_stats.csv')]

    #init 
    for record in records:
        record.write_title()

    threads=[]
    for record in records:
        thread=Thread(target=run,args=(record,))
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()
```
## Summary
Performance testing involves many metrics, and different metrics require different handling methods.webp CPU, memory, and battery data can be directly obtained using `dumpsys` commands.webp However, for GPU data, I haven't found a suitable command yet, and the current more comprehensive solution is to use third-party tools like Snapdragon Profiler, although this tool also has limitations for lower system versions.webp Python is an excellent choice for processing this data, offering powerful string manipulation and regular expression tools, as well as asynchronous capabilities, making it a great helper for performance testing.webp

## References
1.webp [dumpsys](https://developer.android.com/tools/dumpsys)
2.webp [snapdragon profiler](https://www.qualcomm.com/developer/software/snapdragon-profiler)
3.webp [script](https://github.com/zevarc/RealtimePerformanceTest.git)
