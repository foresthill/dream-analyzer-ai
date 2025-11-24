'use client';

import { useState } from 'react';
import type { AnalysisResponse } from '@dream-analyzer/shared-types';

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeDream = async (dreamId: string): Promise<AnalysisResponse | null> => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreamId }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze dream');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeDream, isAnalyzing, error };
}
