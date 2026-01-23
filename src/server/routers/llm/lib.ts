import { type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { cohere } from '@ai-sdk/cohere';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { createGroq } from '@ai-sdk/groq';
import { TRPCError } from '@trpc/server';
import { getConfig } from '../../lib/config';
import { ollama } from 'ollama-ai-provider-v2';

import type { LLMProvider } from '@/types/llm';

// --- Provider Configuration ---

interface ProviderConfig {
  apiKey?: string;
  modelName: string;
  baseURL?: string;
}

function getProviderConfig(provider: LLMProvider): ProviderConfig {
  const providerConfig = getConfig();
  // Electron mode: read from config.json ONLY
  switch (provider) {
    case 'openai':
      return {
        apiKey: providerConfig.OPENAI_API_KEY || '',
        modelName: providerConfig.OPENAI_MODEL_NAME || 'gpt-4o'
      };
    case 'deepseek':
      return {
        apiKey: providerConfig.DEEPSEEK_API_KEY || '',
        modelName: providerConfig.DEEPSEEK_MODEL_NAME || 'deepseek-chat',
        baseURL: 'https://api.deepseek.com'
      };
    case 'gemini':
      return {
        apiKey: providerConfig.GEMINI_API_KEY || '',
        modelName: providerConfig.GEMINI_MODEL_NAME || 'gemini-2.0-flash'
      };
    case 'anthropic':
      return {
        apiKey: providerConfig.ANTHROPIC_API_KEY || '',
        modelName:
          providerConfig.ANTHROPIC_MODEL_NAME || 'claude-3-5-sonnet-20241022'
      };
    case 'openrouter':
      return {
        apiKey: providerConfig.OPENROUTER_API_KEY || '',
        modelName:
          providerConfig.OPENROUTER_MODEL_NAME || 'anthropic/claude-3.5-sonnet'
      };
    case 'groq':
      return {
        apiKey: providerConfig.GROQ_API_KEY || '',
        modelName: providerConfig.GROQ_MODEL_NAME || 'llama-3.3-70b-versatile'
      };
    case 'cohere':
      return {
        apiKey: providerConfig.COHERE_API_KEY || '',
        modelName: providerConfig.COHERE_MODEL_NAME || 'command-r-plus-08-2024'
      };
    case 'doubao':
      return {
        apiKey: providerConfig.DOUBAO_API_KEY || '',
        baseURL:
          providerConfig.DOUBAO_BASE_URL ||
          'https://ark.cn-beijing.volces.com/api/v3/',
        modelName:
          providerConfig.DOUBAO_MODEL_NAME || 'doubao-seed-1-6-lite-251015'
      };
    case 'ollama':
      return {
        modelName: providerConfig.OLLAMA_MODEL_NAME || 'llama3',
        baseURL: providerConfig.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1'
      };
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// --- Provider Factory ---

export function createProvider(provider: LLMProvider): LanguageModel {
  const config = getProviderConfig(provider);

  if (provider !== 'ollama' && !config.apiKey) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `${provider} API key is not configured. Please set the corresponding environment variable.`
    });
  }

  switch (provider) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey: config.apiKey
      });
      return openai(config.modelName);
    }

    case 'deepseek': {
      const deepseek = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL
      });
      return deepseek(config.modelName);
    }

    case 'gemini': {
      const google = createGoogleGenerativeAI({
        apiKey: config.apiKey
      });
      return google(config.modelName);
    }

    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: config.apiKey
      });
      return anthropic(config.modelName);
    }

    case 'openrouter': {
      // OpenRouter 需要通过环境变量设置 API key: OPENROUTER_API_KEY
      if (!process.env.OPENROUTER_API_KEY) {
        process.env.OPENROUTER_API_KEY = config.apiKey;
      }
      return openrouter(config.modelName);
    }

    case 'groq': {
      const groq = createGroq({
        apiKey: config.apiKey
      });
      return groq(config.modelName);
    }

    case 'cohere': {
      // Cohere 需要通过环境变量设置 API key: COHERE_API_KEY
      if (!process.env.COHERE_API_KEY) {
        process.env.COHERE_API_KEY = config.apiKey;
      }
      return cohere(config.modelName);
    }

    case 'doubao': {
      const doubao = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL
      });
      return doubao(config.modelName);
    }

    case 'ollama': {
      return ollama(config.modelName);
    }

    default:
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Unsupported LLM provider: ${provider}`
      });
  }
}

// --- Model Availability Check ---

export async function checkModelAvailability(
  provider: LLMProvider
): Promise<boolean> {
  try {
    const config = getProviderConfig(provider);
    console.log(config);
    if (provider !== 'ollama' && !config.apiKey) {
      return false;
    }

    // 尝试创建 provider，如果成功则认为可用
    createProvider(provider);
    return true;
  } catch (error) {
    console.error(`Error checking model availability for ${provider}:`, error);
    return false;
  }
}
