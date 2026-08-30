# Zevarc 设计系统 v4 — 嫩芽生长记录 (Spring Bud Journal)

> 主题：**春天的生长 + 精密的记录** —— 像一本"植物生长的实验记录"。
> 品牌故事：Z（Zevarc）+ 圆 = 太极螺旋，从零（Zero）沿弧线（Arc）曲折演进（Evolution）。

---

## 1. 配色（嫩芽青绿 + 嫩黄点缀）

### 浅色（默认）
| Token | 值 | 用途 |
|-------|-----|------|
| `--color-paper` | `#f1f5ee` | 嫩绿白纸底 |
| `--color-paper-deep` | `#e5ece2` | 深一档纸（容器） |
| `--color-paper-line` | `#d4ded1` | 线框/分隔线 |
| `--color-ink` | `#29372f` | 深墨绿主文字 |
| `--color-ink-soft` | `#5b6d62` | 次级文字 |
| `--color-ink-faint` | `#88978c` | 弱化（日期/注释） |
| `--color-bud` | `#5e8b74` | 主青绿（强调/链接/按钮） |
| `--color-bud-deep` | `#3f6a55` | hover/深青绿 |
| `--color-bud-soft` | `#b3cdbc` | 淡青绿 |
| `--color-bud-pale` | `#dbe8de` | 更淡底（标签/选中） |
| `--color-sprout` | `#d6b35c` | 嫩黄点缀 |
| `--color-sprout-deep` | `#b08a4f` | 暖棕点缀 |
| `--grid-line` | `rgba(94,139,116,0.07)` | 蓝图网格线 |

### 深色（文章页跟随系统）
纸 `#141d18` / 文字 `#e2e9e2` / 青绿 `#8fb89f` / 嫩黄 `#d6b35c`

## 2. 字体

| 角色 | 字体 | 规格 |
|------|------|------|
| 大标题/文章标题 | **Fraunces**（衬线） | 600 · `letter-spacing:-0.02em` |
| slogan/引语 | Fraunces *italic* | 400 |
| 正文 | **Inter** | 1rem · 行高 1.7 |
| 数据/日期/编号/标签 | **JetBrains Mono** | 0.7–0.85rem · 常配 `letter-spacing` |

## 3. 背景

- 嫩绿白纸感底色 + **36px 青绿网格**（`--grid-line`）——全站"蓝图/实验记录"感
- hero 区：**favicon 水印**（大 logo 渐变青绿→嫩黄，`opacity: 0.12`，缓慢浮动 9s）文字叠加其上

## 4. 品牌元素

- **favicon（Z+圆太极螺旋）**：水印背景（hero 全屏、文章头部局部）、导航小图标
- **Arc 弧线**（从地平线扬起的弧线）：签名图形，用于分隔/结束标记
- **词源叙事**：`Zero → Evolution → Arc`（mono + 青绿箭头）

## 5. 生长记录语言（数据化排版）

- 文章编号：`01 / 02 …`（mono 青绿）
- 日期/时长：mono 灰绿（`2026.08.15` / `14 min read`）
- 区块标题：mono uppercase + 计数（`26 REC` / `05 PCS` 青绿）
- **hover 生长线**：列表行从左侧伸出一条青绿线段
- 标签胶囊：青绿淡底 `--color-bud-pale` + 深青绿文字

## 6. 交互

- **区块 reveal**：IntersectionObserver 淡入上浮（`prefers-reduced-motion` 关闭）
- **浮动按钮**：向上滚动时右下角浮出（搜索 / 语言 / 回顶），向下滚隐藏
- **微光**：按钮/卡片 hover 青绿光晕（`rgba(94,139,116,0.22~0.35)`）
- 阅读进度条：青绿 `--color-primary`

## 7. 留白与节奏

- hero 独占一屏（`100vh`，无按钮，底部 `scroll` 提示）
- 区块间上边距 **110–120px**（留白大于常规）
- 内容容器 `max-width: 760px`（正文）/ `900px`（区块）/ `1060px`（hero 双栏）

## 8. 页面结构（单页画布 + 深层页）

- **首页**：单页无限画布 = hero（水印全屏）→ 全部文章（生长记录）→ 项目（青绿卡片）
- **深层页**（文章/项目/搜索）：同套配色、网格、mono 数据语言、品牌水印
