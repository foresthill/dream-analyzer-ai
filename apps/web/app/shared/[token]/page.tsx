'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { getMoodLabel } from '@dream-analyzer/dream-core';
import type { DreamMood } from '@dream-analyzer/shared-types';
import Link from 'next/link';
import { SharedAnalysisChat } from '@/components/analysis/shared-analysis-chat';

interface SharedDream {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  lucidity: number;
  vividness: number;
  emotionalIntensity: number;
  setting: string | null;
  characters: string[];
  emotions: string[];
  dreamer: { name: string };
  analyses: Array<{
    id: string;
    psychologicalInterpretation: string;
    symbols: Array<{ symbol: string; category: string; interpretation: string }>;
    themes: string[];
    emotionalAnalysis: { primary: string; secondary: string[]; intensity: number };
    underlyingMeanings: string[];
    insights: string[];
    provider: string;
    model: string;
    analyzedAt: string;
    conversations?: Array<{
      id: string;
      role: string;
      content: string;
      userName?: string | null;
      modelName?: string | null;
      createdAt: string;
    }>;
  }>;
}

interface SharedDreamer {
  id: string;
  name: string;
  relationship?: string;
  dreams: Array<{
    id: string;
    title: string;
    content: string;
    date: string;
    mood: string;
    lucidity: number;
    vividness: number;
    emotionalIntensity: number;
    setting: string | null;
    characters: string[];
    emotions: string[];
    analyzed: boolean;
    analyses: Array<{
      id: string;
      psychologicalInterpretation: string;
      symbols: Array<{ symbol: string; category: string; interpretation: string }>;
      themes: string[];
      emotionalAnalysis: { primary: string; secondary: string[]; intensity: number };
      underlyingMeanings: string[];
      insights: string[];
      provider: string;
      model: string;
      analyzedAt: string;
      conversations?: Array<{
        id: string;
        role: string;
        content: string;
        userName?: string | null;
        modelName?: string | null;
        createdAt: string;
      }>;
    }>;
  }>;
}

interface SharedData {
  id: string;
  shareType: string;
  ownerName: string | null;
  ownerImage: string | null;
  dream: SharedDream | null;
  dreamer: SharedDreamer | null;
  createdAt: string;
}

export default function SharedPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDream, setExpandedDream] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShared() {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('この共有リンクは無効です');
          } else {
            setError('データの取得に失敗しました');
          }
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg text-muted-foreground">{error || 'データが見つかりません'}</p>
          <Link href="/" className="text-primary hover:underline">
            トップページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      {/* 共有ヘッダー */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          {data.ownerImage && (
            <img
              src={data.ownerImage}
              alt={data.ownerName || ''}
              className="h-10 w-10 rounded-full"
            />
          )}
          <div>
            <p className="text-sm text-muted-foreground">
              {data.ownerName || '匿名ユーザー'}さんが共有
            </p>
          </div>
        </div>
      </div>

      {/* 単一の夢を共有 */}
      {data.dream && (
        <SharedDreamView dream={data.dream} shareToken={token} />
      )}

      {/* ドリーマーの全ての夢を共有 */}
      {data.dreamer && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h1 className="text-2xl font-bold">{data.dreamer.name}さんの夢日記</h1>
            {data.dreamer.relationship && (
              <p className="mt-1 text-sm text-muted-foreground">
                ({data.dreamer.relationship})
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {data.dreamer.dreams.length}件の夢
            </p>
          </div>

          {data.dreamer.dreams.map((dream) => (
            <div key={dream.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedDream(expandedDream === dream.id ? null : dream.id)}
                className="w-full p-6 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{dream.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date(dream.date))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                      {getMoodLabel(dream.mood.toLowerCase() as DreamMood)}
                    </span>
                    <span className="text-muted-foreground">
                      {expandedDream === dream.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
              </button>

              {expandedDream === dream.id && (
                <div className="border-t border-border p-6 space-y-4">
                  <SharedDreamContent dream={dream} />
                  {dream.analyses.length > 0 && dream.analyses.map((analysis) => (
                    <SharedAnalysisChat
                      key={analysis.id}
                      analysisId={analysis.id}
                      shareToken={token}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SharedDreamView({ dream, shareToken }: { dream: SharedDream; shareToken: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-background p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{dream.title}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date(dream.date))} - {dream.dreamer.name}さんの夢
            </p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
            {getMoodLabel(dream.mood.toLowerCase() as DreamMood)}
          </span>
        </div>

        <SharedDreamContent dream={dream} />
      </div>

      {/* 分析結果 */}
      {dream.analyses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">分析結果 ({dream.analyses.length}件)</h2>
          {dream.analyses.map((analysis, index) => (
            <div key={analysis.id} className="space-y-3">
              <SharedAnalysisView
                analysis={analysis}
                index={dream.analyses.length - index}
              />
              <SharedAnalysisChat
                analysisId={analysis.id}
                shareToken={shareToken}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SharedDreamContent({ dream }: { dream: { content: string; lucidity: number; vividness: number; emotionalIntensity: number; setting: string | null; characters: string[]; emotions: string[] } }) {
  return (
    <div>
      <p className="mb-6 whitespace-pre-wrap">{dream.content}</p>

      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <div>
          <span className="text-sm text-muted-foreground">明晰度</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${dream.lucidity * 10}%` }} />
            </div>
            <span className="text-sm font-medium">{dream.lucidity}</span>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">鮮明度</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${dream.vividness * 10}%` }} />
            </div>
            <span className="text-sm font-medium">{dream.vividness}</span>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">感情の強さ</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${dream.emotionalIntensity * 10}%` }} />
            </div>
            <span className="text-sm font-medium">{dream.emotionalIntensity}</span>
          </div>
        </div>
      </div>

      {(dream.setting || dream.characters.length > 0 || dream.emotions.length > 0) && (
        <div className="mt-4 border-t border-border pt-4">
          {dream.setting && (
            <p className="text-sm">
              <span className="text-muted-foreground">場所:</span> {dream.setting}
            </p>
          )}
          {dream.characters.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">登場人物:</span> {dream.characters.join(', ')}
            </p>
          )}
          {dream.emotions.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">感情:</span> {dream.emotions.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SharedAnalysisView({ analysis, index }: {
  analysis: {
    psychologicalInterpretation: string;
    symbols: Array<{ symbol: string; category: string; interpretation: string }>;
    themes: string[];
    emotionalAnalysis: { primary: string; secondary: string[]; intensity: number };
    underlyingMeanings: string[];
    insights: string[];
    provider: string;
    model: string;
    analyzedAt: string;
  };
  index: number;
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-lg font-semibold">分析 #{index}</h3>
        <div className="text-right">
          <div className="text-sm font-mono text-muted-foreground">
            {analysis.provider === 'openrouter' ? 'OpenRouter / ' : ''}
            {analysis.model}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(analysis.analyzedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="mb-2 font-semibold">心理学的解釈</h4>
          <p className="text-muted-foreground">{analysis.psychologicalInterpretation}</p>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">シンボル分析</h4>
          <div className="space-y-2">
            {analysis.symbols.map((symbol, i) => (
              <div key={i} className="rounded-lg bg-secondary p-3">
                <span className="font-medium">{symbol.symbol}</span>
                <span className="ml-2 text-xs text-muted-foreground">({symbol.category})</span>
                <p className="mt-1 text-sm text-muted-foreground">{symbol.interpretation}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">テーマ</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.themes.map((theme) => (
              <span key={theme} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                {theme}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">感情分析</h4>
          <p>
            <span className="text-muted-foreground">主要な感情:</span>{' '}
            <span className="font-medium">{analysis.emotionalAnalysis.primary}</span>
          </p>
          {analysis.emotionalAnalysis.secondary.length > 0 && (
            <p>
              <span className="text-muted-foreground">副次的な感情:</span>{' '}
              {analysis.emotionalAnalysis.secondary.join(', ')}
            </p>
          )}
        </div>

        <div>
          <h4 className="mb-2 font-semibold">潜在的な意味</h4>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            {analysis.underlyingMeanings.map((meaning, i) => (
              <li key={i}>{meaning}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">洞察・アドバイス</h4>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            {analysis.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
