'use client';

import { useState, useEffect } from 'react';
import type { Dream } from '@dream-analyzer/shared-types';

export function useDreams() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDreams();
  }, []);

  const fetchDreams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dreams');
      if (!response.ok) {
        throw new Error('Failed to fetch dreams');
      }
      const data = await response.json();
      setDreams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return { dreams, isLoading, error, refetch: fetchDreams };
}
