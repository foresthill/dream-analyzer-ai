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
        model: 'claude-sonnet-5',
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

// Available models for each provider（静的フォールバック。実際の一覧は /api/models で動的取得）
export const AVAILABLE_MODELS = {
  anthropic: [
    { value: 'claude-opus-5', label: 'Claude Opus 5（最高品質）' },
    { value: 'claude-sonnet-5', label: 'Claude Sonnet 5（バランス）' },
    { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5（高速・低コスト）' },
  ],
  openrouter: [
    { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'mistralai/mistral-large', label: 'Mistral Large' },
  ],
} as const;
