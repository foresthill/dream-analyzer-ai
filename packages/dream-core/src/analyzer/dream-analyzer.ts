import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisRequest, AnalysisResponse, SymbolEntry } from '@dream-analyzer/shared-types';
import { SYMBOL_DATABASE } from '../symbols/symbol-database';

export type AIProvider = 'anthropic' | 'openrouter';

export interface DreamAnalyzerConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
}

// 動作ログ用に、解析結果に加えて生のやり取りを返す
export interface AnalysisRunResult {
  result: AnalysisResponse;
  prompt: string;       // AIに送信したプロンプト
  rawResponse: string;  // AIから返ってきた生レスポンス
  provider: AIProvider;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
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
        ? 'claude-sonnet-5'
        : 'anthropic/claude-sonnet-4.5';
    }

    // Initialize Anthropic client if using anthropic provider
    if (this.provider === 'anthropic') {
      this.anthropicClient = new Anthropic({ apiKey: this.apiKey });
    }
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const { result } = await this.run(request);
    return result;
  }

  // analyze() と同じ処理だが、動作ログ用に生のプロンプト／レスポンス／使用量も返す
  async run(request: AnalysisRequest): Promise<AnalysisRunResult> {
    const prompt = this.buildPrompt(request);
    const startedAt = Date.now();

    const { rawText, usage } = this.provider === 'anthropic'
      ? await this.callAnthropic(prompt)
      : await this.callOpenRouter(prompt);

    const latencyMs = Date.now() - startedAt;

    return {
      result: this.parseResponse(rawText),
      prompt,
      rawResponse: rawText,
      provider: this.provider,
      model: this.model,
      usage,
      latencyMs,
    };
  }

  private async callAnthropic(prompt: string): Promise<{ rawText: string; usage: TokenUsage }> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const message = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 4096,
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

    return {
      rawText: textBlock.text,
      usage: {
        promptTokens: message.usage?.input_tokens,
        completionTokens: message.usage?.output_tokens,
      },
    };
  }

  private async callOpenRouter(prompt: string): Promise<{ rawText: string; usage: TokenUsage }> {
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
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from OpenRouter API');
    }

    return {
      rawText: text,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      },
    };
  }

  // 夢の内容に関連するシンボル辞典のエントリを抽出する（最大 limit 件）。
  // シンボル名・関連シンボル・キーワードのいずれかが夢テキストに含まれれば該当とみなす。
  private findRelevantSymbols(request: AnalysisRequest, limit = 8): SymbolEntry[] {
    const haystack = [
      request.dream.title,
      request.dream.content,
      request.dream.setting || '',
      ...(request.dream.characters || []),
      ...(request.dream.emotions || []),
    ]
      .join(' ')
      .toLowerCase();

    const matches: SymbolEntry[] = [];
    for (const entry of SYMBOL_DATABASE) {
      const terms = [entry.symbol, ...(entry.relatedSymbols || []), ...(entry.keywords || [])];
      if (terms.some((t) => t && haystack.includes(t.toLowerCase()))) {
        matches.push(entry);
      }
      if (matches.length >= limit) break;
    }
    return matches;
  }

  private buildSymbolReference(symbols: SymbolEntry[]): string {
    if (symbols.length === 0) return '';
    const lines = symbols.map((s) => {
      const i = s.interpretations;
      const parts = [i.general, i.positive && `肯定:${i.positive}`, i.negative && `否定:${i.negative}`]
        .filter(Boolean)
        .join(' / ');
      return `- ${s.symbol}（${s.category}）: ${parts}`;
    });
    return `
【参考: シンボル辞典（この夢に関連しそうな項目）】
以下はキュレーションされた参考情報です。妥当な範囲で解釈の裏付けに使い、当てはまらない場合は無理に使わないでください。
${lines.join('\n')}
`;
  }

  private buildPrompt(request: AnalysisRequest): string {
    const hasHistory = request.userContext?.recentDreams && request.userContext.recentDreams.length > 0;

    let historySection = '';
    if (hasHistory) {
      historySection = `
【この人の最近の夢の履歴】
${request.userContext!.recentDreams!.join('\n')}
`;
      if (request.userContext!.recurringThemes?.length) {
        historySection += `
繰り返し出現するテーマ: ${request.userContext!.recurringThemes.join(', ')}`;
      }
      if (request.userContext!.recurringSymbols?.length) {
        historySection += `
繰り返し出現するシンボル: ${request.userContext!.recurringSymbols.join(', ')}`;
      }
      historySection += `

上記の履歴・パターンを踏まえて、今回の夢が過去の夢とどう関連するか、繰り返し現れるテーマやシンボルに変化や発展があるかにも言及してください。
`;
    }

    const symbolReference = this.buildSymbolReference(this.findRelevantSymbols(request));

    return `あなたは臨床心理学と夢分析に精通した専門家です。ユング心理学（元型・影・アニマ/アニムス・集合的無意識）、フロイト的視点（願望充足・抑圧）、および現代の認知・感情理論を統合し、決めつけを避けながら、この人にとっての意味を丁寧に読み解いてください。

【夢の内容】
タイトル: ${request.dream.title}
詳細: ${request.dream.content}
気分: ${request.dream.mood}
${request.dream.emotions ? `感情: ${request.dream.emotions.join(', ')}` : ''}
${request.dream.setting ? `場所: ${request.dream.setting}` : ''}
${request.dream.characters ? `登場人物: ${request.dream.characters.join(', ')}` : ''}
${historySection}${symbolReference}
【分析の指針】
1. 夢の情景・登場人物・感情の流れを丁寧に追い、表面的な出来事の奥にある心理を読む。
2. 主要なシンボルを特定し、複数の解釈の可能性（肯定的・否定的の両面）を示す。断定しすぎない。
3. この人の気分・感情・状況（および履歴があればそのパターン）と結びつけ、その人固有の文脈で解釈する。
4. 最後に、日常で活かせる具体的で優しい洞察・アドバイスを添える。

まず頭の中で上記に沿って分析を組み立て、そのうえで**最終結果を必ず次のJSON形式のコードブロックで**出力してください（コードブロックの前に思考を書いても構いません。最終的な機械可読の答えはJSONブロックのみとします）。

\`\`\`json
{
  "psychologicalInterpretation": "統合的な心理学的解釈（300-400文字、具体的に）",
  "symbols": [
    {
      "symbol": "シンボル名",
      "category": "people|animals|places|objects|actions|emotions|nature|colors|numbers|abstract",
      "interpretation": "このシンボルの意味（両面の可能性に触れる）"
    }
  ],
  "themes": ["テーマ1", "テーマ2", "テーマ3"],
  "emotionalAnalysis": {
    "primary": "主要な感情",
    "secondary": ["副次的な感情1", "副次的な感情2"],
    "intensity": 7
  },
  "underlyingMeanings": ["潜在的な意味1", "潜在的な意味2", "潜在的な意味3"],
  "insights": ["洞察・アドバイス1", "洞察・アドバイス2", "洞察・アドバイス3"]
}
\`\`\`

JSONの値は必ず日本語で、intensity は1〜10の整数にしてください。`;
  }

  private parseResponse(response: string): AnalysisResponse {
    // 思考→JSON の順で返ってくる場合や、コードフェンスの有無に強くする。
    let jsonText: string | undefined;

    const fenced = response.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      jsonText = fenced[1];
    } else {
      // フェンスが無い場合は最初の { から最後の } までを抽出
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        jsonText = response.slice(start, end + 1);
      }
    }

    if (!jsonText) {
      throw new Error('Failed to parse analysis response');
    }

    try {
      return JSON.parse(jsonText.trim());
    } catch {
      throw new Error('Failed to parse analysis response');
    }
  }
}
