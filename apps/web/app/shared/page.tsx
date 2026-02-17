'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { getMoodLabel } from '@dream-analyzer/dream-core';
import type { DreamMood } from '@dream-analyzer/shared-types';
import { cn } from '@/lib/utils';

// ===== 型定義 =====

interface SharedWithMeItem {
  id: string;
  shareType: string;
  dreamId: string | null;
  dreamerId: string | null;
  owner: { name: string | null; image: string | null };
  dream: {
    id: string;
    title: string;
    date: string;
    mood: string;
    dreamer: { name: string };
    analyses: Array<{ id: string }>;
  } | null;
  dreamer: {
    id: string;
    name: string;
    dreams: Array<{
      id: string;
      title: string;
      date: string;
      mood: string;
      analyzed: boolean;
    }>;
  } | null;
  createdAt: string;
}

interface DreamDetail {
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
  user: { name: string | null; image: string | null };
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
  }>;
}

interface SharedByMeItem {
  id: string;
  shareType: 'EMAIL' | 'LINK';
  sharedWithEmail: string | null;
  shareToken: string | null;
  dreamId: string | null;
  dreamerId: string | null;
  dream: { id: string; title: string; date: string } | null;
  dreamer: { id: string; name: string } | null;
  createdAt: string;
}

type Tab = 'received' | 'sent';

// ===== メインページ =====

export default function SharedPage() {
  const [tab, setTab] = useState<Tab>('received');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">共有</h1>

      {/* タブ */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('received')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'received'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          共有された夢
        </button>
        <button
          onClick={() => setTab('sent')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'sent'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          共有した夢
        </button>
      </div>

      {/* タブコンテンツ */}
      {tab === 'received' ? <ReceivedTab /> : <SentTab />}
    </div>
  );
}

// ===== 共有された夢タブ =====

function ReceivedTab() {
  const [shares, setShares] = useState<SharedWithMeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDream, setSelectedDream] = useState<DreamDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function fetchShares() {
      try {
        const res = await fetch('/api/shared/with-me');
        if (res.ok) {
          const data = await res.json();
          setShares(data);
        }
      } catch (error) {
        console.error('Failed to fetch shared content:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchShares();
  }, []);

  const viewDream = async (dreamId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/shared/dream/${dreamId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDream(data);
      }
    } catch (error) {
      console.error('Failed to fetch dream:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>;
  }

  // 夢の詳細ビュー
  if (selectedDream) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedDream(null)}
          className="text-sm text-primary hover:underline"
        >
          &larr; 一覧に戻る
        </button>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            {selectedDream.user.image && (
              <img src={selectedDream.user.image} alt="" className="h-8 w-8 rounded-full" />
            )}
            <p className="text-sm text-muted-foreground">
              {selectedDream.user.name || '匿名ユーザー'}さんが共有
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedDream.title}</h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(new Date(selectedDream.date))} - {selectedDream.dreamer.name}さんの夢
              </p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
              {getMoodLabel(selectedDream.mood.toLowerCase() as DreamMood)}
            </span>
          </div>

          <p className="mb-6 whitespace-pre-wrap">{selectedDream.content}</p>

          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
            {[
              { label: '明晰度', value: selectedDream.lucidity },
              { label: '鮮明度', value: selectedDream.vividness },
              { label: '感情の強さ', value: selectedDream.emotionalIntensity },
            ].map((item) => (
              <div key={item.label}>
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${item.value * 10}%` }} />
                  </div>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分析結果 */}
        {selectedDream.analyses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">分析結果 ({selectedDream.analyses.length}件)</h2>
            {selectedDream.analyses.map((analysis, index) => (
              <div key={analysis.id} className="rounded-lg border-2 border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-lg font-semibold">分析 #{selectedDream.analyses.length - index}</h3>
                  <div className="text-right">
                    <div className="text-sm font-mono text-muted-foreground">
                      {analysis.provider === 'openrouter' ? 'OpenRouter / ' : ''}
                      {analysis.model}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold">心理学的解釈</h4>
                    <p className="text-muted-foreground">{analysis.psychologicalInterpretation}</p>
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
                    <h4 className="mb-2 font-semibold">洞察・アドバイス</h4>
                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                      {analysis.insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 一覧ビュー
  if (shares.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        まだ共有されたコンテンツはありません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shares.map((share) => (
        <div
          key={share.id}
          className="rounded-lg border border-border bg-card p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {share.owner.image && (
                <img
                  src={share.owner.image}
                  alt={share.owner.name || ''}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  {share.owner.name || '匿名ユーザー'}さんから共有
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(new Date(share.createdAt))}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {share.dream && (
              <div>
                <h3 className="font-semibold">{share.dream.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {share.dream.dreamer.name}さんの夢 - {formatDate(new Date(share.dream.date))}
                </p>
                {share.dream.analyses.length > 0 && (
                  <p className="mt-1 text-xs text-primary">分析済み</p>
                )}
                <button
                  onClick={() => viewDream(share.dream!.id)}
                  disabled={loadingDetail}
                  className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loadingDetail ? '読み込み中...' : '詳細を見る'}
                </button>
              </div>
            )}

            {share.dreamer && (
              <div>
                <h3 className="font-semibold">{share.dreamer.name}さんの夢日記</h3>
                <p className="text-sm text-muted-foreground">
                  {share.dreamer.dreams.length}件の夢
                </p>
                {share.dreamer.dreams.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {share.dreamer.dreams.map((dream) => (
                      <div
                        key={dream.id}
                        className="rounded-md border border-border bg-background p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">{dream.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(new Date(dream.date))}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {dream.analyzed && (
                              <span className="text-xs text-primary">分析済み</span>
                            )}
                            <button
                              onClick={() => viewDream(dream.id)}
                              disabled={loadingDetail}
                              className="text-xs text-primary hover:underline"
                            >
                              詳細
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== 共有した夢タブ =====

function SentTab() {
  const [shares, setShares] = useState<SharedByMeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShares() {
      try {
        const res = await fetch('/api/shares');
        if (res.ok) {
          const data = await res.json();
          setShares(data);
        }
      } catch (error) {
        console.error('Failed to fetch shares:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchShares();
  }, []);

  async function revokeShare(id: string) {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/shares/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShares((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error('Failed to revoke share:', error);
    } finally {
      setRevokingId(null);
    }
  }

  function copyLink(token: string, shareId: string) {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>;
  }

  if (shares.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        まだ共有したコンテンツはありません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shares.map((share) => (
        <div
          key={share.id}
          className="rounded-lg border border-border bg-card p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 共有対象 */}
              {share.dream && (
                <div>
                  <h3 className="font-semibold">{share.dream.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    夢 - {formatDate(new Date(share.dream.date))}
                  </p>
                </div>
              )}
              {share.dreamer && (
                <div>
                  <h3 className="font-semibold">{share.dreamer.name}さんの夢日記</h3>
                  <p className="text-sm text-muted-foreground">ドリーマー共有</p>
                </div>
              )}

              {/* 共有方法 */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                    (share.shareType === 'EMAIL'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300')
                  }
                >
                  {share.shareType === 'EMAIL' ? 'メール共有' : 'リンク共有'}
                </span>
                {share.sharedWithEmail && (
                  <span className="text-sm text-muted-foreground">
                    → {share.sharedWithEmail}
                  </span>
                )}
                {share.shareToken && (
                  <button
                    onClick={() => copyLink(share.shareToken!, share.id)}
                    className="text-sm text-primary hover:underline"
                  >
                    {copiedId === share.id ? 'コピーしました!' : 'リンクをコピー'}
                  </button>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(new Date(share.createdAt))} に共有
              </p>
            </div>

            {/* 共有解除ボタン */}
            <button
              onClick={() => revokeShare(share.id)}
              disabled={revokingId === share.id}
              className="ml-4 shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {revokingId === share.id ? '解除中...' : '共有解除'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
