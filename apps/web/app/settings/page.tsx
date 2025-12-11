'use client';

import { useSettingsStore, AVAILABLE_MODELS, type AIProvider } from '@/store/settings-store';

export default function SettingsPage() {
  const { modelConfig, setModelConfig } = useSettingsStore();

  const handleProviderChange = (provider: AIProvider) => {
    // Set default model for the new provider
    const defaultModel = AVAILABLE_MODELS[provider][0].value;
    setModelConfig({ provider, model: defaultModel });
  };

  const handleModelChange = (model: string) => {
    setModelConfig({ ...modelConfig, model });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-muted-foreground">アプリケーションの設定を管理します</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-4 text-lg font-semibold">AI モデル設定</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            夢分析に使用するAIモデルを選択してください
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="provider" className="mb-2 block text-sm font-medium">
                AIプロバイダー
              </label>
              <select
                id="provider"
                value={modelConfig.provider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openrouter">OpenRouter (複数モデル対応)</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {modelConfig.provider === 'anthropic'
                  ? 'Anthropic APIへ直接接続します'
                  : 'OpenRouter経由で100以上のモデルにアクセスできます'}
              </p>
            </div>

            <div>
              <label htmlFor="model" className="mb-2 block text-sm font-medium">
                モデル
              </label>
              <select
                id="model"
                value={modelConfig.model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {AVAILABLE_MODELS[modelConfig.provider].map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                現在選択中: <span className="font-mono">{modelConfig.model}</span>
              </p>
            </div>

            <div className="rounded-md bg-secondary p-3">
              <p className="text-sm">
                💡 <strong>ヒント:</strong> 異なるモデルを試して、どのモデルが最も良い分析結果を提供するか比較できます。
                分析結果には使用されたモデルが記録されます。
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-2 text-lg font-semibold">プロフィール</h2>
          <p className="text-sm text-muted-foreground">
            認証機能は今後実装予定です
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-2 text-lg font-semibold">通知</h2>
          <p className="text-sm text-muted-foreground">
            通知設定は今後実装予定です
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-2 text-lg font-semibold">データ管理</h2>
          <p className="text-sm text-muted-foreground">
            データのエクスポート・削除機能は今後実装予定です
          </p>
        </div>
      </div>
    </div>
  );
}
