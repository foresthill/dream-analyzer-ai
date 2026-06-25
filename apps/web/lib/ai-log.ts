import { prisma } from '@/lib/db';
import type { AiLogOperation, AiLogStatus } from '@prisma/client';

/**
 * AI動作ログの管理者メールアドレス。
 * このユーザーは全ユーザー分のログを閲覧できる。
 * 環境変数 AI_LOG_ADMIN_EMAILS（カンマ区切り）で上書き／追加可能。
 */
const DEFAULT_ADMIN_EMAILS = ['g1989n@gmail.com'];

export function getAdminEmails(): string[] {
  const fromEnv = (process.env.AI_LOG_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const merged = new Set([
    ...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...fromEnv,
  ]);
  return Array.from(merged);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export interface RecordAiLogInput {
  userId: string;
  operation: AiLogOperation;
  provider: string;
  model: string;
  prompt: string;
  systemPrompt?: string | null;
  response?: string | null;
  status: AiLogStatus;
  errorMessage?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  latencyMs?: number | null;
  dreamId?: string | null;
  analysisId?: string | null;
}

/**
 * AI呼び出しの動作ログを保存する。
 * ログ保存自体の失敗が本処理を壊さないよう、例外は握りつぶしてconsoleに出す。
 */
export async function recordAiLog(input: RecordAiLogInput): Promise<void> {
  try {
    await prisma.aiLog.create({
      data: {
        userId: input.userId,
        operation: input.operation,
        provider: input.provider,
        model: input.model,
        prompt: input.prompt,
        systemPrompt: input.systemPrompt ?? null,
        response: input.response ?? null,
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        promptTokens: input.promptTokens ?? null,
        completionTokens: input.completionTokens ?? null,
        latencyMs: input.latencyMs ?? null,
        dreamId: input.dreamId ?? null,
        analysisId: input.analysisId ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to record AI log:', error);
  }
}
