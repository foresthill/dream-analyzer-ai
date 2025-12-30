import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import Anthropic from '@anthropic-ai/sdk';

interface RouteParams {
  params: Promise<{ analysisId: string }>;
}

// Helper to verify analysis belongs to user
async function verifyAnalysisOwnership(analysisId: string, userId: string) {
  const analysis = await prisma.dreamAnalysis.findFirst({
    where: { id: analysisId },
    include: { dream: { select: { userId: true } } },
  });
  return analysis?.dream.userId === userId ? analysis : null;
}

// GET /api/analyze/[analysisId]/chat - Get conversation history
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = await params;

    // Verify ownership
    const analysis = await verifyAnalysisOwnership(analysisId, session.user.id);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const conversations = await prisma.analysisConversation.findMany({
      where: { analysisId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/analyze/[analysisId]/chat - Send a message and get AI response
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = await params;
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get the analysis with dream data (verify ownership)
    const analysis = await prisma.dreamAnalysis.findFirst({
      where: { id: analysisId },
      include: {
        dream: true,
        conversations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!analysis || analysis.dream.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Save user message
    const userMessage = await prisma.analysisConversation.create({
      data: {
        analysisId,
        role: 'user',
        content: message,
      },
    });

    // Build conversation context
    const existingConversations = analysis.conversations.map((c) => ({
      role: c.role as 'user' | 'assistant',
      content: c.content,
    }));

    // Add the new user message
    existingConversations.push({
      role: 'user',
      content: message,
    });

    // Prepare analysis context
    const analysisContext = `
夢の内容:
タイトル: ${analysis.dream.title}
内容: ${analysis.dream.content}

既存の分析結果:
心理学的解釈: ${analysis.psychologicalInterpretation}

シンボル分析:
${(analysis.symbols as Array<{ symbol: string; category: string; interpretation: string }>)
  .map((s) => `- ${s.symbol} (${s.category}): ${s.interpretation}`)
  .join('\n')}

テーマ: ${analysis.themes.join(', ')}

潜在的な意味:
${analysis.underlyingMeanings.map((m) => `- ${m}`).join('\n')}

洞察・アドバイス:
${analysis.insights.map((i) => `- ${i}`).join('\n')}
`;

    // Get AI provider configuration
    const provider = (analysis.provider || 'anthropic') as 'anthropic' | 'openrouter';
    const apiKey = provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }

    let aiResponse: string;

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: analysis.model || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `あなたは夢分析の専門家です。以下の夢とその分析結果に基づいて、ユーザーの質問に答えたり、分析を深めたり、修正を提案したりしてください。

${analysisContext}

ユーザーからの質問や要望に対して、夢分析の観点から丁寧に、かつ洞察に富んだ回答を提供してください。必要に応じて、心理学的な視点や象徴的な解釈を加えてください。回答は最後まで完結させてください。`,
        messages: existingConversations.map((c) => ({
          role: c.role,
          content: c.content,
        })),
      });

      aiResponse = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // 回答が途中で切れた場合の警告
      if (response.stop_reason === 'max_tokens') {
        aiResponse += '\n\n（※回答が長くなったため途中で切れています。「続きを教えて」と聞いてください）';
      }
    } else {
      // OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: analysis.model || 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: `あなたは夢分析の専門家です。以下の夢とその分析結果に基づいて、ユーザーの質問に答えたり、分析を深めたり、修正を提案したりしてください。

${analysisContext}

ユーザーからの質問や要望に対して、夢分析の観点から丁寧に、かつ洞察に富んだ回答を提供してください。必要に応じて、心理学的な視点や象徴的な解釈を加えてください。回答は最後まで完結させてください。`,
            },
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

      // 回答が途中で切れた場合の警告
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
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// DELETE /api/analyze/[analysisId]/chat - Clear conversation history
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = await params;

    // Verify ownership
    const analysis = await verifyAnalysisOwnership(analysisId, session.user.id);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    await prisma.analysisConversation.deleteMany({
      where: { analysisId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversations:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversations' },
      { status: 500 }
    );
  }
}
