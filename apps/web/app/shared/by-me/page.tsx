'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';

interface ShareItem {
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

export default function SharedByMePage() {
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    fetchShares();
  }, []);

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

  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyLink(token: string, shareId: string) {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return <div className="text-center">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">共有した夢</h1>

      {shares.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          まだ共有したコンテンツはありません。
        </div>
      ) : (
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
      )}
    </div>
  );
}
