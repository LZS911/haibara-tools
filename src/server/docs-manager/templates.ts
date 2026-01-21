import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import type {
  DocTemplate,
  TemplateCategory,
  CreateTemplateInput
} from '@/types/docs';

// 获取用户数据目录
function getUserDataPath(): string {
  const userDataPath =
    process.env.USER_DATA_PATH ||
    (process.env.NODE_ENV === 'development'
      ? path.join(process.cwd(), 'userData')
      : path.join(
          process.env.APPDATA || process.env.HOME || process.cwd(),
          '.haibara-tools'
        ));
  return userDataPath;
}

// 获取文档存储根目录
function getDocsDir(): string {
  return path.join(getUserDataPath(), 'docs');
}

// 获取模板文件路径
function getTemplatesPath(): string {
  return path.join(getDocsDir(), 'templates.json');
}

// 确保目录存在
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ============ 内置模板 ============

const BUILT_IN_TEMPLATES: DocTemplate[] = [
  {
    id: 'builtin-blank',
    name: '空白文档',
    description: '从零开始创建',
    content: '',
    category: 'general',
    isBuiltIn: true,
    createdAt: 0
  },
  {
    id: 'builtin-weekly-report',
    name: '周报模板',
    description: '工作周报格式',
    content: `# 周报 - {{date}}

## 本周完成

- 

## 下周计划

- 

## 遇到的问题

- 

## 需要的支持

- 
`,
    category: 'work',
    isBuiltIn: true,
    createdAt: 0
  },
  {
    id: 'builtin-project-doc',
    name: '项目文档',
    description: '项目说明文档格式',
    content: `# 项目名称

## 项目概述

简要描述项目的目标和背景。

## 技术架构

### 技术栈

- 

### 架构图

\`\`\`
[架构图描述]
\`\`\`

## 功能模块

### 模块一

- 功能描述
- 实现方式

## 开发指南

### 环境准备

\`\`\`bash
# 安装依赖
\`\`\`

### 启动项目

\`\`\`bash
# 启动命令
\`\`\`

## 部署说明

## 常见问题

## 更新日志

### v1.0.0 ({{date}})

- 初始版本
`,
    category: 'work',
    isBuiltIn: true,
    createdAt: 0
  },
  {
    id: 'builtin-reading-notes',
    name: '读书笔记',
    description: '读书笔记记录格式',
    content: `# 《书名》读书笔记

## 基本信息

- **作者**：
- **出版时间**：
- **阅读时间**：{{date}}

## 内容概要

## 核心观点

1. 

## 精彩摘录

> 

## 个人感悟

## 行动计划

- [ ] 
`,
    category: 'study',
    isBuiltIn: true,
    createdAt: 0
  },
  {
    id: 'builtin-meeting-notes',
    name: '会议记录',
    description: '会议记录格式',
    content: `# 会议记录 - {{date}}

## 会议信息

- **会议主题**：
- **会议时间**：
- **参会人员**：
- **记录人**：

## 会议议程

1. 

## 讨论内容

### 议题一

**讨论要点**：

**结论**：

## 行动项

| 任务 | 负责人 | 截止日期 | 状态 |
|------|--------|----------|------|
|      |        |          | ⬜   |

## 下次会议

- **时间**：
- **议题**：
`,
    category: 'work',
    isBuiltIn: true,
    createdAt: 0
  },
  {
    id: 'builtin-daily-journal',
    name: '日记模板',
    description: '每日记录格式',
    content: `# {{date}} 日记

## 今日心情

😊 / 😐 / 😢

## 今日要事

- [ ] 

## 今日反思

### 做得好的

- 

### 需要改进的

- 

## 明日计划

- [ ] 

## 感恩时刻

今天我感谢：

`,
    category: 'personal',
    isBuiltIn: true,
    createdAt: 0
  }
];

// ============ 模板操作 ============

// 读取自定义模板
function readCustomTemplates(): DocTemplate[] {
  ensureDir(getDocsDir());
  const templatesPath = getTemplatesPath();

  if (!fs.existsSync(templatesPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(templatesPath, 'utf-8');
    return JSON.parse(content) as DocTemplate[];
  } catch {
    return [];
  }
}

// 写入自定义模板
function writeCustomTemplates(templates: DocTemplate[]): void {
  ensureDir(getDocsDir());
  fs.writeFileSync(
    getTemplatesPath(),
    JSON.stringify(templates, null, 2),
    'utf-8'
  );
}

// 获取所有模板（内置 + 自定义）
export function listTemplates(category?: TemplateCategory): DocTemplate[] {
  const customTemplates = readCustomTemplates();
  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];

  if (category) {
    return allTemplates.filter((t) => t.category === category);
  }

  return allTemplates;
}

// 获取内置模板
export function getBuiltInTemplates(): DocTemplate[] {
  return BUILT_IN_TEMPLATES;
}

// 获取自定义模板
export function getCustomTemplates(): DocTemplate[] {
  return readCustomTemplates();
}

// 获取单个模板
export function getTemplate(id: string): DocTemplate | null {
  // 先在内置模板中查找
  const builtIn = BUILT_IN_TEMPLATES.find((t) => t.id === id);
  if (builtIn) {
    return builtIn;
  }

  // 再在自定义模板中查找
  const customTemplates = readCustomTemplates();
  return customTemplates.find((t) => t.id === id) || null;
}

// 创建自定义模板
export function createTemplate(input: CreateTemplateInput): DocTemplate {
  const id = `custom-${nanoid(10)}`;
  const now = Date.now();

  const template: DocTemplate = {
    id,
    name: input.name,
    description: input.description || '',
    content: input.content || '',
    category: input.category || 'general',
    isBuiltIn: false,
    createdAt: now
  };

  const customTemplates = readCustomTemplates();
  customTemplates.push(template);
  writeCustomTemplates(customTemplates);

  return template;
}

// 更新自定义模板
export function updateTemplate(
  id: string,
  updates: Partial<Omit<DocTemplate, 'id' | 'isBuiltIn' | 'createdAt'>>
): DocTemplate | null {
  // 不能更新内置模板
  if (id.startsWith('builtin-')) {
    return null;
  }

  const customTemplates = readCustomTemplates();
  const index = customTemplates.findIndex((t) => t.id === id);

  if (index === -1) {
    return null;
  }

  const updatedTemplate: DocTemplate = {
    ...customTemplates[index],
    ...updates
  };

  customTemplates[index] = updatedTemplate;
  writeCustomTemplates(customTemplates);

  return updatedTemplate;
}

// 删除自定义模板
export function deleteTemplate(id: string): boolean {
  // 不能删除内置模板
  if (id.startsWith('builtin-')) {
    return false;
  }

  const customTemplates = readCustomTemplates();
  const newTemplates = customTemplates.filter((t) => t.id !== id);

  if (newTemplates.length === customTemplates.length) {
    return false; // 没有找到要删除的模板
  }

  writeCustomTemplates(newTemplates);
  return true;
}

// 从文档创建模板
export function createTemplateFromDoc(
  name: string,
  description: string,
  content: string,
  category: TemplateCategory = 'general'
): DocTemplate {
  return createTemplate({
    name,
    description,
    content,
    category
  });
}

// 处理模板变量
export function processTemplateContent(content: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return content.replace(/\{\{date\}\}/g, dateStr);
}
