import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'anthropic' | 'openrouter';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
}

interface SettingsStore {
  modelConfig: ModelConfig;
  isLoading: boolean;
  isSynced: boolean;
  setModelConfig: (config: ModelConfig) => void;
  fetchSettings: () => Promise<void>;
  saveSettings: (config: ModelConfig) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      modelConfig: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      },
      isLoading: false,
      isSynced: false,

      setModelConfig: (config) => set({ modelConfig: config }),

      // サーバーから設定を取得
      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/settings');
          if (res.ok) {
            const data = await res.json();
            set({
              modelConfig: {
                provider: data.provider as AIProvider,
                model: data.model,
              },
              isSynced: true,
            });
          }
        } catch (error) {
          console.error('Failed to fetch settings:', error);
          // エラー時はローカルの設定を使用
        } finally {
          set({ isLoading: false });
        }
      },

      // サーバーに設定を保存
      saveSettings: async (config: ModelConfig) => {
        set({ isLoading: true, modelConfig: config });
        try {
          const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: config.provider,
              model: config.model,
            }),
          });
          if (res.ok) {
            set({ isSynced: true });
          } else {
            console.error('Failed to save settings');
          }
        } catch (error) {
          console.error('Failed to save settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'dream-analyzer-settings',
      // ローカルストレージにはmodelConfigのみ保存
      partialize: (state) => ({ modelConfig: state.modelConfig }),
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
