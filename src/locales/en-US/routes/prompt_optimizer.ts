export default {
  title: 'Prompt Optimizer',
  subtitle: 'Use AI to refine your prompts',
  input_title: 'Input & Configuration',
  input_desc: 'Provide the original prompt and configure options',
  result_title: 'Optimization Result',
  result_desc: 'See optimized prompt and explanation',
  optimizing: 'Optimizing…',
  generating: 'Generating',
  templates_hint: '{{count}} templates loaded for current type (internal)',
  error_title: 'Error',
  validation_error: 'Validation Error',
  validation_min_length: 'At least 10 characters required',
  validation_max_length: 'At most 5000 characters allowed',

  original_prompt_label: 'Original Prompt',
  input_placeholder: 'Enter the prompt to optimize…',
  length_hint: 'Length: 10 - 5000 characters',
  char_count: '{{count}} chars',

  provider_label: 'LLM Provider',
  provider_placeholder: 'Select provider',

  prompt_type: 'Prompt Type',
  optimization_level: 'Optimization Level',
  language_style: 'Language Style',
  output_format: 'Output Format',
  language: 'Language',

  template_type: 'Template Type',
  context: 'Context',
  context_placeholder: 'Paste related contextual information…',
  image_tool: 'Image Tool',
  artistic_style: 'Artistic Style',
  artistic_style_placeholder: 'e.g., cyberpunk, oil painting, anime…',
  composition: 'Composition',
  composition_placeholder: 'e.g., rule of thirds, top-down, 16:9…',
  additional_requirements: 'Additional Requirements',
  additional_requirements_placeholder: 'Any other constraints…',

  submit: 'Optimize (⌘/Ctrl + Enter)',
  submitting: 'Submitting…',
  clear: 'Clear',

  optimized_prompt: 'Optimized Prompt',
  optimization_explanation: 'Optimization Explanation',
  improvements: 'Improvements',
  techniques: 'Techniques',
  metadata: 'Metadata',
  tokens: 'Tokens',
  copy: 'Copy',
  copy_all: 'Copy All',

  history_tab: 'History',
  favorites_tab: 'Favorites',
  optimize_tab: 'Optimize',
  history_title: 'History',
  favorites_title: 'Favorites',
  restore_to_editor: 'Restore to Editor',
  view_details: 'View Details',
  toggle_favorite: 'Toggle Favorite',
  delete_item: 'Delete',
  no_history: 'No history yet',
  no_favorites: 'No favorites yet',
  original_prompt: 'Original Prompt',
  optimized_prompt_label: 'Optimized Prompt',
  created_at: 'Created At',
  delete_confirm: 'Are you sure you want to delete this record?',
  clear_history_confirm: 'Are you sure you want to clear all history?',
  clear_history: 'Clear History',
  loading: 'Loading…',
  delete_success: 'Deleted successfully',
  restore_success: 'Restored to editor',
  close: 'Close',
  favorite: 'Favorite',
  unfavorite: 'Unfavorite',
  optimization_details: 'Optimization Details',
  record_not_found: 'Record not found',
  request_parameters: 'Request Parameters',

  tooltips: {
    prompt_type:
      "Choose the category that best fits your prompt's purpose to apply category-specific optimizations.",
    optimization_level:
      "Select the intensity of optimization. 'Minimal' for light touch-ups, 'Standard' for balanced improvements, and 'Aggressive' for a complete rewrite.",
    language_style:
      'Define the desired tone and style of the output, from formal and technical to casual and creative.',
    output_format:
      'Specify the format for the optimized output, such as plain text, structured data (JSON/XML), or Markdown.'
  },

  options: {
    prompt_type: {
      creative: {
        name: 'Creative',
        description:
          'For tasks requiring imagination, such as writing stories, poems, or brainstorming ideas.'
      },
      analysis: {
        name: 'Analysis',
        description:
          'For tasks involving data interpretation, logical reasoning, or comparative analysis.'
      },
      code: {
        name: 'Code',
        description:
          'For generating or refactoring code snippets, algorithms, or technical explanations.'
      },
      qa: {
        name: 'Q&A',
        description:
          'For creating clear questions and answers, suitable for FAQs or knowledge bases.'
      },
      translation: {
        name: 'Translation',
        description:
          'For translating text between languages while preserving context and nuance.'
      },
      summarization: {
        name: 'Summarization',
        description:
          'For condensing long texts into concise summaries, extracting key information.'
      },
      brainstorming: {
        name: 'Brainstorming',
        description:
          'For generating a wide range of ideas or solutions for a specific topic.'
      },
      other: {
        name: 'Other',
        description:
          'A general-purpose category for prompts that do not fit into other classifications.'
      }
    },
    optimization_level: {
      minimal: {
        name: 'Minimal',
        description:
          'Performs light polishing and formatting without changing the core intent. Ideal for quick touch-ups.'
      },
      standard: {
        name: 'Standard',
        description:
          'A balanced approach that improves clarity, structure, and professionalism. Recommended for most cases.'
      },
      aggressive: {
        name: 'Aggressive',
        description:
          'Completely reconstructs the prompt for maximum effectiveness, applying advanced techniques. May significantly alter the original.'
      }
    },
    language_style: {
      professional: {
        name: 'Professional',
        description:
          'Formal, objective, and structured language suitable for business or academic contexts.'
      },
      casual: {
        name: 'Casual',
        description:
          'Friendly, relaxed, and conversational tone. Good for informal communication.'
      },
      technical: {
        name: 'Technical',
        description:
          'Precise, specialized language focused on a specific domain or field of expertise.'
      },
      creative: {
        name: 'Creative',
        description:
          'Imaginative, expressive, and vivid language. Use for storytelling or artistic tasks.'
      }
    },
    output_format: {
      text: {
        name: 'Plain Text',
        description: 'Generates a simple, unformatted block of text.'
      },
      structured: {
        name: 'Structured (JSON/XML)',
        description:
          'Outputs content in a specific data format like JSON or XML, ideal for API interactions.'
      },
      markdown: {
        name: 'Markdown',
        description:
          'Formats the output using Markdown for better readability, including headings, lists, and tables.'
      }
    }
  }
};
