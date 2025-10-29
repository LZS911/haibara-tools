import type {
  PromptTemplate,
  PromptType,
  OptimizationLevel
} from '@/types/prompt-optimizer';

// --- 最小可用模板集（精简版，覆盖 text/context/image 三类） ---

const BASE_VARIABLES = [
  'originalPrompt',
  'promptType',
  'optimizationLevel',
  'languageStyle',
  'outputFormat',
  'language',
  'context',
  'imageTool',
  'artisticStyle',
  'composition',
  'additionalRequirements'
];

export const TEXT_STANDARD_TEMPLATE: PromptTemplate = {
  id: 'template-text-standard',
  name: '标准文本优化',
  description: '通用文本提示词的结构化优化',
  type: 'text',
  category: 'other',
  system: {
    chinese:
      '你是资深提示词工程师，请基于最佳实践优化用户提示词：清晰、结构化、可执行、专业。输出需要可直接使用。',
    english:
      'You are a senior prompt engineer. Optimize the user prompt for clarity, structure, executability, and professionalism. Output should be ready-to-use.'
  },
  user: {
    chinese:
      '原始提示词:\n{originalPrompt}\n\n类型: {promptType}\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n请基于以上信息进行优化。',
    english:
      'Original prompt:\n{originalPrompt}\n\nType: {promptType}\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\nPlease optimize accordingly.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['text', 'standard'],
    version: '1.0.0',
    author: 'system'
  }
};

export const TEXT_MINIMAL_TEMPLATE: PromptTemplate = {
  id: 'template-text-minimal',
  name: '最小改动文本优化',
  description: '在不改变核心意图的前提下进行轻量润色与格式化',
  type: 'text',
  category: 'other',
  system: {
    chinese:
      '你是一位提示词微调专家，只做必要的语言润色与格式规范，保持原意与结构。',
    english:
      'You fine-tune prompts with minimal changes: polish language and format while preserving the original meaning and structure.'
  },
  user: {
    chinese:
      '原始提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n请仅做必要的改进。',
    english:
      'Original prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\nMake only necessary improvements.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'minimal',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['text', 'minimal'],
    version: '1.0.0',
    author: 'system'
  }
};

export const TEXT_AGGRESSIVE_TEMPLATE: PromptTemplate = {
  id: 'template-text-aggressive',
  name: '深度文本优化',
  description: '全面重构提示词结构与表达，提升专业度与可执行性',
  type: 'text',
  category: 'other',
  system: {
    chinese:
      '你是提示词重构专家，请基于 CRISP 原则进行深度重构：上下文、角色、指令、结构、参数。',
    english:
      'You deeply reconstruct the prompt using the CRISP framework: Context, Role, Instruction, Structure, Parameters.'
  },
  user: {
    chinese:
      '原始提示词:\n{originalPrompt}\n\n类型: {promptType}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n请深度优化并可直接使用。',
    english:
      'Original prompt:\n{originalPrompt}\n\nType: {promptType}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\nPlease deeply optimize and make it ready to use.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'aggressive',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['text', 'aggressive'],
    version: '1.0.0',
    author: 'system'
  }
};

export const CONTEXT_OPTIMIZATION_TEMPLATE: PromptTemplate = {
  id: 'template-context-standard',
  name: '上下文优化',
  description: '利用提供的上下文进行针对性优化，确保引用准确与连贯',
  type: 'context',
  category: 'other',
  system: {
    chinese:
      '你是一位上下文优化专家，请基于给定上下文优化提示词，确保引用准确、关系清晰与逻辑连贯。',
    english:
      'You are a context optimization expert. Use the provided context to optimize the prompt with accurate citation and coherence.'
  },
  user: {
    chinese:
      '上下文:\n{context}\n\n原始提示词:\n{originalPrompt}\n\n请优化并说明如何使用该上下文。',
    english:
      'Context:\n{context}\n\nOriginal prompt:\n{originalPrompt}\n\nPlease optimize and specify how to utilize the context.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['context'],
    version: '1.0.0',
    author: 'system'
  }
};

export const IMAGE_OPTIMIZATION_TEMPLATE: PromptTemplate = {
  id: 'template-image-standard',
  name: '图像提示词优化',
  description: '面向 Stable Diffusion / Midjourney / DALL-E 的提示词优化',
  type: 'image',
  category: 'other',
  system: {
    chinese:
      '你是 AI 绘图提示词专家，请基于目标工具优化图像提示词，遵循该工具格式与最佳实践。',
    english:
      'You are an AI image prompt expert. Optimize the prompt for the target tool and follow its best practices.'
  },
  user: {
    chinese:
      '原始图像提示词:\n{originalPrompt}\n\n目标工具: {imageTool}\n艺术风格: {artisticStyle}\n构图: {composition}\n其他要求: {additionalRequirements}',
    english:
      'Original image prompt:\n{originalPrompt}\n\nTarget tool: {imageTool}\nArtistic style: {artisticStyle}\nComposition: {composition}\nAdditional requirements: {additionalRequirements}'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['image'],
    version: '1.0.0',
    author: 'system'
  }
};

export const TEMPLATES: PromptTemplate[] = [
  TEXT_STANDARD_TEMPLATE,
  TEXT_MINIMAL_TEMPLATE,
  TEXT_AGGRESSIVE_TEMPLATE,
  CONTEXT_OPTIMIZATION_TEMPLATE,
  IMAGE_OPTIMIZATION_TEMPLATE
];

export function listTemplatesByCategory(
  category?: PromptType
): PromptTemplate[] {
  if (!category) return TEMPLATES;
  return TEMPLATES.filter((t) => t.category === category || t.type !== 'text');
}

export function selectTemplate(params: {
  promptType: PromptType;
  optimizationLevel: OptimizationLevel;
  hasContext: boolean;
  isImagePrompt: boolean;
}) {
  if (params.isImagePrompt) return IMAGE_OPTIMIZATION_TEMPLATE;
  if (params.hasContext) return CONTEXT_OPTIMIZATION_TEMPLATE;
  switch (params.optimizationLevel) {
    case 'minimal':
      return TEXT_MINIMAL_TEMPLATE;
    case 'aggressive':
      return TEXT_AGGRESSIVE_TEMPLATE;
    default:
      return TEXT_STANDARD_TEMPLATE;
  }
}
