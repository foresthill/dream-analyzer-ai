'use client';

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useEffect, useCallback } from 'react';

interface VoiceInputButtonProps {
  /** 現在のテキスト値 */
  value: string;
  /** テキストが変更されたときのコールバック */
  onValueChange: (value: string) => void;
  /** 追加モード（既存テキストに追加） */
  appendMode?: boolean;
  /** カスタムクラス */
  className?: string;
  /** 無効状態 */
  disabled?: boolean;
}

export function VoiceInputButton({
  value,
  onValueChange,
  appendMode = true,
  className = '',
  disabled = false,
}: VoiceInputButtonProps) {
  const handleResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (appendMode && value) {
        // 既存テキストがある場合は追加
        const separator = value.endsWith('\n') || value.endsWith(' ') ? '' : ' ';
        onValueChange(value + separator + transcript);
      } else {
        onValueChange(transcript);
      }
    },
    [value, onValueChange, appendMode]
  );

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    toggleListening,
    resetTranscript,
    error,
  } = useVoiceInput({
    language: 'ja-JP',
    continuous: true,
    interimResults: true,
  });

  // 認識結果をフォームに反映
  useEffect(() => {
    if (transcript || interimTranscript) {
      const currentText = transcript + interimTranscript;
      if (appendMode && value && !value.includes(currentText)) {
        const baseText = value.replace(/\s+$/, '');
        const separator = baseText ? ' ' : '';
        onValueChange(baseText + separator + currentText);
      } else if (!appendMode) {
        onValueChange(currentText);
      }
    }
  }, [transcript, interimTranscript, appendMode, value, onValueChange]);

  // 録音停止時にリセット
  useEffect(() => {
    if (!isListening && (transcript || interimTranscript)) {
      // 少し待ってからリセット（最終結果を確実に反映）
      const timer = setTimeout(() => {
        resetTranscript();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript, interimTranscript, resetTranscript]);

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
        onClick={toggleListening}
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
        {isListening ? (
          <Mic className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
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
