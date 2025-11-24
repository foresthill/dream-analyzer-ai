import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisRequest, AnalysisResponse } from '@dream-analyzer/shared-types';

export class DreamAnalyzer {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const prompt = this.buildPrompt(request);

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textBlock = message.content[0];
    if (textBlock.type !== 'text') {
      throw new Error('Unexpected response type');
    }
    const response = textBlock.text;
    return this.parseResponse(response);
  }

  private buildPrompt(request: AnalysisRequest): string {
    return `あなたは経験豊富な夢分析の専門家です。以下の夢を心理学的・象徴的に分析してください。

【夢の内容】
タイトル: ${request.dream.title}
詳細: ${request.dream.content}
気分: ${request.dream.mood}
${request.dream.emotions ? `感情: ${request.dream.emotions.join(', ')}` : ''}
${request.dream.setting ? `場所: ${request.dream.setting}` : ''}
${request.dream.characters ? `登場人物: ${request.dream.characters.join(', ')}` : ''}

${
  request.userContext?.recentDreams
    ? `
【最近の夢】
${request.userContext.recentDreams.join('\n')}
`
    : ''
}

以下のJSON形式で分析結果を返してください：

\`\`\`json
{
  "psychologicalInterpretation": "心理学的解釈（200-300文字）",
  "symbols": [
    {
      "symbol": "シンボル名",
      "category": "people|animals|places|objects|actions|emotions|nature|colors|numbers|abstract",
      "interpretation": "このシンボルの意味"
    }
  ],
  "themes": ["テーマ1", "テーマ2"],
  "emotionalAnalysis": {
    "primary": "主要な感情",
    "secondary": ["副次的な感情1", "副次的な感情2"],
    "intensity": 7
  },
  "underlyingMeanings": ["潜在的な意味1", "潜在的な意味2"],
  "insights": ["洞察・アドバイス1", "洞察・アドバイス2"]
}
\`\`\`

JSONのみを返してください。`;
  }

  private parseResponse(response: string): AnalysisResponse {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : response;

    try {
      return JSON.parse(jsonText);
    } catch {
      throw new Error('Failed to parse analysis response');
    }
  }
}
