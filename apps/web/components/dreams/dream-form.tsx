'use client';

import { useState, useEffect } from 'react';
import type { DreamMood, CreateDreamInput } from '@dream-analyzer/shared-types';
import Link from 'next/link';

const MOOD_OPTIONS: { value: DreamMood; label: string }[] = [
  { value: 'joyful', label: '喜び' },
  { value: 'peaceful', label: '穏やか' },
  { value: 'anxious', label: '不安' },
  { value: 'fearful', label: '恐怖' },
  { value: 'sad', label: '悲しみ' },
  { value: 'angry', label: '怒り' },
  { value: 'confused', label: '混乱' },
  { value: 'excited', label: '興奮' },
  { value: 'neutral', label: '中立' },
];

interface Dreamer {
  id: string;
  name: string;
  relationship?: string;
}

interface DreamFormProps {
  onSubmit: (dream: CreateDreamInput & { dreamerId: string }) => void;
  isSubmitting?: boolean;
}

export function DreamForm({ onSubmit, isSubmitting }: DreamFormProps) {
  const [dreamers, setDreamers] = useState<Dreamer[]>([]);
  const [dreamerId, setDreamerId] = useState('');
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // JSTで今日の日付を取得
  const [date, setDate] = useState(() => {
    const now = new Date();
    // JSTはUTC+9なので、9時間を加算してからUTC日付を取得
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstTime = new Date(now.getTime() + jstOffset);
    return jstTime.toISOString().split('T')[0];
  });
  const [mood, setMood] = useState<DreamMood>('neutral');
  const [lucidity, setLucidity] = useState(5);
  const [vividness, setVividness] = useState(5);
  const [emotionalIntensity, setEmotionalIntensity] = useState(5);
  const [setting, setSetting] = useState('');
  const [characters, setCharacters] = useState('');
  const [emotions, setEmotions] = useState('');

  useEffect(() => {
    const fetchDreamers = async () => {
      try {
        const response = await fetch('/api/dreamers');
        const data = await response.json();
        setDreamers(data);
        if (data.length > 0) {
          setDreamerId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch dreamers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDreamers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dreamerId) {
      alert('夢を見た人を選択してください');
      return;
    }

    onSubmit({
      dreamerId,
      title,
      content,
      date: new Date(date),
      mood,
      lucidity,
      vividness,
      emotionalIntensity,
      setting: setting || undefined,
      characters: characters ? characters.split(',').map((s) => s.trim()) : undefined,
      emotions: emotions ? emotions.split(',').map((s) => s.trim()) : undefined,
    });
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">読み込み中...</div>;
  }

  if (dreamers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="mb-4 text-muted-foreground">
          まず、夢を見た人を登録してください。
        </p>
        <Link
          href="/dreamers"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          夢を見た人を登録する
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dreamer selection */}
      <div>
        <label htmlFor="dreamer" className="mb-1 block text-sm font-medium">
          夢を見た人 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            id="dreamer"
            value={dreamerId}
            onChange={(e) => setDreamerId(e.target.value)}
            required
            className="flex-1 rounded-md border border-border bg-background px-3 py-2"
          >
            {dreamers.map((dreamer) => (
              <option key={dreamer.id} value={dreamer.id}>
                {dreamer.name}
                {dreamer.relationship && ` (${dreamer.relationship})`}
              </option>
            ))}
          </select>
          <Link
            href="/dreamers"
            className="whitespace-nowrap rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
          >
            管理
          </Link>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          夢のタイトル
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 空を飛ぶ夢"
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium">
          日付 <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium">
          夢の内容
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="できるだけ詳しく記録してください..."
          rows={8}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="mood" className="mb-1 block text-sm font-medium">
          全体的な気分
        </label>
        <select
          id="mood"
          value={mood}
          onChange={(e) => setMood(e.target.value as DreamMood)}
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        >
          {MOOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            明晰度: {lucidity}
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={lucidity}
            onChange={(e) => setLucidity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            鮮明度: {vividness}
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={vividness}
            onChange={(e) => setVividness(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            感情の強さ: {emotionalIntensity}
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={emotionalIntensity}
            onChange={(e) => setEmotionalIntensity(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="setting" className="mb-1 block text-sm font-medium">
          場所・環境（任意）
        </label>
        <input
          id="setting"
          type="text"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          placeholder="例: 森の中、海辺"
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="characters" className="mb-1 block text-sm font-medium">
          登場人物（任意、カンマ区切り）
        </label>
        <input
          id="characters"
          type="text"
          value={characters}
          onChange={(e) => setCharacters(e.target.value)}
          placeholder="例: 母親, 友人, 見知らぬ人"
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="emotions" className="mb-1 block text-sm font-medium">
          感じた感情（任意、カンマ区切り）
        </label>
        <input
          id="emotions"
          type="text"
          value={emotions}
          onChange={(e) => setEmotions(e.target.value)}
          placeholder="例: 驚き, 安心, 緊張"
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? '記録中...' : '夢を記録して分析'}
      </button>
    </form>
  );
}
