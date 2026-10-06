'use client';

// 表示用: 最初のコードフェンス（```）以降（＝保存用JSON）を隠し、読みやすい本文だけを見せる
export function stripJson(text: string): string {
  const fence = text.indexOf('```');
  return (fence === -1 ? text : text.slice(0, fence)).trim();
}

export interface StreamAnalysisResult {
  ok: boolean;
  error?: string;
}

/**
 * /api/analyze/stream を SSE で読み、本文（JSON部を除いた読みやすい文章）を
 * onText で逐次返す。iOS Safari でも逐次表示されるよう text/event-stream を使う。
 */
export async function streamAnalysis(
  body: { dreamId: string; provider: string; model: string },
  onText: (strippedText: string) => void
): Promise<StreamAnalysisResult> {
  const res = await fetch('/api/analyze/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // ストリーム開始前のエラー（未認証・APIキー未設定など）はJSONで返る
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    const base = data.error || `分析に失敗しました（HTTP ${res.status}）`;
    return { ok: false, error: data.detail ? `${base}\n詳細: ${data.detail}` : base };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let streamError: string | undefined;
  let finished = false;

  while (!finished) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE はイベントを空行（\n\n）で区切る
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      const dataPayload = rawEvent
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).replace(/^ /, ''))
        .join('\n');
      if (!dataPayload) continue;

      let msg: { type?: string; text?: string; error?: string; detail?: string };
      try {
        msg = JSON.parse(dataPayload);
      } catch {
        continue;
      }

      if (msg.type === 'delta') {
        full += msg.text ?? '';
        onText(stripJson(full));
      } else if (msg.type === 'done') {
        finished = true;
      } else if (msg.type === 'error') {
        streamError = msg.detail ? `${msg.error}\n詳細: ${msg.detail}` : (msg.error ?? '分析に失敗しました');
        finished = true;
      }
      // type === 'start' は何もしない（ストリームを開くためのダミー）
    }
  }

  if (streamError) return { ok: false, error: streamError };
  return { ok: true };
}
