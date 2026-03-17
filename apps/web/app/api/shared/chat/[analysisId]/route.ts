import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import Anthropic from '@anthropic-ai/sdk';

interface RouteParams {
  params: Promise<{ analysisId: string }>;
}

// 共有先ユーザーがこの分析にアクセスできるか検証
async function verifySharedAccess(analysisId: string, options: { email?: string; shareToken?: string }) {
  const analysis = await prisma.dreamAnalysis.findFirst({
    where: { id: analysisId },
    include: { dream: { select: { id: true, userId: true } } },
  });

  if (!analysis) return { exists: false, analysis: null };

  const dreamId = analysis.dream.id;

  // リンク共有の場合
  if (options.shareToken) {
    const share = await prisma.dreamShare.findFirst({
      where: {
        shareToken: options.shareToken,
        OR: [
          { dreamId },
          { dreamer: { dreams: { some: { id: dreamId } } } },
        ],
      },
    });
    if (share) return { exists: true, analysis };
  }

  // メール共有の場合
  if (options.email) {
    const share = await prisma.dreamShare.findFirst({
      where: {
        shareType: 'EMAIL',
        sharedWithEmail: options.email,
        OR: [
          { dreamId },
          { dreamer: { dreams: { some: { id: dreamId } } } },
        ],
      },
    });
    if (share) return { exists: true, analysis };
  }

  // オーナー自身の場合
  return { exists: false, analysis: null };
}

// GET /api/shared/chat/[analysisId] - 共有された分析の会話履歴を取得
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { analysisId } = await params;
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token') || undefined;

    // 認証チェック（トークンなしの場合はログイン必須）
    const session = await auth();
    const email = session?.user?.email || undefined;

    if (!shareToken && !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exists, analysis } = await verifySharedAccess(analysisId, { email, shareToken });
    if (!exists || !analysis) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const conversations = await prisma.analysisConversation.findMany({
      where: { analysisId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching shared conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/shared/chat/[analysisId] - 共有先ユーザーが質問を送信
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { analysisId } = await params;
    const { message, shareToken, userName: customUserName } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 認証チェック
    const session = await auth();
    const email = session?.user?.email || undefined;

    if (!shareToken && !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exists, analysis } = await verifySharedAccess(analysisId, { email, shareToken });
    if (!exists || !analysis) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // ユーザー名を決定
    const userName = session?.user?.name || customUserName || 'ゲスト';

    // 分析データを取得
    const fullAnalysis = await prisma.dreamAnalysis.findFirst({
      where: { id: analysisId },
      include: {
        dream: true,
        conversations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!fullAnalysis) {
      return NextResponse.json({ error: '分析が見つかりません' }, { status: 404 });
    }

    // Save user message
    const userMessage = await prisma.analysisConversation.create({
      data: {
        analysisId,
        role: 'user',
        content: message,
        userName,
      },
    });

    // Build conversation context
    const existingConversations = fullAnalysis.conversations.map((c) => ({
      role: c.role as 'user' | 'assistant',
      content: c.content,
    }));

    existingConversations.push({
      role: 'user',
      content: message,
    });

    // Prepare analysis context
    const analysisContext = `
夢の内容:
タイトル: ${fullAnalysis.dream.title}
内容: ${fullAnalysis.dream.content}

既存の分析結果:
心理学的解釈: ${fullAnalysis.psychologicalInterpretation}

シンボル分析:
${(fullAnalysis.symbols as Array<{ symbol: string; category: string; interpretation: string }>)
  .map((s) => `- ${s.symbol} (${s.category}): ${s.interpretation}`)
  .join('\n')}

テーマ: ${fullAnalysis.themes.join(', ')}

潜在的な意味:
${fullAnalysis.underlyingMeanings.map((m) => `- ${m}`).join('\n')}

洞察・アドバイス:
${fullAnalysis.insights.map((i) => `- ${i}`).join('\n')}
`;

    // Get AI provider configuration
    const provider = (fullAnalysis.provider || 'anthropic') as 'anthropic' | 'openrouter';
    const apiKey = provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    let aiResponse: string;
    const modelUsed = provider === 'anthropic'
      ? (fullAnalysis.model || 'claude-sonnet-4-20250514')
      : (fullAnalysis.model || 'anthropic/claude-3.5-sonnet');

    const systemPrompt = `あなたは夢分析の専門家です。以下の夢とその分析結果に基づいて、ユーザーの質問に答えたり、分析を深めたり、修正を提案したりしてください。

${analysisContext}

ユーザーからの質問や要望に対して、夢分析の観点から丁寧に、かつ洞察に富んだ回答を提供してください。必要に応じて、心理学的な視点や象徴的な解釈を加えてください。回答は最後まで完結させてください。`;

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: modelUsed,
        max_tokens: 4096,
        system: systemPrompt,
        messages: existingConversations.map((c) => ({
          role: c.role,
          content: c.content,
        })),
      });

      aiResponse = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      if (response.stop_reason === 'max_tokens') {
        aiResponse += '\n\n（※回答が長くなったため途中で切れています。「続きを教えて」と聞いてください）';
      }
    } else {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [
            { role: 'system', content: systemPrompt },
            ...existingConversations.map((c) => ({
              role: c.role,
              content: c.content,
            })),
          ],
          max_tokens: 4096,
        }),
      });

      const data = await response.json();
      aiResponse = data.choices?.[0]?.message?.content || '';

      if (data.choices?.[0]?.finish_reason === 'length') {
        aiResponse += '\n\n（※回答が長くなったため途中で切れています。「続きを教えて」と聞いてください）';
      }
    }

    // Save AI response
    const assistantMessage = await prisma.analysisConversation.create({
      data: {
        analysisId,
        role: 'assistant',
        content: aiResponse,
        modelName: modelUsed,
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error('Error in shared chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
