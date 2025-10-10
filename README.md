# Haibara Tools

<div align="center">

一站式实用工具集合，助你高效完成日常任务，简单、快捷、可靠。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://reactjs.org/)
[![TanStack](https://img.shields.io/badge/TanStack-Router%20%26%20Query-ff4154)](https://tanstack.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10.12+-f69220)](https://pnpm.io/)

</div>

## ✨ 功能特性

### 📁 文件转换工具

支持多种文件格式的相互转换：

- **文本文档**: Markdown ↔ PDF ↔ DOCX ↔ TXT
- **视频文件**: MP4 ↔ AVI ↔ MOV ↔ MKV
- **音频文件**: MP3 ↔ WAV ↔ FLAC ↔ AAC
- **图片文件**: JPG ↔ PNG ↔ WebP ↔ GIF

### 🤖 AI 视频转文档（新功能）

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

2. 编辑 `.env` 文件，配置至少一个 LLM 提供商的 API Key：

```bash
# 示例：配置 DeepSeek（推荐，便宜且中文友好）
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_MODEL_NAME=deepseek-chat

# 或者配置 OpenAI
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL_NAME=gpt-4o
```

详细配置说明请查看：[LLM 提供商使用指南](docs/llm-providers-guide.md)

### 运行

```bash
# 开发模式
pnpm dev

# 访问 http://localhost:3000
```

### 测试 LLM 配置

```bash
# 测试所有配置的 LLM 提供商
pnpm tsx scripts/test-llm-providers.ts
```

## 📦 构建

```bash
# 构建生产版本
pnpm build

# 运行生产版本
pnpm start
```

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

### 后端

- **运行时**: Node.js + Express
- **API**: tRPC (类型安全的 API)
- **AI**: Vercel AI SDK (统一的 LLM 接口)
- **类型**: TypeScript (严格模式)

### 文件处理

- **视频**: ffmpeg
- **文档**: docx, pdf-parse, mammoth
- **图片**: sharp

## 📁 项目结构

```
haibara-tools/
├── src/
│   ├── routes/              # TanStack Router 路由
│   │   ├── __root.tsx      # 根布局
│   │   ├── index.tsx       # 首页
│   │   ├── convert/        # 文件转换功能
│   │   ├── media-to-docs/  # AI 视频转文档功能
│   │   └── -components/    # 共享 UI 组件
│   ├── server/             # 服务端代码
│   │   ├── server.ts       # Express 服务器
│   │   ├── trpc.ts         # tRPC 路由
│   │   ├── convert/        # 文件转换服务
│   │   └── media-to-docs/  # AI 转文档服务
│   │       ├── pipelines/  # 处理流水线
│   │       │   ├── llm.ts  # LLM 集成（新）
│   │       │   ├── asr.ts  # 语音识别
│   │       │   └── ...
│   │       └── core/       # 核心功能
│   └── locales/            # 国际化文件
├── docs/                   # 文档
│   ├── llm-providers-guide.md        # LLM 使用指南
│   └── llm-provider-enhancement.md  # LLM 扩展方案
├── scripts/                # 工具脚本
│   └── test-llm-providers.ts  # LLM 测试脚本
└── test/                   # 测试文件
```

## 📚 文档

- [LLM 提供商使用指南](docs/llm-providers-guide.md) - 如何配置和使用各个 LLM 提供商
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

### v0.2.0 (2025-01-10)

- ✨ **新增**: 使用 Vercel AI SDK 重构 LLM 集成
- ✨ **新增**: 支持 7 种 LLM 提供商（OpenAI、DeepSeek、Gemini、Claude、OpenRouter、Groq、Cohere）
- ✨ **新增**: LLM 提供商测试脚本
- 📚 **文档**: 添加详细的 LLM 使用指南
- 🔧 **优化**: 统一的流式响应处理
- 🔧 **优化**: 更好的错误处理和进度追踪

### v0.1.0

- 🎉 初始版本
- ✨ 文件转换功能
- ✨ AI 视频转文档基础功能

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

本项目基于以下优秀的开源项目：

- [Vercel AI SDK](https://sdk.vercel.ai/) - 统一的 AI 接口
- [TanStack](https://tanstack.com/) - Router 和 Query
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [tRPC](https://trpc.io/) - 类型安全的 API

---

<div align="center">

Made with ❤️ by Haibara Tools Team

[报告问题](https://github.com/yourusername/haibara-tools/issues) · [功能建议](https://github.com/yourusername/haibara-tools/issues)

</div>
