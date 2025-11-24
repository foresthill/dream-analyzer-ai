export interface AnalysisRequest {
  dream: {
    title: string;
    content: string;
    mood: string;
    emotions?: string[];
    setting?: string;
    characters?: string[];
  };
  userContext?: {
    recentDreams?: string[];
    recurringThemes?: string[];
  };
}

export interface AnalysisResponse {
  psychologicalInterpretation: string;
  symbols: Array<{
    symbol: string;
    category: string;
    interpretation: string;
  }>;
  themes: string[];
  emotionalAnalysis: {
    primary: string;
    secondary: string[];
    intensity: number;
  };
  underlyingMeanings: string[];
  insights: string[];
}

export interface InsightData {
  totalDreams: number;
  moodDistribution: Record<string, number>;
  commonSymbols: Array<{
    symbol: string;
    count: number;
  }>;
  commonThemes: Array<{
    theme: string;
    count: number;
  }>;
  averageLucidity: number;
  averageVividness: number;
  dreamFrequency: Array<{
    date: string;
    count: number;
  }>;
}
