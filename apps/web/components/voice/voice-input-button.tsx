'use client';

import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useRef } from 'react';

interface VoiceInputButtonProps {
  /** 現在のテキスト値 */
  value: string;
  /** テキストが変更されたときのコールバック */
  onValueChange: (value: string) => void;
  /** カスタムクラス */
  className?: string;
  /** 無効状態 */
  disabled?: boolean;
}

export function VoiceInputButton({
  value,
  onValueChange,
  className = '',
  disabled = false,
}: VoiceInputButtonProps) {
  // 録音開始時のテキストを保持
  const baseTextRef = useRef('');

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useVoiceInput({
    language: 'ja-JP',
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      // ベーステキスト + 認識結果を表示
      const separator = baseTextRef.current && !baseTextRef.current.endsWith(' ') ? ' ' : '';
      onValueChange(baseTextRef.current + separator + text);
    },
  });

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      // 停止時にベーステキストを更新（次回の録音用）
      baseTextRef.current = value;
      resetTranscript();
    } else {
      // 録音開始時の現在値を保存
      baseTextRef.current = value;
      resetTranscript();
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center rounded-md p-2 text-muted-foreground opacity-50 ${className}`}
        title="このブラウザは音声入力に対応していません"
      >
        <MicOff className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center rounded-full p-3 transition-all
          ${isListening
            ? 'bg-red-500 text-white shadow-lg animate-pulse hover:bg-red-600'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={isListening ? '録音を停止' : '音声で入力'}
        aria-label={isListening ? '録音を停止' : '音声で入力'}
      >
        <Mic className="h-5 w-5" />
      </button>

      {/* 録音中インジケーター */}
      {isListening && (
        <span className="flex items-center gap-1 text-sm text-red-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
          録音中...
        </span>
      )}

      {/* エラー表示 */}
      {error && !isListening && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  );
}
