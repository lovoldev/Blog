---
title: "Android音视频应用性能测试指南"
description: "Android音视频应用性能测试的实战指南：使用adb和Snapdragon Profiler测量CPU、GPU、内存、比特率、帧率、温度与耗电量。"
date: 2024-11-24
updated: 2024-11-24
tags: ["Android","性能测试","ADB","Python","音视频"]
draft: false
---

随着Android平台的发展，Android应用规模越来越大，类型也越来越多，为了保证应用的质量，性能测试的作用愈加凸显。在进行性能测试的过程中，我们会发现不同类型的应用关注点不尽一致，因此需要针对应用类型制定合适的指标。同时性能测试工具也在不断进化，很多性能测试工具在2024年已经过时。所以本篇将结合项目实际，聊一聊音视频应用的性能测试指标，并给出一些性能测试的工具推荐。
## 性能测试指标
性能测试指标选择的原则是：以核心业务为参照，着重关注用户感知明显的部分，用户感知不强的部分则可以适当忽略。音频频应用的主要业务就是音视频处理，需要处理大量的数据，处理大量数据需要占用大量CPU和GPU的时间，占用大量内存。CPU和GPU一直以高负荷的状态工作，则会导致发热量增大，增加电量消耗。所以，音视频应用的性能指标就很明朗了。
1. CPU占用率
2. GPU占用率
3. 内存占用率
4. 比特率和帧率
5. 温度变化
6. 耗电量
有了指标，接下来的主要任务就是获取这些指标数据。获取数据的方式有很多，大体可以分为应用内获取和应用外获取。应用内获取会比较直观，但是获取这些数据的过程中会影响到应用本身，影响指标数据。所以绝大部分情况下是采用应用外获取的方式。应用外获取最重要的工具就是ADB。
## ADB
adb正如它名字蕴含的意义一样，它是PC和Android设备之间沟通的桥梁，是Android开发中极为重要的工具。我们不仅开发过程中需要用到它，性能测试更是少不了。通过它这个媒介，我们得以使用很多Android平台的工具，如本期性能测试的主角——`dumpsys`。`dumpsys`可以获取系统服务的很多信息。接下来我们将逐一介绍这些服务，并提供相应的Python脚本来解析这些服务数据，并将解析得到的数据保存在.`csv`文件中。
## 准备工作
通过前面的铺垫，我们明确了接下来要做的工作，但是在正式开始之前，我们先来总结一下需要做哪些准备：
* 测试机-运行测试应用
* PC-运行Python脚本
* ADB-在PC上获取手机上的数据
* Python-解析数据
### 连接测试机和PC
很多人会疑问，我直接数据线插在手机上，配置好adb环境变量不就完成了吗，这有啥好展开说的。其实还真有，直接数据线连接，这种方式虽然简单快速，但是对于性能测试影响很大。首先是它无法得到电量消耗的数据。其次由于在充电状态，CPU和GPU的频率可能和使用电池时的频率差别很大，导致整个测试数据不可靠，所以需要采用无线连接的方式。
无线连接也有两种方式可以选择。一种是Android11及以上的无线调试功能，这个功能我用着不是很稳定，况且对系统有限制，所以我使用第二种方法。第二种方法则是使用ADB WI-FI这个插件，可以直接在插件市场下载安装。下图就是它的详情图。
![adb Wi-Fi](/images/posts/android-performance-testing/adb-wifi.png "ADB Wi-Fi")
这个插件第一次使用需要先用数据线连接成功一次，点击屏幕右侧的Wi-Fi图标后页面会显示如下
![adb Wi-Fi no device connect](/images/posts/android-performance-testing/adb-wifi-no-device-connected.png "ADB Wi-Fi no device connected")
它会显示两个设备，一个显示信号图标代表有线连接，一个显示Wi-Fi图标，代表无线连接。现在需要点击带有Wi-Fi图标设备右侧对应的connect按钮，开始连接。连接完成后，页面状态会变成Disconnect,显示如下
![adb Wi-Fi connnected a device](/images/posts/android-performance-testing/adb-wifi-connected-a-device.png "adb Wi-Fi connnected a device")
这时候就代表设备连接成功了。移除数据线，再次运行`adb devices`命令，会显示已经连接的设备。结果类似于下图这种
![adb devices command](/images/posts/android-performance-testing/adb-devices-command.png "adb devices command")
这种就代表adb准备完成了。
### Python脚本准备
由于每个指标都是通过adb命令获取的，结果也会通过adb回显，执行一次命令得到一个指标数据。这些都是固定且重复的工作，可以将它们放到脚本中，我们先来分析一下脚本的结构。
为了明确脚本任务，我们先来分析场景——在测试的某一时刻，脚本需要执行一个adb命令，命令执行完成后，读取输出，然后解析输出，最后将解析结果保存在csv文件中。
这个过程有以下几个可变的内容：
1. 命令。指标不同，命令自然也不同
2. 输出。输出结果可能有很多行，也可能只有一个数
3. 解析。由于结果不同，获取指标有效数据的方法自然也不同
以下几个是固定的内容
1. 命令执行
2. 输出结果读取
3. 解析结果保存
根据对这几个可变和不可变任务的分解，我们可以将任务分解为多个步骤，然后通过继承和重写实现。
```python
class Record:
    def __init__(self,file,cmd):
        self.file=file  # csv file name
        self.cmd=cmd    # adb command

    def write_title(self):
        origin=self.title()
        header=('Timestamp',*origin)    #table header
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
`Record`是个抽象类，它定义了脚本的流程，包括命令执行、结果读取、结果解析等。它还定义了几个抽象方法，供子类实现。着重需要关注的是`execute`方法，它定义了整个工作流程，组合了命令执行、结果读取、结果解析等步骤。另一个则是`title`和`convert`方法，它们都是通用实现，需要子类重写。
## CPU占用率
最容易也最方便获取的指标就是CPU占用率，可以使用`top`命令或者`dumpsys cpuinfo`命令。`top`命令给出的数据比较直观，所以使用它来说明。
但是如果直接运行`adb shell top`命令，则命令会一直运行，过一秒刷新一次数据，直到手动停止。在运行脚本的时候，我们希望它刷新一次后马上退出，所以，需要查看一下它的帮助文档。帮助文档输出如下：
```shell
Toybox 0.8.9-android multicall binary (see toybox --help)

usage: top [-Hhbq] [-k FIELD,] [-o FIELD,] [-s SORT] [-n NUMBER] [-m LINES] [-d SECONDS] [-p PID,] [-u USER,]

Show process activity in real time.

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
space to force update, R to reverse sort, Q to exit.
```
可以看到它提供了`-n`参数，命令将在循环`n`次数后退出。所以，我们只需要设置这个参数为1，就可以获取一次数据后马上退出，由此最终的命令就确定了——`adb shell top -n 1`。

得到了命令，再来看看输出。输出其实比较直观，由于输出内容中有表头，我们只需要根据表头找到合适的列，然后获取列的值。注意到表头中有个`[%cpu]`的列，所以它很显然就代表CPU占用率。但是哪一行才是测试应用占用的百分比呢？通过观察输出值，我们发现`args`参数的值很适合用来区分——它的值是应用的包名。所以，通过`args`查找到测试应用到行后，在读取`[%cpu]`列的值，就可以获取到应用占用的百分比。
啰嗦了这么多，并不是说这个问题有多难，只是想通过具体的例子展示思考的过程。因为后面的很多指标都是通过类似的方法，经过相同的步骤分析出来的。***首先找到合适的命令，然后通过命令的帮助文档添加合适的限定参数，执行命令，观察命令输出，然后根据输出结果，定位到合适的行，找到最终的值。***
有了命令和输出数据，就可以完善脚本了
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
`CPURecord`重写了两个方法，相应的说明已经在上面的内容提过了。
## GPU占用率
GPU占用率，网上很多文章都是说通过`adb shell dumpsys gfxinfo xxx`命令获取，但是这个命令在并不能获取到GPU占用率，只能获取到GPU的帧信息。所以我们要使用其他方法。几经搜索尝试。发现并没有合适的命令，却有个好用的工具[snapdragon profiler](https://www.qualcomm.com/developer/software/snapdragon-profiler)
### Snapdragon Profiler 使用
Snapdragon Profiler不仅能获取到CPU，GPU等多种信息，还有着丰富的配置选项，可以满足很多指标数据的获取。但是需要注意的是，有些配置项会随着当前所连接的设备的系统版本的不同而不同。如在我的测试中，Android 9就没有GPU Busy这一项，而Android 14的系统是显示完整的。
本次示例中只要获取GPU的占用率，也就是GPU Busy这个
打开Snapdragon Profiler，很多配置都是灰色的，需要首先连接设备。
![Snapdragon profiler no device connect](/images/posts/android-performance-testing/snapdragon-profiler-no-device-connect.png "Snapdragon profiler no device connect")
点击`Start a Session`，如果此时连着Android设备，则会显示如下界面
![Snapdragon profiler device avaliable](/images/posts/android-performance-testing/snapdragon-profiler-device-avaliable.png "Snapdragon profiler device avaliable")
点击`Connect`开始连接
![Snapdragon profiler connect device](/images/posts/android-performance-testing/snapdragon-profiler-connect-device.png "Snapdragon profiler connect device")
等待几秒钟，如果一切顺利，下面三个选项则会变为可用
![Snapdragon profiler avaliable options](/images/posts/android-performance-testing/snapdragon-profiler-avaliable-options.png "Snapdragon profiler avaliable options")
选择第二项Realtime performance analysis,在筛选框中输入包名来选取目标应用
![Snapdragon profiler realtime performance analysis](/images/posts/android-performance-testing/snapdragon-profiler-realtime-performance-analysis.png "Snapdragon profiler realtime performance analysis")
然后在下面的框中双击对应的GPU Busy指标
![Snapdragon profiler filter](/images/posts/android-performance-testing/snapdragon-profiler-filter.png "Snapdragon profiler filter")
页面的右上方就会实时绘制出当前应用的GPU占用率。
![Snapdragon profiler gpu busy](/images/posts/android-performance-testing/snapdragon-profiler-gpu-busy.png "Snapdragon profiler gpu busy")
如果需要导出数据，则点击如下的按钮
![Snapdragon profiler export](/images/posts/android-performance-testing/snapdragon-profiler-export.png "Snapdragon profiler export")
然后导出为csv文件，可以直接使用里面的数据，也可用Python再做一次解析。

## 内存占用率
内存占用率，对应的命令`adb shell dumpsys meminfo com.xxx`命令获取。由于直接通过命令指定来应用包名，所以输出信息只是关于指定应用的，不需要再筛选。在此有个关于`adb shell dumpsys`命令的小技巧，***如果命令最后指定一个应用包名就可以将数据限定在指定的应用内。***
这个命令的输出直接包含TOTAL这一行，所以只需要读取这一行，然后根据格式解析即可。需要注意的是，不同的设备输出会有细微差别，针对输出再做调整即可。

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
                memory_total = int(contents[1]) / 1024  # 转换为MB
                return [memory_total]
            except (ValueError):
                return None
        return None
```
## 比特率和帧率
由于要测试的是音视频应用，所以比特率和帧率是重点。但是这些数据都是应用内数据，通过外部工具很难获取，或者获取的数据不够准确。所以这里采用一种新的方式，在应用内收集数据，再通过某种方式将数据发送出来。当时我想到的方法有应用内文件记录和日志打印。由于担心日志记录的方式对应用中CPU和内容测试有影响，所以最终选择了日志打印的方式。日志打印的方式，在应用中添加一个日志打印模块，然后将收集到的数据通过日志打印出来，最后通过adb logcat命令获取日志，然后解析日志，将有效的结果保存在csv文件中。
通过实测，这种方式是可行的，但是要做好数据筛选，不然容易造成数据重复或者丢失。这里我选择的数据筛选方式是指定`-T`参数，它能指定输出数据在某个时刻之后。
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
这里只列举了FPSRecord，其他类似。
## 温度变化
Android中温度的范围很广，CPU温度，相机温度，屏幕温度，外壳温度，电池温度，还有各种传感器温度。有一些能通过命令读取，有一些则不能。当然更科学和准确的数据可能需要借助仪器。这里我只对命令能获取的温度做了了解。
在Android系统中，能产生热量的部件都会将数据记录在`/sys/class/thermal/`目录下，并以`thermal_zone`作为目录名的前缀。每个目录下会有两个文件，`type`记录热源名字，`temp`记录温度值。在我的测试中，我想记录所有的热源数据，所以需要使用`ls`遍历这个目录。
在每次执行命令时，依次读取这些目录和文件，并将名字和温度值对应保存在一起，就可以得到最终的温度数据了。
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
## 耗电量
耗电量通过命令`adb shell dumpsys battery`获取，和之前一样的分析和处理过程，在次不再赘述，直接给出脚本。
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

## 融合起来
现在我们确定的指标数据都定义好了，但是还没组装起来，使用起来不方便。理想的情况是，执行一次脚本，各个指标每隔一定的时间间隔执行一次，直到某种条件触发，脚本停止。所以需要找一个条件，能让应用运行时脚本一直运行。
### 判断应用是否退出
众所周知，Android有四大组件，Activity，Service，BroadcastReceiver和ContentProvider。但是，在Android中，Activity是唯一能直接和用户进行交互的组件，所以，判断应用是否退出，就意味着判断Activity是否退出。而恰巧的是`dumpsys`有`activity`命令。通过指定包名，观察输出，发现只要判断是否有对应的Activity就可以判断应用是否退出了。
判断方式如下
```python
def can_be_continue(self):
        lines=self.adb('adb shell dumpsys activity -p "{}" r'.format(PACKAGE))
        for l in lines:
            if "Activities" in l and PACKAGE in l:
                return True
        return False
```
### 判断应用是否处在前台
而应用在前台也是类似的，Activity是一种方式，但是不好找判断条件。而和Activity类似的还有窗口，所以，判断应用是否处在前台，就意味着判断窗口是否处于前台。通过`dumpsys window`命令，可以获取窗口信息，通过筛选`mFocusedApp`属性的窗口，并比较包名就能确定应用是否在前台。
```python
lines=self.adb('adb shell dumpsys window d')
        for l in lines:
            if 'mFocusedApp' in l:
                return PACKAGE in l
        return False
```
### 多线程执行
循环条件找到了，但是根据实测，发现有些命令执行比较耗时，为了能在短时间内获取数据，需要将各个指标的命令执行放在多线程中。同时为了保证每个命令执行的时间间隔尽可能相同，所以需要测量执行命令的时间，然后根据时间间隔选取合适的休眠时间。由此，整个脚本就串起来了。
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
## 总结
性能测试有很多指标项，不同的指标项需要不同的处理方法。CPU，内存，电池可以直接通过`dumpsys`命令获取。而GPU数据目前我没有找到没有合适的命令，目前比较完备的解决方案是使用第三方工具：Snapdragon Profiler，但这个工具也对低版本的系统有限制。Python用来处理这些数据是个很好的选择，不仅有字符串，正则这些很强的工具可以用，还可以异步处理，是个性能测试的好帮手。
## 参考链接
1. [dumpsys](https://developer.android.com/tools/dumpsys)
2. [snapdragon profiler](https://www.qualcomm.com/developer/software/snapdragon-profiler)
3. [script](https://github.com/zevarc/RealtimePerformanceTest.git)
