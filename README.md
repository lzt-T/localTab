# LocalTab

LocalTab 是一款简洁、美观的 Chromium 新标签页扩展，基于 Manifest V3 构建，支持 Chrome、Edge、Opera 和 Brave。

它可以帮助你集中整理常用网站、快速切换分类，并通过搜索、Dock 和自定义背景打造更符合个人习惯的新标签页。

## 功能特性

- 创建、编辑和删除网址分类、快捷链接与网址文件夹
- 通过拖拽调整分类、链接和文件夹顺序
- 在不同分类之间移动链接，或将多个链接合并为文件夹
- 将常用网址固定到 Dock，并通过拖拽排序或取消固定
- 通过浏览器工具栏弹窗快速收藏当前网页，并可随时新建保存分类
- 在 LocalTab 中快速搜索已保存的网址，包括网址文件夹中的内容
- 输入完整网址或域名直接访问，并支持键盘选择本地搜索结果
- 使用浏览器默认搜索引擎，或添加带 `%s` 占位符的自定义搜索引擎
- 使用网站 favicon、Lucide 图标或本地图片自定义网址图标
- 上传自定义背景图片
- 支持简体中文、英文以及跟随浏览器语言
- 经用户临时授权后预览并批量导入浏览器书签
- 将分类、链接、搜索设置、Dock 和背景图片导出为 JSON 备份
- 从 JSON 备份恢复本地数据

## 从源码安装

### 1. 获取项目并安装依赖

本项目使用 pnpm 管理依赖。

```bash
git clone https://github.com/lzt-T/localTab.git
cd localTab
pnpm install
```

### 2. 构建浏览器扩展

根据目标浏览器执行对应命令：

```bash
# Chrome
pnpm run build:chrome

# Edge
pnpm run build:edge

# Opera
pnpm run build:opera

# Brave
pnpm run build:brave
```

构建产物位于 `dist/<browser>`，例如 Chrome 对应 `dist/chrome`。

### 3. 加载扩展

1. 打开浏览器的扩展管理页面：
   - Chrome：`chrome://extensions`
   - Edge：`edge://extensions`
   - Opera：`opera://extensions`
   - Brave：`brave://extensions`
2. 开启“开发者模式”。
3. 选择“加载已解压的扩展程序”。
4. 选择对应的 `dist/<browser>` 目录。
5. 打开一个新标签页即可使用 LocalTab。

## 使用说明

- 在左侧导航栏中切换、添加或管理分类。
- 通过页面中的添加入口创建快捷链接和网址文件夹。
- 点击浏览器工具栏中的 LocalTab 图标，可将当前 HTTP(S) 网页快速收藏到已有或新建分类。
- 在搜索框中输入标题或网址可查找本地内容；使用方向键选择结果并按 Enter 打开，输入完整网址或域名则可直接访问。
- 拖拽分类、链接或文件夹可调整位置；链接和文件夹也可以跨分类移动，链接还可以拖入文件夹或相互合并为文件夹。
- 将页面中的链接拖到 Dock 可固定常用网址；Dock 图标可拖拽排序或拖入垃圾桶取消固定。
- 拖动页面中的分类、链接或文件夹时，可将其放入 Dock 右侧的垃圾桶并确认删除。
- 点击搜索框左侧的搜索引擎入口，可切换或添加自定义搜索引擎。
- 编辑网址时可选择网站 favicon、Lucide 图标或上传自定义图标。
- 在设置面板中更换背景、切换语言、导入浏览器书签，以及导入或导出 LocalTab 备份。

更完整的交互说明可以在扩展设置面板的“操作指南”中查看。

## 本地开发

```bash
# 启动默认开发页面
pnpm run dev

# 调试新标签页
pnpm run dev:newtab

# 调试扩展弹窗
pnpm run dev:popup

# 构建默认的 Chrome 扩展
pnpm run build

# 生成所有浏览器的 ZIP 包
pnpm run build:zip:all

# 检查代码规范
pnpm run lint

# 预览构建结果
pnpm run preview
```

## 技术栈

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4
- Radix UI
- Zustand
- dnd-kit
- i18next
- IndexedDB

## 项目结构

```text
localTab/
├─ manifests/          # 各浏览器的 Manifest V3 配置
├─ public/             # 扩展图标等静态资源
├─ scripts/            # 构建辅助脚本
├─ src/
│  ├─ hooks/           # 页面状态与业务操作 Hook
│  ├─ newtab/          # 新标签页界面
│  ├─ popup/           # 扩展弹窗
│  ├─ services/        # 数据访问服务
│  └─ i18n/            # 中英文文案
└─ package.json
```

## 数据与隐私

LocalTab 不包含分析、广告、遥测或用户跟踪功能。分类、快捷链接、搜索设置、自定义背景和备份数据均在用户设备上处理，不会上传到开发者服务器。

详细说明请阅读 [隐私政策](./PRIVACY.md)。

## 反馈

如果你发现问题或有功能建议，欢迎前往 [GitHub Issues](https://github.com/lzt-T/localTab/issues) 提交反馈。
