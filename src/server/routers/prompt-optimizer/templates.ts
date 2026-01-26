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

// --- 专门化模板：按 promptType 分类 ---

export const CREATIVE_TEMPLATE: PromptTemplate = {
  id: 'template-creative',
  name: '创意写作优化',
  description: '面向创意内容生成的提示词优化（故事、广告文案、诗歌等）',
  type: 'text',
  category: 'creative',
  system: {
    chinese:
      '你是创意写作专家，擅长激发 AI 的创造力。请优化提示词，使其能引导 AI 产出富有想象力、生动有趣、情感丰富的内容。注重场景描绘、情感表达、文学性与吸引力。',
    english:
      'You are a creative writing expert skilled at inspiring AI creativity. Optimize the prompt to guide AI in producing imaginative, vivid, emotionally rich content. Focus on scene description, emotional expression, literary quality, and engagement.'
  },
  user: {
    chinese:
      '原始创意提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n\n优化要求：\n1. 增强情感表达和感染力\n2. 提供具体的场景、角色、情节引导\n3. 激发创新思维和想象力\n4. 确保语言优美、引人入胜\n\n请优化为可直接使用的高质量创意提示词。',
    english:
      'Original creative prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\n\nRequirements:\n1. Enhance emotional expression and appeal\n2. Provide specific scene, character, plot guidance\n3. Inspire innovative thinking and imagination\n4. Ensure elegant and engaging language\n\nOptimize into a ready-to-use high-quality creative prompt.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['creative', 'writing', 'storytelling'],
    version: '1.0.0',
    author: 'system'
  }
};

export const ANALYSIS_TEMPLATE: PromptTemplate = {
  id: 'template-analysis',
  name: '分析类优化',
  description: '面向数据分析、逻辑推理、论证类任务的提示词优化',
  type: 'text',
  category: 'analysis',
  system: {
    chinese:
      '你是分析推理专家，擅长构建逻辑严密的提示词。请优化提示词，使其能引导 AI 进行深入分析、严谨推理、客观论证。注重逻辑结构、证据支持、多角度思考与结论可靠性。',
    english:
      'You are an analysis expert skilled at constructing logically rigorous prompts. Optimize the prompt to guide AI in deep analysis, rigorous reasoning, and objective argumentation. Focus on logical structure, evidence support, multi-perspective thinking, and reliable conclusions.'
  },
  user: {
    chinese:
      '原始分析提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n\n优化要求：\n1. 明确分析维度和框架\n2. 强调逻辑链条和证据要求\n3. 引导多角度、深层次思考\n4. 确保结论客观、有据可依\n\n请优化为可直接使用的高质量分析提示词。',
    english:
      'Original analysis prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\n\nRequirements:\n1. Clarify analysis dimensions and framework\n2. Emphasize logical chain and evidence requirements\n3. Guide multi-perspective, deep thinking\n4. Ensure objective, evidence-based conclusions\n\nOptimize into a ready-to-use high-quality analysis prompt.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['analysis', 'reasoning', 'logic'],
    version: '1.0.0',
    author: 'system'
  }
};

export const CODE_TEMPLATE: PromptTemplate = {
  id: 'template-code',
  name: '代码生成优化',
  description: '面向编程任务、技术文档、代码审查的提示词优化',
  type: 'text',
  category: 'code',
  system: {
    chinese:
      '你是软件工程专家，擅长编写精确的编程提示词。请优化提示词，使其能引导 AI 生成高质量、可维护、符合最佳实践的代码。注重技术规范、代码结构、错误处理、性能考量与文档完整性。',
    english:
      'You are a software engineering expert skilled at writing precise programming prompts. Optimize the prompt to guide AI in generating high-quality, maintainable code following best practices. Focus on technical standards, code structure, error handling, performance, and documentation completeness.'
  },
  user: {
    chinese:
      '原始代码提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n\n优化要求：\n1. 明确技术栈、语言版本、框架要求\n2. 指定代码风格、命名规范、注释要求\n3. 强调边界情况处理和错误处理\n4. 要求提供测试用例或使用示例\n5. 确保代码可读性、可维护性、可扩展性\n\n请优化为可直接使用的高质量代码提示词。',
    english:
      'Original code prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\n\nRequirements:\n1. Specify tech stack, language version, framework\n2. Define code style, naming conventions, comment requirements\n3. Emphasize edge cases and error handling\n4. Request test cases or usage examples\n5. Ensure readability, maintainability, extensibility\n\nOptimize into a ready-to-use high-quality code prompt.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['code', 'programming', 'technical'],
    version: '1.0.0',
    author: 'system'
  }
};

export const QA_TEMPLATE: PromptTemplate = {
  id: 'template-qa',
  name: '问答类优化',
  description: '面向问题解答、FAQ、知识查询的提示词优化',
  type: 'text',
  category: 'qa',
  system: {
    chinese:
      '你是问答系统专家，擅长构建清晰准确的问答提示词。请优化提示词，使其能引导 AI 提供准确、全面、易懂的答案。注重问题明确性、答案完整性、逻辑清晰与实用价值。',
    english:
      'You are a Q&A system expert skilled at constructing clear and accurate question-answer prompts. Optimize the prompt to guide AI in providing precise, comprehensive, understandable answers. Focus on question clarity, answer completeness, logical clarity, and practical value.'
  },
  user: {
    chinese:
      '原始问答提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n\n优化要求：\n1. 将问题表述得更加清晰、具体\n2. 明确答案的期望范围和深度\n3. 引导提供结构化、分层次的回答\n4. 要求给出实例、数据或引用来源\n5. 确保答案实用、可操作\n\n请优化为可直接使用的高质量问答提示词。',
    english:
      'Original Q&A prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\n\nRequirements:\n1. Make the question clearer and more specific\n2. Clarify expected scope and depth of answer\n3. Guide structured, hierarchical responses\n4. Request examples, data, or source citations\n5. Ensure practical, actionable answers\n\nOptimize into a ready-to-use high-quality Q&A prompt.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['qa', 'question', 'answer'],
    version: '1.0.0',
    author: 'system'
  }
};

export const TRANSLATION_TEMPLATE: PromptTemplate = {
  id: 'template-translation',
  name: '翻译任务优化',
  description: '面向多语言翻译、本地化、术语转换的提示词优化',
  type: 'text',
  category: 'translation',
  system: {
    chinese:
      '你是专业翻译专家，擅长构建精确的翻译提示词。请优化提示词，使其能引导 AI 进行准确、流畅、符合目标语言习惯的翻译。注重术语一致性、文化适配、语境理解与译文自然度。',
    english:
      'You are a professional translation expert skilled at constructing precise translation prompts. Optimize the prompt to guide AI in accurate, fluent translations that follow target language conventions. Focus on terminology consistency, cultural adaptation, contextual understanding, and natural flow.'
  },
  user: {
    chinese:
      '原始翻译提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n\n优化要求：\n1. 明确源语言和目标语言\n2. 指定翻译风格（直译/意译）和语域（正式/口语）\n3. 强调专业术语的准确性和一致性\n4. 要求保持原文的语气和文化内涵\n5. 确保译文流畅自然、符合目标语言习惯\n\n请优化为可直接使用的高质量翻译提示词。',
    english:
      'Original translation prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\n\nRequirements:\n1. Specify source and target languages\n2. Define translation style (literal/free) and register (formal/casual)\n3. Emphasize accuracy and consistency of technical terms\n4. Maintain original tone and cultural nuances\n5. Ensure fluent, natural translation following target language conventions\n\nOptimize into a ready-to-use high-quality translation prompt.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['translation', 'localization', 'language'],
    version: '1.0.0',
    author: 'system'
  }
};

export const SUMMARIZATION_TEMPLATE: PromptTemplate = {
  id: 'template-summarization',
  name: '总结类优化',
  description: '面向内容摘要、要点提炼、信息压缩的提示词优化',
  type: 'text',
  category: 'summarization',
  system: {
    chinese:
      '你是内容总结专家，擅长构建高效的摘要提示词。请优化提示词，使其能引导 AI 提炼核心要点、保留关键信息、生成简洁精准的摘要。注重信息完整性、逻辑连贯性、层次分明与可读性。',
    english:
      'You are a content summarization expert skilled at constructing efficient summary prompts. Optimize the prompt to guide AI in extracting key points, retaining critical information, and generating concise, precise summaries. Focus on information completeness, logical coherence, clear hierarchy, and readability.'
  },
  user: {
    chinese:
      '原始总结提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n\n优化要求：\n1. 明确总结的长度和详略程度\n2. 指定关注重点（主题/论点/数据/结论等）\n3. 要求按重要性排序或分类组织\n4. 保留关键数据、专有名词和核心观点\n5. 确保摘要独立完整、逻辑清晰\n\n请优化为可直接使用的高质量总结提示词。',
    english:
      'Original summarization prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\n\nRequirements:\n1. Specify summary length and level of detail\n2. Define focus areas (theme/argument/data/conclusion etc.)\n3. Request prioritization or categorical organization\n4. Retain key data, proper nouns, and core viewpoints\n5. Ensure summary is self-contained and logically clear\n\nOptimize into a ready-to-use high-quality summarization prompt.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['summarization', 'summary', 'extraction'],
    version: '1.0.0',
    author: 'system'
  }
};

export const BRAINSTORMING_TEMPLATE: PromptTemplate = {
  id: 'template-brainstorming',
  name: '头脑风暴优化',
  description: '面向创意激发、方案探讨、发散思维的提示词优化',
  type: 'text',
  category: 'brainstorming',
  system: {
    chinese:
      '你是创新思维专家，擅长激发发散性思考。请优化提示词，使其能引导 AI 产出多样化、创新性的想法和方案。注重思路开放性、视角多元性、可行性评估与启发价值。',
    english:
      'You are an innovation expert skilled at inspiring divergent thinking. Optimize the prompt to guide AI in generating diverse, innovative ideas and solutions. Focus on open-mindedness, multiple perspectives, feasibility assessment, and inspirational value.'
  },
  user: {
    chinese:
      '原始头脑风暴提示词:\n{originalPrompt}\n\n优化级别: {optimizationLevel}\n语言风格: {languageStyle}\n输出格式: {outputFormat}\n\n优化要求：\n1. 鼓励多角度、跨领域的思考\n2. 明确创意的数量和多样性要求\n3. 引导从不同维度探索可能性\n4. 要求对每个创意进行简要说明和可行性评估\n5. 激发创新思维，突破常规限制\n\n请优化为可直接使用的高质量头脑风暴提示词。',
    english:
      'Original brainstorming prompt:\n{originalPrompt}\n\nOptimization level: {optimizationLevel}\nLanguage style: {languageStyle}\nOutput format: {outputFormat}\n\nRequirements:\n1. Encourage multi-angle, cross-domain thinking\n2. Specify quantity and diversity requirements for ideas\n3. Guide exploration of possibilities from different dimensions\n4. Request brief explanation and feasibility assessment for each idea\n5. Inspire innovative thinking, break conventional limits\n\nOptimize into a ready-to-use high-quality brainstorming prompt.'
  },
  variables: BASE_VARIABLES,
  metadata: {
    optimizationLevel: 'standard',
    languageStyles: ['professional', 'casual', 'technical', 'creative'],
    tags: ['brainstorming', 'ideation', 'creativity'],
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
  IMAGE_OPTIMIZATION_TEMPLATE,
  CREATIVE_TEMPLATE,
  ANALYSIS_TEMPLATE,
  CODE_TEMPLATE,
  QA_TEMPLATE,
  TRANSLATION_TEMPLATE,
  SUMMARIZATION_TEMPLATE,
  BRAINSTORMING_TEMPLATE
];

export function listTemplatesByCategory(
  category?: PromptType
): PromptTemplate[] {
  if (!category) return TEMPLATES;
  return TEMPLATES.filter((t) => t.category === category || t.type !== 'text');
}

/**
 * 智能选择最适合的模板
 * 优先级：特殊场景 (图像/上下文) > promptType > optimizationLevel
 */
export function selectTemplate(params: {
  promptType: PromptType;
  optimizationLevel: OptimizationLevel;
  hasContext: boolean;
  isImagePrompt: boolean;
}): PromptTemplate {
  // 1. 特殊场景：图像提示词
  if (params.isImagePrompt) {
    return IMAGE_OPTIMIZATION_TEMPLATE;
  }

  // 2. 特殊场景：带上下文优化
  if (params.hasContext) {
    return CONTEXT_OPTIMIZATION_TEMPLATE;
  }

  // 3. 根据 promptType 选择专门模板
  const typeTemplateMap: Record<PromptType, PromptTemplate | null> = {
    creative: CREATIVE_TEMPLATE,
    analysis: ANALYSIS_TEMPLATE,
    code: CODE_TEMPLATE,
    qa: QA_TEMPLATE,
    translation: TRANSLATION_TEMPLATE,
    summarization: SUMMARIZATION_TEMPLATE,
    brainstorming: BRAINSTORMING_TEMPLATE,
    other: null // 'other' 类型使用通用模板
  };

  const typeTemplate = typeTemplateMap[params.promptType];
  if (typeTemplate) {
    return typeTemplate;
  }

  // 4. 降级到通用模板，根据 optimizationLevel 选择
  switch (params.optimizationLevel) {
    case 'minimal':
      return TEXT_MINIMAL_TEMPLATE;
    case 'aggressive':
      return TEXT_AGGRESSIVE_TEMPLATE;
    default:
      return TEXT_STANDARD_TEMPLATE;
  }
}
