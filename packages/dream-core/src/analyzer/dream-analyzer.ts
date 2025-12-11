import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisRequest, AnalysisResponse } from '@dream-analyzer/shared-types';

export type AIProvider = 'anthropic' | 'openrouter';

export interface DreamAnalyzerConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export class DreamAnalyzer {
  private provider: AIProvider;
  private apiKey: string;
  private model: string;
  private anthropicClient?: Anthropic;

  constructor(config: DreamAnalyzerConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;

    // Set default models based on provider
    if (config.model) {
      this.model = config.model;
    } else {
      this.model = config.provider === 'anthropic'
        ? 'claude-sonnet-4-20250514'
        : 'anthropic/claude-3.5-sonnet';
    }

    // Initialize Anthropic client if using anthropic provider
    if (this.provider === 'anthropic') {
      this.anthropicClient = new Anthropic({ apiKey: this.apiKey });
    }
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const prompt = this.buildPrompt(request);

    if (this.provider === 'anthropic') {
      return this.analyzeWithAnthropic(prompt);
    } else {
      return this.analyzeWithOpenRouter(prompt);
    }
  }

  private async analyzeWithAnthropic(prompt: string): Promise<AnalysisResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const message = await this.anthropicClient.messages.create({
      model: this.model,
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

    return this.parseResponse(textBlock.text);
  }

  private async analyzeWithOpenRouter(prompt: string): Promise<AnalysisResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/foresthill/dream-analyzer-ai',
        'X-Title': 'Dream Analyzer',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from OpenRouter API');
    }

    return this.parseResponse(text);
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
