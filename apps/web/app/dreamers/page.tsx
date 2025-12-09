'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Dreamer {
  id: string;
  name: string;
  relationship?: string;
  notes?: string;
  _count?: { dreams: number };
}

export default function DreamersPage() {
  const [dreamers, setDreamers] = useState<Dreamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDreamer, setNewDreamer] = useState({ name: '', relationship: '', notes: '' });

  useEffect(() => {
    fetchDreamers();
  }, []);

  const fetchDreamers = async () => {
    try {
      const response = await fetch('/api/dreamers');
      const data = await response.json();
      setDreamers(data);
    } catch (error) {
      console.error('Failed to fetch dreamers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/dreamers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDreamer),
      });

      if (response.ok) {
        setNewDreamer({ name: '', relationship: '', notes: '' });
        setIsAdding(false);
        fetchDreamers();
      } else {
        alert('追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add dreamer:', error);
      alert('追加に失敗しました');
    }
  };

  const handleDelete = async (id: string, name: string, dreamCount: number) => {
    if (dreamCount > 0) {
      alert(`${name}さんの夢が${dreamCount}件記録されているため削除できません`);
      return;
    }

    if (!confirm(`${name}さんを削除しますか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/dreamers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDreamers();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete dreamer:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return <div className="text-center">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">夢を見た人の管理</h1>
        <Link
          href="/dreams/new"
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80"
        >
          夢を記録する
        </Link>
      </div>

      {/* Add new dreamer */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          + 新しい人を追加
        </button>
      ) : (
        <form onSubmit={handleAdd} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">新しい人を追加</h2>

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={newDreamer.name}
              onChange={(e) => setNewDreamer({ ...newDreamer, name: e.target.value })}
              placeholder="例: 自分、妻、妻の母"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="relationship" className="mb-1 block text-sm font-medium">
              関係性（任意）
            </label>
            <input
              id="relationship"
              type="text"
              value={newDreamer.relationship}
              onChange={(e) => setNewDreamer({ ...newDreamer, relationship: e.target.value })}
              placeholder="例: 本人、配偶者、義母"
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">
              メモ（任意）
            </label>
            <textarea
              id="notes"
              value={newDreamer.notes}
              onChange={(e) => setNewDreamer({ ...newDreamer, notes: e.target.value })}
              placeholder="メモ"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              追加
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewDreamer({ name: '', relationship: '', notes: '' });
              }}
              className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-accent"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* Dreamers list */}
      <div className="space-y-4">
        {dreamers.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            まだ誰も登録されていません。上のボタンから追加してください。
          </div>
        ) : (
          dreamers.map((dreamer) => (
            <div
              key={dreamer.id}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{dreamer.name}</h3>
                  {dreamer.relationship && (
                    <p className="text-sm text-muted-foreground">{dreamer.relationship}</p>
                  )}
                  {dreamer.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{dreamer.notes}</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    記録された夢: {dreamer._count?.dreams || 0}件
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleDelete(
                      dreamer.id,
                      dreamer.name,
                      dreamer._count?.dreams || 0
                    )
                  }
                  className="text-sm text-red-500 hover:text-red-700"
                  disabled={(dreamer._count?.dreams || 0) > 0}
                >
                  {(dreamer._count?.dreams || 0) > 0 ? '削除不可' : '削除'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
