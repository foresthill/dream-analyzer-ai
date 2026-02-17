'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 共有対象（どちらか一方）
  dreamId?: string;
  dreamerId?: string;
  targetLabel: string; // 表示名（例: "夢のタイトル" or "○○さんの夢日記"）
  onShareChange?: () => void; // 共有状態が変更された時のコールバック
}

interface ExistingShare {
  id: string;
  shareType: 'EMAIL' | 'LINK';
  dreamId: string | null;
  dreamerId: string | null;
  sharedWithEmail: string | null;
  shareToken: string | null;
  createdAt: string;
}

export function ShareDialog({ open, onOpenChange, dreamId, dreamerId, targetLabel, onShareChange }: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingShares, setExistingShares] = useState<ExistingShare[]>([]);
  const [linkShare, setLinkShare] = useState<ExistingShare | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchExistingShares = useCallback(async () => {
    try {
      const res = await fetch('/api/shares');
      if (res.ok) {
        const allShares: ExistingShare[] = await res.json();
        // この対象のシェアだけフィルタ
        const filtered = allShares.filter((s) => {
          if (dreamId) return s.dreamId === dreamId;
          if (dreamerId) return s.dreamerId === dreamerId;
          return false;
        });
        setExistingShares(filtered.filter((s) => s.shareType === 'EMAIL'));
        setLinkShare(filtered.find((s) => s.shareType === 'LINK') || null);
      }
    } catch {
      // ignore
    }
  }, [dreamId, dreamerId]);

  useEffect(() => {
    if (open) {
      fetchExistingShares();
      setMessage(null);
      setEmail('');
      setCopied(false);
    }
  }, [open, fetchExistingShares]);

  const handleShareByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareType: 'EMAIL',
          dreamId: dreamId || undefined,
          dreamerId: dreamerId || undefined,
          sharedWithEmail: email.trim(),
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${email} に共有しました` });
        setEmail('');
        fetchExistingShares();
        onShareChange?.();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || '共有に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: '共有に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareType: 'LINK',
          dreamId: dreamId || undefined,
          dreamerId: dreamerId || undefined,
        }),
      });

      if (res.ok) {
        const share = await res.json();
        setLinkShare(share);
        setMessage({ type: 'success', text: '共有リンクを作成しました' });
        onShareChange?.();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'リンクの作成に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'リンクの作成に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      const res = await fetch(`/api/shares/${shareId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExistingShares();
        if (linkShare?.id === shareId) {
          setLinkShare(null);
        }
        onShareChange?.();
      }
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    if (!linkShare?.shareToken) return;
    const url = `${window.location.origin}/shared/${linkShare.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = linkShare?.shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${linkShare.shareToken}`
    : '';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">
            共有設定
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            「{targetLabel}」を共有
          </Dialog.Description>

          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <Tabs.List className="flex border-b border-border">
              <Tabs.Trigger
                value="email"
                className="flex-1 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
              >
                メールアドレスで共有
              </Tabs.Trigger>
              <Tabs.Trigger
                value="link"
                className="flex-1 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
              >
                リンクで共有
              </Tabs.Trigger>
            </Tabs.List>

            {/* メールアドレスで共有 */}
            <Tabs.Content value="email" className="mt-4 space-y-4">
              <form onSubmit={handleShareByEmail} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレスを入力"
                  required
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  共有
                </button>
              </form>

              {/* 既存のメール共有一覧 */}
              {existingShares.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">共有中のユーザー</h4>
                  {existingShares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2"
                    >
                      <span className="text-sm">{share.sharedWithEmail}</span>
                      <button
                        onClick={() => handleRevokeShare(share.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        解除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Tabs.Content>

            {/* リンクで共有 */}
            <Tabs.Content value="link" className="mt-4 space-y-4">
              {linkShare ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    リンクを知っている人が閲覧できます。
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      {copied ? 'コピーしました' : 'コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => handleRevokeShare(linkShare.id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    リンク共有を解除
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    リンクを作成すると、リンクを知っている人がこのコンテンツを閲覧できるようになります。
                  </p>
                  <button
                    onClick={handleCreateLink}
                    disabled={loading}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    共有リンクを作成
                  </button>
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>

          {/* メッセージ */}
          {message && (
            <div
              className={`mt-4 rounded-md px-3 py-2 text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-600'
              }`}
            >
              {message.text}
            </div>
          )}

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              aria-label="閉じる"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
