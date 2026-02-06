'use client';

import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';

interface TextToSpeechButtonProps {
  /** 読み上げるテキスト */
  text: string;
  /** カスタムクラス */
  className?: string;
  /** ボタンのサイズ */
  size?: 'sm' | 'md' | 'lg';
  /** ラベルを表示するか */
  showLabel?: boolean;
}

export function TextToSpeechButton({
  text,
  className = '',
  size = 'md',
  showLabel = true,
}: TextToSpeechButtonProps) {
  const { isSpeaking, isPaused, isSupported, speak, stop, togglePause } = useTextToSpeech({
    language: 'ja-JP',
    rate: 1,
  });

  if (!isSupported) {
    return null;
  }

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg transition-all
          ${isSpeaking
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }
          ${sizeClasses[size]}
          ${className}
        `}
        title={isSpeaking ? '読み上げを停止' : '読み上げる'}
        aria-label={isSpeaking ? '読み上げを停止' : '読み上げる'}
      >
        {isSpeaking ? (
          <VolumeX className={iconSizes[size]} />
        ) : (
          <Volume2 className={iconSizes[size]} />
        )}
        {showLabel && (
          <span>{isSpeaking ? '停止' : '読み上げ'}</span>
        )}
      </button>

      {/* 一時停止/再開ボタン（読み上げ中のみ表示） */}
      {isSpeaking && (
        <button
          type="button"
          onClick={togglePause}
          className={`
            inline-flex items-center justify-center rounded-lg transition-all
            bg-secondary text-secondary-foreground hover:bg-secondary/80
            ${sizeClasses[size]}
          `}
          title={isPaused ? '再開' : '一時停止'}
          aria-label={isPaused ? '再開' : '一時停止'}
        >
          {isPaused ? (
            <Play className={iconSizes[size]} />
          ) : (
            <Pause className={iconSizes[size]} />
          )}
        </button>
      )}
    </div>
  );
}
