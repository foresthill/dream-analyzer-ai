import type { AnalysisRequest } from '@dream-analyzer/shared-types';

export function buildAnalysisPrompt(request: AnalysisRequest): string {
  let prompt = `あなたは経験豊富な夢分析の専門家です。以下の夢を心理学的・象徴的に分析してください。

【夢の内容】
タイトル: ${request.dream.title}
詳細: ${request.dream.content}
気分: ${request.dream.mood}`;

  if (request.dream.emotions?.length) {
    prompt += `\n感情: ${request.dream.emotions.join(', ')}`;
  }

  if (request.dream.setting) {
    prompt += `\n場所: ${request.dream.setting}`;
  }

  if (request.dream.characters?.length) {
    prompt += `\n登場人物: ${request.dream.characters.join(', ')}`;
  }

  if (request.userContext?.recentDreams?.length) {
    prompt += `\n\n【最近の夢】\n${request.userContext.recentDreams.join('\n')}`;
  }

  if (request.userContext?.recurringThemes?.length) {
    prompt += `\n\n【繰り返し現れるテーマ】\n${request.userContext.recurringThemes.join(', ')}`;
  }

  prompt += `

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

  return prompt;
}
