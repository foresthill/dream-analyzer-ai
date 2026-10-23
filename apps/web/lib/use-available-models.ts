'use client';

import { useEffect, useState } from 'react';
import { AVAILABLE_MODELS } from '@/store/settings-store';

export interface ModelOption {
  value: string;
  label: string;
}

export interface ModelsByProvider {
  anthropic: ModelOption[];
  openrouter: ModelOption[];
}

// 静的フォールバック（/api/models 取得前・失敗時）
const STATIC_MODELS: ModelsByProvider = {
  anthropic: AVAILABLE_MODELS.anthropic.map((m) => ({ value: m.value, label: m.label })),
  openrouter: AVAILABLE_MODELS.openrouter.map((m) => ({ value: m.value, label: m.label })),
};

/**
 * プロバイダー別の選択可能モデルを /api/models から動的取得する。
 * 取得前・失敗時は静的フォールバックを返すので常に何かしら選べる。
 */
export function useAvailableModels(): { models: ModelsByProvider; loading: boolean } {
  const [models, setModels] = useState<ModelsByProvider>(STATIC_MODELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = (await res.json()) as Partial<ModelsByProvider>;
          if (active && Array.isArray(data.anthropic) && Array.isArray(data.openrouter)) {
            setModels({ anthropic: data.anthropic, openrouter: data.openrouter });
          }
        }
      } catch {
        // 静的フォールバックのまま
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { models, loading };
}
