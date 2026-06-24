'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface AiLog {
  id: string;
  userId: string;
  dreamId: string | null;
  analysisId: string | null;
  operation: 'ANALYZE' | 'CHAT';
  provider: string;
  model: string;
  systemPrompt: string | null;
  prompt: string;
  response: string | null;
  status: 'SUCCESS' | 'ERROR';
  errorMessage: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latencyMs: number | null;
  createdAt: string;
  user?: { name: string | null; email: string | null };
}

interface LogsResponse {
  logs: AiLog[];
  total: number;
  page: number;
  totalPages: number;
  isAdmin: boolean;
  scope: 'mine' | 'all';
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const OPERATION_LABEL: Record<AiLog['operation'], string> = {
  ANALYZE: '夢の分析',
  CHAT: '対話',
};

function CodeBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-muted-foreground">{label}</div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-secondary/60 p-3 text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

export default function LogsPage() {
  const { status } = useSession();
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [operation, setOperation] = useState<'' | 'ANALYZE' | 'CHAT'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'SUCCESS' | 'ERROR'>('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('scope', scope);
      if (operation) params.set('operation', operation);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));

      const res = await fetch(`/api/ai-logs?${params.toString()}`);
      if (!res.ok) {
        throw new Error('ログの取得に失敗しました');
      }
      const json: LogsResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, [scope, operation, statusFilter, page]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLogs();
    }
  }, [status, fetchLogs]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (status === 'loading') {
    return <p className="text-muted-foreground">読み込み中...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">AIログ</h1>
        <p className="text-muted-foreground">
          このページを表示するには
          <Link href="/login" className="ml-1 underline">
            ログイン
          </Link>
          してください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AIログ（動作ログ）</h1>
        <p className="text-muted-foreground">
          AIに送信したプロンプトと返ってきたレスポンスの履歴です。
        </p>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-3">
        {data?.isAdmin && (
          <div className="flex items-center rounded-md border border-border p-0.5 text-sm">
            <button
              onClick={() => { setScope('mine'); setPage(1); }}
              className={`rounded px-3 py-1 ${scope === 'mine' ? 'bg-secondary' : ''}`}
            >
              自分の分
            </button>
            <button
              onClick={() => { setScope('all'); setPage(1); }}
              className={`rounded px-3 py-1 ${scope === 'all' ? 'bg-secondary' : ''}`}
            >
              全ユーザー
            </button>
          </div>
        )}

        <select
          value={operation}
          onChange={(e) => { setOperation(e.target.value as typeof operation); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">すべての操作</option>
          <option value="ANALYZE">夢の分析</option>
          <option value="CHAT">対話</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">すべての結果</option>
          <option value="SUCCESS">成功</option>
          <option value="ERROR">エラー</option>
        </select>

        <button
          onClick={fetchLogs}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          更新
        </button>

        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            全 {data.total} 件
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : !data || data.logs.length === 0 ? (
        <p className="text-muted-foreground">ログがありません。</p>
      ) : (
        <div className="space-y-3">
          {data.logs.map((log) => {
            const isOpen = expanded.has(log.id);
            return (
              <div
                key={log.id}
                className="rounded-lg border border-border bg-background"
              >
                <button
                  onClick={() => toggle(log.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      log.status === 'SUCCESS'
                        ? 'bg-green-500/15 text-green-600'
                        : 'bg-red-500/15 text-red-600'
                    }`}
                  >
                    {log.status === 'SUCCESS' ? '成功' : 'エラー'}
                  </span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                    {OPERATION_LABEL[log.operation]}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {log.provider} / {log.model}
                  </span>
                  {data.scope === 'all' && log.user && (
                    <span className="hidden text-xs text-muted-foreground md:block">
                      👤 {log.user.name || log.user.email}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </span>
                  <span className="text-xs text-muted-foreground">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-border px-4 py-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      <span>プロバイダ: {log.provider}</span>
                      <span>モデル: {log.model}</span>
                      {log.latencyMs != null && <span>所要時間: {log.latencyMs} ms</span>}
                      {log.promptTokens != null && <span>入力トークン: {log.promptTokens}</span>}
                      {log.completionTokens != null && <span>出力トークン: {log.completionTokens}</span>}
                      {log.dreamId && (
                        <Link href={`/dreams/${log.dreamId}`} className="underline">
                          対象の夢を開く
                        </Link>
                      )}
                    </div>

                    {log.systemPrompt && (
                      <CodeBlock label="システムプロンプト" text={log.systemPrompt} />
                    )}
                    <CodeBlock label="送信プロンプト" text={log.prompt} />
                    {log.status === 'ERROR' ? (
                      <CodeBlock
                        label="エラー"
                        text={log.errorMessage || '(エラー内容なし)'}
                      />
                    ) : (
                      <CodeBlock label="AIレスポンス" text={log.response || '(空)'} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ページング */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            前へ
          </button>
          <span className="text-sm text-muted-foreground">
            {data.page} / {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
