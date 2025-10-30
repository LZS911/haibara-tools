export default {
  title: '提示词优化工具',
  subtitle: '使用 AI 智能优化您的提示词',
  input_title: '输入与配置',
  input_desc: '填写原始提示词并配置优化参数',
  result_title: '优化结果',
  result_desc: '查看优化后的提示词与说明',
  optimizing: '正在优化…',
  generating: '正在生成',
  templates_hint: '已为当前类型加载 {{count}} 个模板（内部使用）',
  error_title: '出错了',
  validation_error: '校验失败',
  validation_min_length: '输入内容至少 10 个字符',
  validation_max_length: '输入内容最多 5000 个字符',

  original_prompt_label: '原始提示词',
  input_placeholder: '请输入需要优化的提示词…',
  length_hint: '长度限制：10 - 5000 字符',
  char_count: '{{count}} 字符',

  provider_label: 'LLM 提供商',
  provider_placeholder: '选择提供商',

  prompt_type: '提示词类型',
  optimization_level: '优化级别',
  language_style: '语言风格',
  output_format: '输出格式',
  language: '语言',
  provider: 'LLM 提供商',

  template_type: '模板类型',
  context: '上下文',
  context_placeholder: '粘贴与任务相关的上下文信息…',
  image_tool: '图像生成工具',
  artistic_style: '艺术风格',
  artistic_style_placeholder: '如：赛博朋克、油画、日系…',
  composition: '构图要求',
  composition_placeholder: '如：三分法、俯视、16:9…',
  additional_requirements: '其他要求',
  additional_requirements_placeholder: '其他补充要求…',

  submit: '执行优化 (⌘/Ctrl + Enter)',
  submitting: '正在提交…',
  clear: '清空',

  optimized_prompt: '优化后的提示词',
  optimization_explanation: '优化说明',
  improvements: '改进点',
  techniques: '使用的技巧',
  metadata: '元信息',
  tokens: 'Token',
  copy: '复制',
  copy_all: '复制全部',

  history_tab: '历史记录',
  favorites_tab: '收藏',
  optimize_tab: '优化',
  history_title: '历史记录',
  favorites_title: '收藏',
  restore_to_editor: '恢复到编辑器',
  view_details: '查看详情',
  toggle_favorite: '切换收藏',
  delete_item: '删除',
  no_history: '暂无历史记录',
  no_favorites: '暂无收藏',
  original_prompt: '原始提示词',
  optimized_prompt_label: '优化后的提示词',
  created_at: '创建时间',
  delete_confirm: '确认删除这条记录？',
  delete_confirm_description: '删除后将无法恢复，请谨慎操作。',
  loading: '加载中…',
  delete_success: '删除成功',
  restore_success: '已恢复到编辑器',
  close: '关闭',
  favorite: '收藏',
  unfavorite: '取消收藏',
  optimization_details: '优化详情',
  record_not_found: '记录未找到',
  request_parameters: '请求参数',

  options: {
    prompt_type: {
      creative: {
        name: '创意写作',
        description: '适用于需要想象力的任务，例如写故事、诗歌或进行头脑风暴。'
      },
      analysis: {
        name: '分析推理',
        description: '适用于涉及数据解读、逻辑思辨或对比分析的任务。'
      },
      code: {
        name: '代码生成',
        description: '用于生成或重构代码片段、算法或技术解释。'
      },
      qa: {
        name: '问答',
        description:
          '用于创建清晰的问题和答案，适合用于常见问题解答（FAQ）或知识库。'
      },
      translation: {
        name: '翻译',
        description: '在保留上下文和细微差别的情况下，在不同语言之间翻译文本。'
      },
      summarization: {
        name: '内容摘要',
        description: '将长文本浓缩为简洁的摘要，提取关键信息。'
      },
      brainstorming: {
        name: '头脑风暴',
        description: '为特定主题生成广泛的想法或解决方案。'
      },
      other: {
        name: '其他',
        description: '一个通用类别，适用于不适合其他分类的提示词。'
      }
    },
    optimization_level: {
      minimal: {
        name: '轻度优化',
        description: '进行轻微的润色和格式化，而不改变核心意图。适合快速修正。'
      },
      standard: {
        name: '标准优化',
        description:
          '一种平衡的方法，可提高清晰度、结构性和专业性。推荐在大多数情况下使用。'
      },
      aggressive: {
        name: '深度优化',
        description:
          '为实现最大效果而完全重构提示词，应用高级技术。可能会显著改变原始内容。'
      }
    },
    language_style: {
      professional: {
        name: '专业风格',
        description: '正式、客观、结构化的语言，适用于商业或学术环境。'
      },
      casual: {
        name: '休闲风格',
        description: '友好、轻松、对话式的语气。适合非正式交流。'
      },
      technical: {
        name: '技术风格',
        description: '专注于特定领域或专业领域的精确、专业化语言。'
      },
      creative: {
        name: '创意风格',
        description: '富有想象力、表现力和生动的语言。用于讲故事或艺术性任务。'
      }
    },
    output_format: {
      text: {
        name: '纯文本',
        description: '生成一个简单的、无格式的文本块。'
      },
      structured: {
        name: '结构化 (JSON/XML)',
        description:
          '以特定的数据格式（如 JSON 或 XML）输出内容，非常适合 API 交互。'
      },
      markdown: {
        name: 'Markdown',
        description:
          '使用 Markdown 格式化输出以获得更好的可读性，包括标题、列表和表格。'
      }
    }
  }
};
