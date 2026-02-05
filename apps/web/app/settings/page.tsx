'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore, AVAILABLE_MODELS, type AIProvider } from '@/store/settings-store';

export default function SettingsPage() {
  const { modelConfig, isLoading, isSynced, fetchSettings, saveSettings } = useSettingsStore();
  const [showSaved, setShowSaved] = useState(false);

  // ページ読み込み時にサーバーから設定を取得
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleProviderChange = async (provider: AIProvider) => {
    const defaultModel = AVAILABLE_MODELS[provider][0].value;
    await saveSettings({ provider, model: defaultModel });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleModelChange = async (model: string) => {
    await saveSettings({ ...modelConfig, model });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-muted-foreground">アプリケーションの設定を管理します</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">AI モデル設定</h2>
            {isLoading && (
              <span className="text-sm text-muted-foreground">読み込み中...</span>
            )}
            {showSaved && !isLoading && (
              <span className="text-sm text-green-600">保存しました</span>
            )}
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            夢分析に使用するAIモデルを選択してください（設定はアカウントに保存されます）
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
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-background px-3 py-2 disabled:opacity-50"
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
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-background px-3 py-2 disabled:opacity-50"
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
                この設定はあなたのアカウントに保存され、どのデバイスからでも同じ設定が使用されます。
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
