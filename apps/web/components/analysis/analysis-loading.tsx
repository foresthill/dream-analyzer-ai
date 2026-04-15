'use client';

import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  '夢の世界に入り込んでいます...',
  'シンボルを読み解いています...',
  '潜在意識のメッセージを探っています...',
  '感情のパターンを分析しています...',
  '心理学的な解釈を構築しています...',
  '夢の意味を紡ぎ出しています...',
];

export function AnalysisLoading() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-background px-6 py-12">
      {/* Animated orbs */}
      <div className="relative mb-8 h-24 w-24">
        {/* Outer ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary/60" style={{ animationDuration: '3s' }} />
        {/* Middle ring */}
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-primary/40" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        {/* Inner glow */}
        <div className="absolute inset-4 animate-pulse rounded-full bg-primary/20" />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </div>
        {/* Floating particles */}
        <div className="absolute -left-2 top-1/2 h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: '0s', animationDuration: '2s' }} />
        <div className="absolute left-1/2 -top-2 h-1 w-1 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
        <div className="absolute -right-1 top-1/3 h-1.5 w-1.5 animate-bounce rounded-full bg-primary/30" style={{ animationDelay: '1s', animationDuration: '1.8s' }} />
        <div className="absolute bottom-0 left-1/4 h-1 w-1 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }} />
      </div>

      {/* Progress message */}
      <p
        key={messageIndex}
        className="animate-fade-in text-center text-sm font-medium text-primary"
      >
        {LOADING_MESSAGES[messageIndex]}
      </p>

      {/* Subtle hint */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        AIが夢を分析しています。30秒ほどかかる場合があります。
      </p>
    </div>
  );
}
