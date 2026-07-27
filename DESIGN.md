---
name: "LocalTab"
description: "在浏览器壁纸上悬浮组织常用网站的安静新标签页工作台"
colors:
  canvas-night: "#090c10"
  surface-card: "rgba(58, 60, 64, 0.52)"
  surface-floating: "rgba(46, 48, 52, 0.76)"
  surface-overlay: "rgba(38, 40, 44, 0.94)"
  mist-blue: "#60a5fa"
  mist-blue-strong: "rgba(59, 130, 246, 0.85)"
  text-primary: "rgba(255, 255, 255, 0.90)"
  text-muted: "rgba(255, 255, 255, 0.55)"
  border-soft: "rgba(255, 255, 255, 0.14)"
  danger: "rgba(239, 68, 68, 0.70)"
typography:
  headline:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.333
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.mist-blue-strong}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  input-glass:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  card-link:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "88px"
  navigation-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    size: "44px"
  dock-surface:
    backgroundColor: "{colors.surface-floating}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "6px"
    height: "56px"
  dialog-surface:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "24px"
  drop-zone:
    backgroundColor: "rgba(255, 255, 255, 0.035)"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
---

# Design System: LocalTab

## Overview

**Creative North Star: "悬浮书签台"**

LocalTab 像一张悬浮在个人壁纸前的书签工作台：界面不遮蔽用户选择的背景，而是用深色半透明表面稳定文字和操作。视觉重心始终落在用户的分类、网址和搜索任务上，品牌通过克制的雾蓝提示、精确的间距和安静的层次表达。

系统气质是克制、通透、安静、高效。密度偏紧凑，但交互目标保持宽松；装饰只服务于结构、状态和可读性，不使用高饱和多彩、厚重不透明、营销式装饰或夸张动效。

**Key Characteristics:**

- 深色壁纸画布上的分层玻璃表面
- 雾蓝承担选择、聚焦和主要行动
- 紧凑的信息密度与清晰的 44px 高频操作目标
- 柔和环境阴影、细边框与短促状态反馈
- 中文与英文共享同一套排版节奏

## Colors

颜色系统以冷黑画布和中性玻璃为主体，雾蓝只在需要明确方向或状态时出现。

### Primary

- **雾蓝：**用于主要按钮、当前选择、聚焦边框、拖放命中和关键图标；保持稀少，避免整块页面泛蓝。
- **深雾蓝：**用于需要更高行动权重的实心按钮，并在悬停时向较亮的雾蓝过渡。

### Neutral

- **夜色画布：**作为壁纸未覆盖区域和加载状态的稳定底色。
- **卡片玻璃：**用于网址卡片和文件夹卡片，让内容可读但仍保留背景存在感。
- **悬浮玻璃：**用于 Dock、侧边导航等持续悬浮的工具表面。
- **覆盖玻璃：**用于弹窗、菜单、文件夹浮层和设置面板，提供最高的内容隔离度。
- **主文字与弱文字：**通过透明度建立层级；标题、正文、辅助信息依次减弱。
- **柔和边框：**只分隔相邻表面，不形成明亮轮廓。

### Tertiary

- **危险红：**只用于删除确认、拖入垃圾区和错误反馈，不参与普通导航或装饰。

### Named Rules

**The Atmosphere-First Rule.** 背景图是体验的一部分；玻璃表面必须改善可读性，但不能把页面变成不透明深色仪表盘。

**The Quiet Accent Rule.** 雾蓝只标示行动、选择和聚焦；普通容器与大面积背景保持中性。

## Typography

**Display Font:** Manrope Variable（中文回退为 Noto Sans SC Variable）
**Body Font:** Manrope Variable（中文回退为 Noto Sans SC Variable）

**Character:** 拉丁字符保持几何、紧凑和现代，中文保持清晰自然。单一无衬线体系减少切换成本，主要依靠字重、字号和透明度建立层级。

### Hierarchy

- **Headline：**用于设置面板标题和弹窗最高级标题，保持简短。
- **Title：**用于分类标题、卡片标题和区块名称，以中等偏粗字重稳定扫描路径。
- **Body：**用于说明、菜单项和表单内容，默认保持紧凑行距。
- **Label：**用于辅助状态、数量、提示与键盘标记，不使用全大写制造噪声。

### Named Rules

**The One-Family Rule.** 不为装饰引入额外字体；层级变化优先使用既有字号、字重、透明度和间距。

## Layout

新标签页以全视口、纵向吸附的分类页面为主轴。桌面端将分类导航固定在左侧、搜索固定在顶部中央，内容位于两者之间；窄屏将导航移到顶部并保持搜索居中。主内容容器最大宽度为 1500px，并为底部 Dock 留出安全空间。

网址网格从单列逐步扩展为 2、3、4、5、7、8 列；关键断点为 420px、640px、768px、1024px、1280px 和 1536px。基础节奏以 4px 为单位，组件内部最常用 8–16px，面板级留白使用 24px。设置面板在窄屏采用上下结构，在 640px 起切换为侧栏加内容区。

## Elevation & Depth

系统采用“透明度分层 + 环境阴影”的混合方式。卡片、持续悬浮工具和临时覆盖层分别使用逐步加深的玻璃表面；阴影用于说明离背景的距离，不用于给每个元素增加装饰轮廓。所有玻璃层共享 24px 模糊、降低亮度和轻度饱和的材料特征。

### Shadow Vocabulary

- **Dock Ambient**（`0 14px 36px rgba(0, 0, 0, 0.28)`）：用于持续悬浮的底部 Dock。
- **Overlay Ambient**（`0 18px 46px rgba(0, 0, 0, 0.36)`）：用于设置等大型覆盖面板。
- **Accent Lift**（`0 8px 24px rgba(59, 130, 246, 0.20)`）：只用于主要蓝色行动或明确的拖放状态。

### Named Rules

**The Layered Glass Rule.** 卡片、悬浮工具和覆盖层使用不同不透明度；不要用同一块玻璃值覆盖全部层级。

## Shapes

形状语言以柔和矩形为主：小图标容器使用 8px 圆角，字段和基础控件使用 10px，卡片与弹窗使用 12px，Dock、搜索框和大型面板使用 16px。圆形只用于计数徽标、状态点和极小的强调元素。边框保持一像素、低对比；文件上传区可使用虚线表达可投放性。

## Components

### Buttons

- **Shape:** 高频按钮优先采用 44px 高度和宽松的 16px 圆角；紧凑弹窗动作可沿用基础中型按钮。
- **Primary:** 雾蓝实心表面配高对比白字，只用于当前流程的主要动作。
- **Hover / Focus:** 悬停提高亮度；键盘聚焦使用雾蓝或白色半透明环，激活态允许轻微缩放。
- **Secondary / Ghost:** 透明或极浅白色玻璃底，用于取消、工具和次要入口。

### Cards / Containers

- **Corner Style:** 网址卡片与文件夹卡片使用 12px 圆角。
- **Background:** 使用卡片玻璃；悬停仅略微提高亮度和边框对比。
- **Shadow Strategy:** 静止时保持轻柔，悬停时增加少量环境阴影并上移 2px。
- **Border:** 使用低对比白色边框，顶部边缘可稍亮以表达玻璃厚度。
- **Internal Padding:** 以 10px 垂直、12px 水平为典型密度。

### Inputs / Fields

- **Style:** 半透明白色字段、低对比边框和 10px 圆角；搜索框作为大型组合控件使用 44px 高度。
- **Focus:** 移除浏览器默认轮廓，改用雾蓝边框和半透明聚焦环。
- **Error / Disabled:** 错误使用危险红边框与文字；禁用态降低透明度并移除指针事件。

### Navigation

分类导航和 Dock 都使用 44px 操作目标。默认状态保持弱文字，悬停提高表面与文字亮度，当前项使用雾蓝色调和清晰但不过度的聚焦环。桌面侧栏与移动顶部栏共享同一交互语言。

### Dialogs and Overlays

弹窗、下拉菜单、文件夹浮层和设置面板使用覆盖玻璃。弹窗遮罩为半透明黑色，内容以 12–16px 圆角、24px 内边距和短促缩放淡入建立临时层级。

### Search

搜索是顶部中央的 44px 组合玻璃控件：左侧为搜索引擎选择，中间为无边框输入，右侧只在宽屏显示键盘提示。分隔线、图标和辅助文字保持低对比，聚焦仍由白色或雾蓝环表达。

### Dock

Dock 是系统的签名组件：底部居中的 56px 悬浮功能岛，容纳新增入口、固定网址和拖放垃圾区。固定网址区域可横向滚动；拖放命中用雾蓝或危险红表达，不依赖大幅动画。

### File Drop Zone

上传区使用 12px 圆角、低对比虚线边框和浅玻璃底。拖入文件时边框与图标切换到雾蓝，并保持文字说明可读。

## Do's and Don'ts

### Do:

- **Do** 使用卡片、悬浮工具、覆盖层三级玻璃透明度表达层级。
- **Do** 为高频图标按钮和 Dock 项目保留 44px 操作目标。
- **Do** 用雾蓝表达主要行动、当前选择、聚焦和有效拖放状态。
- **Do** 在所有动画中尊重 `prefers-reduced-motion`。
- **Do** 让中文和英文共用 Manrope 与 Noto Sans SC 的回退关系和信息层级。

### Don't:

- **Don't** 用高饱和多彩色块争夺壁纸和内容的注意力。
- **Don't** 把玻璃层替换为覆盖大部分壁纸的厚重不透明面板。
- **Don't** 添加营销式装饰、无功能意义的光效或夸张动效。
- **Don't** 在普通内容上滥用雾蓝、危险红或高强度阴影。
- **Don't** 为相同层级随意引入新的圆角、阴影或玻璃透明度。
