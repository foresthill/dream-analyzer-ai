'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface TokenInfo {
  configured: boolean;
  url?: string;
  token?: string;
  error?: string;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード不可の環境では何もしない（手動選択でコピー）
    }
  };
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-secondary/60 px-3 py-2 text-xs">
          {value}
        </code>
        <button
          onClick={copy}
          className="shrink-0 rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
        >
          {copied ? 'コピー済' : 'コピー'}
        </button>
      </div>
    </div>
  );
}

export default function McpPage() {
  const { status } = useSession();
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      try {
        const res = await fetch('/api/mcp/token');
        setInfo(await res.json());
      } catch {
        setInfo({ configured: false, error: '接続情報の取得に失敗しました。' });
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (status === 'loading') return <p className="text-muted-foreground">読み込み中...</p>;
  if (status === 'unauthenticated') {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">MCP接続</h1>
        <p className="text-muted-foreground">
          <Link href="/login" className="underline">ログイン</Link> してください。
        </p>
      </div>
    );
  }

  const url = info?.url ?? '';
  const token = info?.token ?? '';
  const claudeCliCmd = url && token
    ? `claude mcp add --transport http dream-analyzer ${url} --header "Authorization: Bearer ${token}"`
    : '';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MCP接続</h1>
        <p className="text-muted-foreground">
          あなたの夢データを、Claude などのAIから読めるようにする接続情報です。
          分析や対話をより賢いモデルで、対話的に行えます。
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : !info?.configured ? (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          {info?.error || 'MCPはまだ利用できません。'}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            ⚠️ このトークンはあなたの夢データへの読み取りアクセス権を持ちます。他人に共有しないでください。
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-background p-4">
            <CopyField label="サーバーURL" value={url} />
            {revealed ? (
              <CopyField label="アクセストークン（秘密）" value={token} />
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
              >
                トークンを表示
              </button>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">接続方法</h2>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">A. Claude Code（CLI）</h3>
              <p className="text-sm text-muted-foreground">ターミナルで以下を実行:</p>
              {revealed && claudeCliCmd ? (
                <CopyField label="コマンド" value={claudeCliCmd} />
              ) : (
                <p className="text-xs text-muted-foreground">「トークンを表示」を押すとコマンドが出ます。</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">B. claude.ai / スマホアプリ（カスタムコネクター）</h3>
              <p className="text-sm text-muted-foreground">
                設定 → コネクター → カスタムコネクターを追加 → 上記の「サーバーURL」を登録します。
                ※ claude.ai 側は接続時にOAuthを求める場合があります。うまく繋がらない場合は、
                まず上記A（Claude Code）で動作確認するのが確実です（OAuth対応は次の段階で追加予定）。
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold">使えること（読み取り）</h2>
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              <li>list_dreamers … 「夢を見た人」の一覧</li>
              <li>list_dreams … 夢の一覧（人で絞り込み可）</li>
              <li>get_dream … 夢の詳細＋保存済み分析</li>
              <li>search_dreams … キーワード検索</li>
              <li>get_analysis … 保存済みの分析結果</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              例: 「最近の夢を5件見て、繰り返すテーマを深く分析して」とClaudeに頼めます。
            </p>
          </div>
        </>
      )}
    </div>
  );
}
