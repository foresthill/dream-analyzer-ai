export interface Dream {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: Date;

  // 夢の属性
  mood: DreamMood;
  lucidity: number;        // 明晰度（0-10）
  vividness: number;       // 鮮明度（0-10）
  emotionalIntensity: number; // 感情の強さ（0-10）

  // 環境・状況
  setting?: string;        // 場所・環境
  characters?: string[];   // 登場人物
  emotions?: string[];     // 感じた感情
  colors?: string[];       // 印象的な色

  // メタデータ
  sleepQuality?: number;   // 睡眠の質（0-10）
  bedTime?: Date;
  wakeTime?: Date;
  tags?: string[];

  // 分析結果
  analyzed: boolean;
  analysis?: DreamAnalysis;

  createdAt: Date;
  updatedAt: Date;
}

export type DreamMood =
  | 'joyful'
  | 'peaceful'
  | 'anxious'
  | 'fearful'
  | 'sad'
  | 'angry'
  | 'confused'
  | 'excited'
  | 'neutral';

export interface DreamAnalysis {
  id: string;
  dreamId: string;

  // 心理学的解釈
  psychologicalInterpretation: string;

  // シンボル分析
  symbols: DreamSymbol[];

  // テーマ
  themes: string[];

  // 感情分析
  emotionalAnalysis: {
    primary: string;
    secondary: string[];
    intensity: number;
  };

  // 潜在的意味
  underlyingMeanings: string[];

  // アドバイス・洞察
  insights: string[];

  // 関連する夢
  relatedDreams?: string[];

  analyzedAt: Date;
}

export interface DreamSymbol {
  symbol: string;
  category: SymbolCategory;
  interpretation: string;
  culturalContext?: string;
  personalRelevance?: number; // 0-10
}

export type SymbolCategory =
  | 'people'
  | 'animals'
  | 'places'
  | 'objects'
  | 'actions'
  | 'emotions'
  | 'nature'
  | 'colors'
  | 'numbers'
  | 'abstract';

export interface CreateDreamInput {
  title: string;
  content: string;
  date: Date;
  mood: DreamMood;
  lucidity?: number;
  vividness?: number;
  emotionalIntensity?: number;
  setting?: string;
  characters?: string[];
  emotions?: string[];
  colors?: string[];
  sleepQuality?: number;
  bedTime?: Date;
  wakeTime?: Date;
  tags?: string[];
}
