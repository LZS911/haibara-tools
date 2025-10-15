# Haibara Tools

<div align="center">

一站式实用工具集合，助你高效完成日常任务，简单、快捷、可靠。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-38-47848f)](https://www.electronjs.org/)
[![TanStack](https://img.shields.io/badge/TanStack-Router%20%26%20Query-ff4154)](https://tanstack.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10.12+-f69220)](https://pnpm.io/)

[🚀 快速开始](#-快速开始) • [📦 下载客户端](#-构建与打包) • [📚 文档](#-文档)

</div>

## ✨ 核心特性

- 📁 **文件格式转换** - 支持文档、视频、音频、图片等多种格式互转
- 📺 **Bilibili 下载** - 下载 B站视频和音频，支持多种清晰度
- 🤖 **AI 智能转文档** - 将 B站视频转换为结构化文档，支持多种 AI 模型
- 💻 **跨平台客户端** - 基于 Electron 的桌面应用，支持 macOS/Windows/Linux
- 🌐 **Web 版本** - 同时支持浏览器在线使用
- 🌍 **多语言支持** - 中文/英文双语界面

## 🎯 应用形态

- **🌐 Web 版本**: 在浏览器中直接使用，无需安装
- **💻 Electron 客户端**: 独立桌面应用，功能更完整，性能更好 **（推荐使用）**

## 📋 功能详细介绍

### 📁 文件类型转换

支持多种文件格式的相互转换：

- **文本文档**: Markdown ↔ PDF ↔ DOCX ↔ TXT
- **视频文件**: MP4 ↔ AVI ↔ MOV ↔ MKV
- **音频文件**: MP3 ↔ WAV ↔ FLAC ↔ AAC
- **图片文件**: JPG ↔ PNG ↔ WebP ↔ GIF

### 📺 Bilibili 视频下载

下载 B站视频和音频资源，支持多种清晰度和格式：

- 🎬 **视频下载**: 支持多种分辨率（4K/1080P/720P/480P）
- 🎵 **音频下载**: 支持多种音质（320K/192K/128K/64K）
- 📋 **批量下载**: 支持队列管理，批量下载多个视频
- 💾 **格式选择**: 视频格式 MP4，音频格式 MP3/M4A
- 🔄 **进度追踪**: 实时显示下载进度和速度

### 🤖 Bilibili 视频 AI 转文档

使用 AI 将 B站视频转换为结构化文档：

#### 支持的内容风格

- 📝 **结构笔记** - 系统化的学习笔记
- 📄 **内容摘要** - 精炼的核心要点
- ✍️ **自媒体文章** - 完整的图文文章
- 🗺️ **思维导图** - 层级化的内容结构
- 📱 **社交媒体帖子** - 高传播性的文案
- 📊 **信息表格** - 结构化的数据展示

#### 支持的 LLM 提供商（7个）

| 提供商                 | 特点             | 适用场景 |
| ---------------------- | ---------------- | -------- |
| **OpenAI**             | 高质量、稳定     | 通用场景 |
| **DeepSeek**           | 中文优化、便宜   | 中文内容 |
| **Gemini**             | 免费额度大       | 开发测试 |
| **Claude (Anthropic)** | 长上下文、高质量 | 复杂文档 |
| **OpenRouter**         | 统一访问多模型   | 灵活切换 |
| **Groq**               | 推理速度极快     | 实时应用 |
| **Cohere**             | 企业级 AI        | 生产环境 |

详细配置和使用方法请查看：[LLM 提供商使用指南](docs/llm-providers-guide.md)

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 10.12+

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/haibara-tools.git
cd haibara-tools

# 安装依赖
pnpm install
```

### 配置

1. 复制环境变量配置文件：

```bash
cp env.example .env
```

2. 编辑 `.env` 文件，配置至少一个 LLM 提供商的 API Key（用于 AI 转文档功能）：

```bash
# 示例：配置 DeepSeek（推荐，便宜且中文友好）
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_MODEL_NAME=deepseek-chat

# 或者配置 OpenAI
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL_NAME=gpt-4o
```

> 💡 **提示**:
>
> - Web 版本会自动读取 `.env` 文件
> - Electron 客户端支持在设置页面中配置 API Key，无需修改 `.env` 文件

详细配置说明请查看：[LLM 提供商使用指南](docs/llm-providers-guide.md)

### 运行

#### Web 版本

```bash
# 开发模式
pnpm dev

# 访问 http://localhost:3000
```

#### Electron 客户端（推荐）

```bash
# 开发模式（同时启动 Web 服务和 Electron）
pnpm dev:electron

# 或者分别启动
pnpm dev              # 终端1: 启动 Web 服务
pnpm dev:electron-only # 终端2: 启动 Electron 客户端
```

### 测试 LLM 配置

```bash
# 测试所有配置的 LLM 提供商
pnpm tsx scripts/test-llm-providers.ts
```

## 📦 构建与打包

### Web 版本构建

```bash
# 构建生产版本
pnpm build

# 运行生产版本
pnpm start
```

### Electron 客户端打包

```bash
# 构建所有平台
pnpm dist:all

# 构建 macOS 版本
pnpm dist:mac

# 构建 Windows 版本
pnpm dist:win

# 构建 Linux 版本
pnpm dist:linux
```

打包完成后，安装包位于 `release/` 目录下。

## 🧪 测试

```bash
# 运行测试
pnpm test
```

## 🛠️ 技术栈

### 前端

- **框架**: React 19
- **路由**: TanStack Router (文件路由系统)
- **状态管理**: TanStack Query (React Query)
- **样式**: Tailwind CSS 4 + shadcn/ui
- **国际化**: react-i18next
- **构建工具**: Vite 6
- **桌面应用**: Electron 38

### 后端

- **运行时**: Node.js + Express
- **API**: tRPC (类型安全的 API)
- **AI**: Vercel AI SDK (统一的 LLM 接口)
- **类型**: TypeScript (严格模式)
- **爬虫**: Puppeteer (Bilibili 数据获取)

### 文件处理

- **视频**: ffmpeg, fluent-ffmpeg
- **文档**: docx, pdf-parse, mammoth
- **图片**: sharp

## 📁 项目结构

```
haibara-tools/
├── src/
│   ├── routes/                    # TanStack Router 路由
│   │   ├── __root.tsx            # 根布局
│   │   ├── index.tsx             # 首页
│   │   ├── convert/              # 文件转换功能
│   │   ├── bilibili-downloader/  # Bilibili 视频下载功能
│   │   ├── media-to-docs/        # AI 视频转文档功能
│   │   ├── settings/             # 设置页面
│   │   └── -components/          # 共享 UI 组件
│   ├── server/                   # 服务端代码
│   │   ├── server.ts             # Express 服务器
│   │   ├── trpc.ts               # tRPC 路由
│   │   ├── convert/              # 文件转换服务
│   │   ├── bilibili/             # Bilibili 相关服务
│   │   │   ├── core/             # Bilibili 核心功能
│   │   │   │   ├── bilibili.ts   # Bilibili API 封装
│   │   │   │   ├── download.ts   # 下载管理
│   │   │   │   ├── media.ts      # 媒体处理
│   │   │   │   └── utils.ts      # 工具函数
│   │   │   ├── download-manager.ts # 下载队列管理
│   │   │   └── routes.ts         # tRPC 路由
│   │   ├── media-to-docs/        # AI 转文档服务
│   │   │   ├── pipelines/        # 处理流水线
│   │   │   │   ├── llm.ts        # LLM 集成
│   │   │   │   ├── asr.ts        # 语音识别
│   │   │   │   └── ...
│   │   │   └── index.ts          # 入口文件
│   │   └── lib/                  # 共享库
│   │       ├── config.ts         # 配置管理
│   │       └── puppeteer-utils.ts # Puppeteer 工具
│   └── locales/                  # 国际化文件
├── electron/                      # Electron 主进程和预加载脚本
│   ├── main.ts                   # Electron 主进程
│   └── preload.ts                # 预加载脚本
├── docs/                         # 文档
│   ├── llm-providers-guide.md    # LLM 使用指南
│   ├── electron-guide.md         # Electron 开发指南
│   └── ...
└── test/                         # 测试文件
```

## 📚 文档

- [LLM 提供商使用指南](docs/llm-providers-guide.md) - 如何配置和使用各个 LLM 提供商
- [Electron 开发指南](docs/electron-guide.md) - Electron 应用开发说明
- [环境配置指南](docs/env-configuration.md) - 环境变量配置详解
- [LLM 扩展方案](docs/llm-provider-enhancement.md) - LLM 架构设计和扩展计划
- [AI 视频转文档迁移计划](docs/ai-media2doc-migration-plan.md) - 功能迁移说明

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

请查看项目根目录的 `.cursorrules` 文件，了解代码规范和开发准则。

## 📝 更新日志

### v0.0.1 (当前版本)

- 🎉 **项目架构**: 基于 React 19 + TanStack Router + tRPC 的现代化技术栈
- ✨ **文件转换**: 支持多种文件格式的相互转换（文档、视频、音频、图片）
- ✨ **Bilibili 下载**: 完整的 B站视频/音频下载功能，支持多种清晰度和格式
- ✨ **AI 转文档**: B站视频 AI 转文档，支持 7 种 LLM 提供商和 6 种内容风格
- 💻 **Electron 客户端**: 跨平台桌面应用，支持 macOS/Windows/Linux
- 🌐 **Web 版本**: 同时支持 Web 浏览器访问
- 🌍 **国际化**: 支持中文和英文双语切换
- 🎨 **现代 UI**: 基于 Tailwind CSS 4 + shadcn/ui 的美观界面
- 🔧 **配置管理**: 完善的环境变量配置系统
- 📚 **完整文档**: 提供详细的开发和使用文档

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

本项目基于以下优秀的开源项目：

- [React](https://react.dev/) - 用户界面库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vercel AI SDK](https://sdk.vercel.ai/) - 统一的 AI 接口
- [TanStack](https://tanstack.com/) - Router 和 Query
- [tRPC](https://trpc.io/) - 类型安全的 API
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Vite](https://vitejs.dev/) - 现代化构建工具
- [FFmpeg](https://ffmpeg.org/) - 多媒体处理框架
- [Puppeteer](https://pptr.dev/) - 无头浏览器自动化

---

<div align="center">

Made with ❤️ by Haibara Tools Team

[报告问题](https://github.com/yourusername/haibara-tools/issues) · [功能建议](https://github.com/yourusername/haibara-tools/issues)

</div>
