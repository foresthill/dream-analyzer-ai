import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyMcpToken } from '@/lib/mcp-auth';
import { userIdFromAccessToken } from '@/lib/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function withCors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', '*');
  res.headers.set('Access-Control-Expose-Headers', 'WWW-Authenticate, Mcp-Session-Id');
  return res;
}

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = { name: 'dream-analyzer', version: '1.0.0' };

type JsonRpcId = string | number | null;
type TextContent = { type: 'text'; text: string };

function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: '2.0' as const, id, result };
}
function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: '2.0' as const, id, error: { code, message } };
}
function text(obj: unknown): TextContent[] {
  return [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }];
}
function clamp(n: unknown, min: number, max: number, dflt: number): number {
  const v = typeof n === 'number' ? n : parseInt(String(n ?? ''), 10);
  if (!Number.isFinite(v)) return dflt;
  return Math.max(min, Math.min(max, v));
}

// 公開ツール定義（すべて読み取り専用・userIdで厳密にスコープ）
const TOOLS = [
  {
    name: 'list_dreamers',
    description: 'この人が登録している「夢を見た人」（自分・家族など）の一覧を返す。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_dreams',
    description: '夢の一覧を新しい順に返す。dreamerId を指定するとその人の夢のみ。',
    inputSchema: {
      type: 'object',
      properties: {
        dreamerId: { type: 'string', description: '「夢を見た人」のID（省略可）' },
        limit: { type: 'number', description: '最大件数（1-50, 既定20）' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_dream',
    description: '指定した夢の詳細（内容・属性・保存済みの分析）を返す。',
    inputSchema: {
      type: 'object',
      properties: { dreamId: { type: 'string', description: '夢のID' } },
      required: ['dreamId'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_dreams',
    description: 'タイトル・本文にキーワードを含む夢を検索する（新しい順）。',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '検索キーワード' },
        limit: { type: 'number', description: '最大件数（1-50, 既定20）' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_analysis',
    description: '指定した夢に保存されている分析結果（複数モデル分）を返す。',
    inputSchema: {
      type: 'object',
      properties: { dreamId: { type: 'string', description: '夢のID' } },
      required: ['dreamId'],
      additionalProperties: false,
    },
  },
];

async function callTool(userId: string, name: string, args: Record<string, unknown>): Promise<TextContent[]> {
  switch (name) {
    case 'list_dreamers': {
      const dreamers = await prisma.dreamer.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { dreams: true } } },
      });
      return text(
        dreamers.map((d) => ({
          id: d.id,
          name: d.name,
          relationship: d.relationship,
          notes: d.notes,
          dreamCount: d._count.dreams,
        }))
      );
    }
    case 'list_dreams': {
      const dreams = await prisma.dream.findMany({
        where: {
          userId,
          ...(typeof args.dreamerId === 'string' ? { dreamerId: args.dreamerId } : {}),
        },
        orderBy: { date: 'desc' },
        take: clamp(args.limit, 1, 50, 20),
        include: { dreamer: { select: { name: true } } },
      });
      return text(
        dreams.map((d) => ({
          id: d.id,
          date: d.date.toISOString().split('T')[0],
          title: d.title,
          mood: d.mood,
          dreamer: d.dreamer.name,
          analyzed: d.analyzed,
          excerpt: d.content.slice(0, 120),
        }))
      );
    }
    case 'get_dream': {
      const dreamId = String(args.dreamId ?? '');
      const dream = await prisma.dream.findFirst({
        where: { id: dreamId, userId },
        include: {
          dreamer: { select: { name: true, relationship: true } },
          analyses: { orderBy: { analyzedAt: 'desc' } },
        },
      });
      if (!dream) throw new Error('夢が見つかりません（IDが違うか、あなたの夢ではありません）');
      return text(dream);
    }
    case 'search_dreams': {
      const query = String(args.query ?? '').trim();
      if (!query) throw new Error('query は必須です');
      const dreams = await prisma.dream.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: clamp(args.limit, 1, 50, 20),
        include: { dreamer: { select: { name: true } } },
      });
      return text(
        dreams.map((d) => ({
          id: d.id,
          date: d.date.toISOString().split('T')[0],
          title: d.title,
          dreamer: d.dreamer.name,
          excerpt: d.content.slice(0, 120),
        }))
      );
    }
    case 'get_analysis': {
      const dreamId = String(args.dreamId ?? '');
      const dream = await prisma.dream.findFirst({
        where: { id: dreamId, userId },
        include: { analyses: { orderBy: { analyzedAt: 'desc' } } },
      });
      if (!dream) throw new Error('夢が見つかりません（IDが違うか、あなたの夢ではありません）');
      return text(dream.analyses);
    }
    default:
      throw new Error(`未知のツール: ${name}`);
  }
}

async function handleMessage(userId: string, msg: { id?: JsonRpcId; method?: string; params?: Record<string, unknown> }) {
  const id: JsonRpcId = msg?.id ?? null;
  const method = msg?.method;
  const params = msg?.params || {};

  // 通知（idなし）は応答不要
  if (method && method.startsWith('notifications/')) return null;

  switch (method) {
    case 'initialize':
      return rpcResult(id, {
        protocolVersion: (params.protocolVersion as string) || PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: TOOLS });
    case 'tools/call': {
      const name = String(params.name ?? '');
      const args = (params.arguments as Record<string, unknown>) || {};
      try {
        const content = await callTool(userId, name, args);
        return rpcResult(id, { content, isError: false });
      } catch (e) {
        return rpcResult(id, {
          content: text(`エラー: ${e instanceof Error ? e.message : String(e)}`),
          isError: true,
        });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// リモートMCP（Streamable HTTP）。JSON-RPC 2.0 を JSON で応答するステートレス実装。
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  // 静的トークン(dmcp_) または OAuthアクセストークン(JWT) のどちらでも可
  const userId = verifyMcpToken(authHeader) || userIdFromAccessToken(authHeader);
  if (!userId) {
    const origin = new URL(request.url).origin;
    const res = new NextResponse(JSON.stringify({ error: 'invalid_token' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        // OAuthクライアントにメタデータの場所を知らせる（RFC 9728）
        'WWW-Authenticate': `Bearer error="invalid_token", resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
      },
    });
    return withCors(res);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'Parse error'));
  }

  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map((m) => handleMessage(userId, m)))).filter(Boolean);
    if (responses.length === 0) return withCors(new NextResponse(null, { status: 202 }));
    return withCors(NextResponse.json(responses));
  }

  const response = await handleMessage(userId, body as { id?: JsonRpcId; method?: string; params?: Record<string, unknown> });
  if (!response) return withCors(new NextResponse(null, { status: 202 }));
  return withCors(NextResponse.json(response));
}

// サーバー起点のSSEストリームは未対応
export async function GET() {
  return new NextResponse('Method Not Allowed. Use POST (JSON-RPC).', { status: 405 });
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
