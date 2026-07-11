# EasyMD

轻量、稳定的 Markdown 编辑器，支持浏览器与桌面双端。

基于 [doocs/md](https://github.com/doocs/md) 二次开发，面向个人日常写作与排版需求。

## 功能亮点

- **实时预览** — PC Web / Mobile 响应式适配
- **三种布局** — 编辑 / 双栏同步 / 预览，随场景切换
- **三主题** — 经典 · 优雅 · 简洁
- **丰富渲染** — 数学公式（KaTeX）、Mermaid / PlantUML / 信息图
- **本地文件** — 打开 / 保存 / 文件夹同步，记住上次打开目录
- **多格式导出** — Markdown / HTML / PDF / Word
- **一键复制** — MD 代码 / HTML 代码 / 公众号排版
- **AI 助手** — 智能对话、文本优化、翻译纠错、内容总结、文生图
- **本地图片** — 磁盘路径引用、相对路径自动转换、剪贴板粘贴兼容
- **多图床** — Gitee / 阿里云 / 七牛 / 腾讯云 / 又拍云 / 公众号 / MinIO / 自定义
- **浏览器插件** — Chrome / Firefox 侧边栏注入
- **MCP Server** — AI 工具链集成

## 技术栈

| 层   | 技术                               |
| ---- | ---------------------------------- |
| 前端 | Vue 3 + CodeMirror 6 + TailwindCSS |
| 桌面 | Tauri 2（Rust）                    |
| 构建 | Vite 8 + pnpm Monorepo             |
| 部署 | Cloudflare Workers / 静态托管      |

## 环境

- Node.js ≥ 22.22.2
- pnpm ≥ 9
- 桌面版额外需要 [Rust](https://www.rust-lang.org/)

## 开发

```sh
pnpm i

# 浏览器开发
pnpm web dev
# http://127.0.0.1:5173/md/

# 桌面开发
pnpm desktop:dev

# 测试
pnpm test

# 类型检查
pnpm type-check
```

## 构建

```sh
# Web 静态资源
pnpm web build

# 桌面安装包（Windows / macOS / Linux）
pnpm desktop:build
```

## 目录结构

```
apps/web            主界面（Vue 3 + CodeMirror 6）
apps/desktop        Tauri 2 桌面壳
packages/core       Markdown 渲染引擎
packages/shared     主题与编辑器配置
packages/desktop-fs 本地文件 / 图片路径工具
packages/md-cli     命令行一键启动
packages/mcp-server MCP Server
packages/config     共享 TypeScript 配置
```

## 致谢

本项目源自 [doocs/md](https://github.com/doocs/md)，感谢所有原项目贡献者。

## 许可证

[WTFPL](./LICENSE) — Do What The Fuck You Want To.
