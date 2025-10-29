// @/src/server/prompt-optimizer/options.ts

/**
 * @file This file centralizes the definitions for all optimization options
 * available in the prompt-optimizer feature. By defining them in the backend,
 * we ensure consistency and allow for dynamic updates without changing the frontend.
 *
 * Each option includes a `value` for internal logic, a `nameKey` for i18n display names,
 * and a `descriptionKey` for i1n tooltips.
 */

import type {
  OptimizationOption,
  TemplateLanguage
} from '@/types/prompt-optimizer';

export const promptTypes: OptimizationOption[] = [
  {
    value: 'creative',
    nameKey: 'prompt_optimizer.options.prompt_type.creative.name',
    descriptionKey: 'prompt_optimizer.options.prompt_type.creative.description'
  },
  {
    value: 'analysis',
    nameKey: 'prompt_optimizer.options.prompt_type.analysis.name',
    descriptionKey: 'prompt_optimizer.options.prompt_type.analysis.description'
  },
  {
    value: 'code',
    nameKey: 'prompt_optimizer.options.prompt_type.code.name',
    descriptionKey: 'prompt_optimizer.options.prompt_type.code.description'
  },
  {
    value: 'qa',
    nameKey: 'prompt_optimizer.options.prompt_type.qa.name',
    descriptionKey: 'prompt_optimizer.options.prompt_type.qa.description'
  },
  {
    value: 'translation',
    nameKey: 'prompt_optimizer.options.prompt_type.translation.name',
    descriptionKey:
      'prompt_optimizer.options.prompt_type.translation.description'
  },
  {
    value: 'summarization',
    nameKey: 'prompt_optimizer.options.prompt_type.summarization.name',
    descriptionKey:
      'prompt_optimizer.options.prompt_type.summarization.description'
  },
  {
    value: 'brainstorming',
    nameKey: 'prompt_optimizer.options.prompt_type.brainstorming.name',
    descriptionKey:
      'prompt_optimizer.options.prompt_type.brainstorming.description'
  },
  {
    value: 'other',
    nameKey: 'prompt_optimizer.options.prompt_type.other.name',
    descriptionKey: 'prompt_optimizer.options.prompt_type.other.description'
  }
];

export const optimizationLevels: OptimizationOption[] = [
  {
    value: 'minimal',
    nameKey: 'prompt_optimizer.options.optimization_level.minimal.name',
    descriptionKey:
      'prompt_optimizer.options.optimization_level.minimal.description'
  },
  {
    value: 'standard',
    nameKey: 'prompt_optimizer.options.optimization_level.standard.name',
    descriptionKey:
      'prompt_optimizer.options.optimization_level.standard.description'
  },
  {
    value: 'aggressive',
    nameKey: 'prompt_optimizer.options.optimization_level.aggressive.name',
    descriptionKey:
      'prompt_optimizer.options.optimization_level.aggressive.description'
  }
];

export const languageStyles: OptimizationOption[] = [
  {
    value: 'professional',
    nameKey: 'prompt_optimizer.options.language_style.professional.name',
    descriptionKey:
      'prompt_optimizer.options.language_style.professional.description'
  },
  {
    value: 'casual',
    nameKey: 'prompt_optimizer.options.language_style.casual.name',
    descriptionKey: 'prompt_optimizer.options.language_style.casual.description'
  },
  {
    value: 'technical',
    nameKey: 'prompt_optimizer.options.language_style.technical.name',
    descriptionKey:
      'prompt_optimizer.options.language_style.technical.description'
  },
  {
    value: 'creative',
    nameKey: 'prompt_optimizer.options.language_style.creative.name',
    descriptionKey:
      'prompt_optimizer.options.language_style.creative.description'
  }
];

export const outputFormats: OptimizationOption[] = [
  {
    value: 'text',
    nameKey: 'prompt_optimizer.options.output_format.text.name',
    descriptionKey: 'prompt_optimizer.options.output_format.text.description'
  },
  {
    value: 'structured',
    nameKey: 'prompt_optimizer.options.output_format.structured.name',
    descriptionKey:
      'prompt_optimizer.options.output_format.structured.description'
  },
  {
    value: 'markdown',
    nameKey: 'prompt_optimizer.options.output_format.markdown.name',
    descriptionKey:
      'prompt_optimizer.options.output_format.markdown.description'
  }
];

export const languages: Array<{ value: TemplateLanguage; label: string }> = [
  { value: 'chinese', label: '简体中文' },
  { value: 'english', label: 'English' }
];

export function getAllOptions() {
  return {
    promptTypes,
    optimizationLevels,
    languageStyles,
    outputFormats,
    languages
  };
}
