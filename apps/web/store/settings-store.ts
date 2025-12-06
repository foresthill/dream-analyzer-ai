import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'anthropic' | 'openrouter';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
}

interface SettingsStore {
  modelConfig: ModelConfig;
  setModelConfig: (config: ModelConfig) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      modelConfig: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      },
      setModelConfig: (config) => set({ modelConfig: config }),
    }),
    {
      name: 'dream-analyzer-settings',
    }
  )
);

// Available models for each provider
export const AVAILABLE_MODELS = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  ],
  openrouter: [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
    { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    { value: 'mistralai/mistral-large', label: 'Mistral Large' },
  ],
} as const;
