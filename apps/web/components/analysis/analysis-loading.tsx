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
    <div
      className="relative isolate flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-primary/20 px-6 py-12"
      style={{
        background:
          'radial-gradient(90% 120% at 50% -20%, rgba(167,139,250,.22), transparent 60%),' +
          'linear-gradient(to bottom, rgba(99,102,241,.06), var(--color-background))',
      }}
    >
      {/* ゆらめくオーロラの光 */}
      <div
        className="dream-aurora pointer-events-none absolute -inset-x-6 -top-16 -z-10 h-40 opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(40% 60% at 30% 50%, #7c5cff, transparent 70%),' +
            'radial-gradient(45% 55% at 70% 50%, #c878f0, transparent 70%)',
        }}
      />
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
