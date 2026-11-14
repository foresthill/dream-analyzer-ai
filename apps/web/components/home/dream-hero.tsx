'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Star {
  left: string;
  top: string;
  scale: number;
  delay: string;
}

export function DreamHero() {
  // 星はクライアントでランダム生成（SSRと不一致にならないよう初期は空）
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const next: Star[] = Array.from({ length: 46 }, () => ({
      left: `${(Math.random() * 100).toFixed(2)}%`,
      top: `${(Math.random() * 100).toFixed(2)}%`,
      scale: Number((Math.random() * 1.4 + 0.5).toFixed(2)),
      delay: `${(Math.random() * 3.5).toFixed(2)}s`,
    }));
    setStars(next);
  }, []);

  return (
    <header
      className="relative isolate overflow-hidden rounded-3xl px-6 py-9 text-[#f3f0ff] shadow-xl sm:px-8"
      style={{
        background:
          'radial-gradient(120% 90% at 85% -10%, rgba(200,120,240,.45), transparent 55%),' +
          'radial-gradient(90% 80% at 10% 120%, rgba(57,183,201,.30), transparent 60%),' +
          'linear-gradient(160deg, #1a1340, #3b2a7a 55%, #6d4fc4)',
      }}
    >
      {/* オーロラ */}
      <div
        className="dream-aurora pointer-events-none absolute -inset-x-[10%] -top-[30%] -z-10 h-[140%] opacity-50 blur-[28px]"
        style={{
          background:
            'radial-gradient(40% 60% at 30% 40%, #7c5cff, transparent 70%),' +
            'radial-gradient(45% 55% at 70% 55%, #c878f0, transparent 70%),' +
            'radial-gradient(40% 50% at 50% 70%, #39b7c9, transparent 70%)',
        }}
      />

      {/* 星空 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {stars.map((s, i) => (
          <span
            key={i}
            className="dream-star absolute h-0.5 w-0.5 rounded-full bg-[#e9e3ff]"
            style={{
              left: s.left,
              top: s.top,
              transform: `scale(${s.scale})`,
              animationDelay: s.delay,
              boxShadow: '0 0 6px 1px rgba(233,227,255,.8)',
            }}
          />
        ))}
      </div>

      {/* 三日月 */}
      <svg
        className="dream-moon absolute right-6 top-6 -z-10 h-14 w-14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f3f0ff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 0 16px rgba(233,227,255,.6))' }}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>

      <p className="mb-2.5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#d9cffb]">
        ✦ やさしい夢分析
      </p>
      <h1 className="m-0 text-balance text-4xl font-bold tracking-wide sm:text-5xl">夢日記</h1>
      <p className="mb-6 mt-2.5 max-w-[34ch] text-[15.5px] text-[#d7d0f3]">
        眠りのあいだに訪れた景色を書きとめて、AIと一緒にその意味をたどりましょう。
      </p>
      <Link
        href="/dreams/new"
        className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-bold text-white transition-transform active:translate-y-px"
        style={{
          background: 'linear-gradient(135deg, #8b7cff, #c878f0)',
          boxShadow: '0 8px 22px -6px rgba(140,90,255,.7)',
        }}
      >
        ＋ 新しい夢を記録
      </Link>
    </header>
  );
}
