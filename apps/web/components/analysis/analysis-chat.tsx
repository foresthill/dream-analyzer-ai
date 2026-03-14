'use client';

import { useState, useEffect, useRef } from 'react';
import { SimpleMarkdown } from '@/components/ui/simple-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  userName?: string | null;
  modelName?: string | null;
  createdAt: string;
}

interface AnalysisChatProps {
  analysisId: string;
}

const SUGGESTION_QUESTIONS = [
  'この夢が示唆する私の深層心理は？',
  'この夢のシンボルについてもっと詳しく教えて',
  '最近のストレスと関連している？',
  '行動や習慣を変えるべき点はある？',
];

export function AnalysisChat({ analysisId }: AnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch existing conversation history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/analyze/${analysisId}/chat`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          setError(null);
          if (data.length > 0) {
            setIsExpanded(true);
          }
        } else if (response.status === 401) {
          setError('ログインが必要です');
        } else if (response.status === 403) {
          const data = await response.json();
          setError(data.error || 'この分析にアクセスする権限がありません');
        } else if (response.status === 404) {
          setError('分析が見つかりません');
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('通信エラーが発生しました');
      }
    };

    fetchMessages();
  }, [analysisId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');
    setIsLoading(true);
    setIsExpanded(true);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: 'temp-user',
      role: 'user',
      content: userInput,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/analyze/${analysisId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('ログインが必要です');
        } else if (response.status === 403) {
          throw new Error(data.error || 'この分析にアクセスする権限がありません');
        } else if (response.status === 404) {
          throw new Error('分析が見つかりません');
        } else {
          throw new Error(data.error || 'メッセージの送信に失敗しました');
        }
      }

      const data = await response.json();
      setError(null);

      // Replace temp messages with actual ones
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp-user'),
        data.userMessage,
        data.assistantMessage,
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== 'temp-user'));
      setError(err instanceof Error ? err.message : 'メッセージの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  const handleClearHistory = async () => {
    if (!confirm('対話履歴をクリアしますか？')) return;

    try {
      const response = await fetch(`/api/analyze/${analysisId}/chat`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-semibold">分析について質問・対話する</h3>
          {messages.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {messages.length}件の会話
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {/* Error message */}
          {error && (
            <div className="border-b border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Suggestion questions */}
          {messages.length === 0 && !error && (
            <div className="border-b border-border p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                分析結果について質問したり、より深い解釈を求めることができます:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSuggestionClick(question)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* ユーザー名 or モデル名のラベル */}
                      <div className={`mb-1 flex items-center gap-1.5 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {message.role === 'user' && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {message.userName || 'あなた'}
                          </span>
                        )}
                        {message.role === 'assistant' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {message.modelName || 'AI'}
                          </span>
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        ) : (
                          <SimpleMarkdown content={message.content} className="text-sm" />
                        )}
                        <p className="mt-1 text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleString('ja-JP', {
                            timeZone: 'Asia/Tokyo',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-secondary px-4 py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        考え中...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input form */}
          {!error && (
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="質問や感想を入力..."
                disabled={isLoading}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                送信
              </button>
            </form>
            {messages.length > 0 && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  履歴をクリア
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
