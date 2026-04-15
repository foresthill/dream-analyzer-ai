'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseTextToSpeechOptions {
  /** 言語コード（デフォルト: 日本語） */
  language?: string;
  /** 読み上げ速度（0.1-10、デフォルト: 1） */
  rate?: number;
  /** 音程（0-2、デフォルト: 1） */
  pitch?: number;
}

export interface UseTextToSpeechReturn {
  /** 読み上げ中かどうか */
  isSpeaking: boolean;
  /** 一時停止中かどうか */
  isPaused: boolean;
  /** 音声合成がサポートされているか */
  isSupported: boolean;
  /** 中断されたかどうか（再開可能） */
  isInterrupted: boolean;
  /** 読み上げの進捗（0-100） */
  progress: number;
  /** 読み上げを開始 */
  speak: (text: string) => void;
  /** 読み上げを停止 */
  stop: () => void;
  /** 一時停止 */
  pause: () => void;
  /** 再開 */
  resume: () => void;
  /** 一時停止/再開を切り替え */
  togglePause: () => void;
  /** 中断位置から再開 */
  resumeFromInterruption: () => void;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const {
    language = 'ja-JP',
    rate = 1,
    pitch = 1,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fullTextRef = useRef<string>('');
  const charIndexRef = useRef<number>(0);
  const endedNaturallyRef = useRef<boolean>(false);

  // ブラウザサポートチェック
  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  // Wake Lockの取得
  const acquireWakeLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      // 画面が再びアクティブになった時にWake Lockを再取得
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // Wake Lock取得失敗（バッテリー残量低下時など）は無視
    }
  }, []);

  // Wake Lockの解放
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // 既に解放済みの場合は無視
      }
      wakeLockRef.current = null;
    }
  }, []);

  // visibilitychange時のWake Lock再取得
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isSpeaking && !isPaused) {
        await acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSpeaking, isPaused, acquireWakeLock]);

  const speakFromIndex = useCallback((text: string, startIndex: number) => {
    if (!isSupported || !text) return;

    // 既存の読み上げを停止
    window.speechSynthesis.cancel();

    const remainingText = text.slice(startIndex);
    if (!remainingText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(remainingText);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // 日本語の音声を選択（利用可能な場合）
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find(voice => voice.lang.startsWith('ja'));
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    endedNaturallyRef.current = false;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setIsInterrupted(false);
      acquireWakeLock();
    };

    // 読み上げ位置の追跡
    utterance.onboundary = (event) => {
      const currentPos = startIndex + event.charIndex;
      charIndexRef.current = currentPos;
      if (fullTextRef.current.length > 0) {
        setProgress(Math.round((currentPos / fullTextRef.current.length) * 100));
      }
    };

    utterance.onend = () => {
      endedNaturallyRef.current = true;
      setIsSpeaking(false);
      setIsPaused(false);
      setIsInterrupted(false);
      setProgress(100);
      charIndexRef.current = 0;
      releaseWakeLock();
    };

    utterance.onerror = (event) => {
      // 'interrupted' や 'canceled' はユーザー操作またはシステムによる中断
      if (event.error === 'interrupted' || event.error === 'canceled') {
        // 自然終了でない場合のみ中断扱い
        if (!endedNaturallyRef.current && charIndexRef.current > 0 && charIndexRef.current < fullTextRef.current.length) {
          setIsInterrupted(true);
        }
      }
      setIsSpeaking(false);
      setIsPaused(false);
      releaseWakeLock();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, language, rate, pitch, acquireWakeLock, releaseWakeLock]);

  const speak = useCallback((text: string) => {
    fullTextRef.current = text;
    charIndexRef.current = 0;
    setProgress(0);
    setIsInterrupted(false);
    endedNaturallyRef.current = false;
    speakFromIndex(text, 0);
  }, [speakFromIndex]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    endedNaturallyRef.current = true; // stop()はユーザー意図なので中断扱いにしない
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsInterrupted(false);
    setProgress(0);
    charIndexRef.current = 0;
    releaseWakeLock();
  }, [isSupported, releaseWakeLock]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  // 中断位置から再開
  const resumeFromInterruption = useCallback(() => {
    if (!isInterrupted || !fullTextRef.current) return;
    setIsInterrupted(false);
    speakFromIndex(fullTextRef.current, charIndexRef.current);
  }, [isInterrupted, speakFromIndex]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
      releaseWakeLock();
    };
  }, [isSupported, releaseWakeLock]);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    isInterrupted,
    progress,
    speak,
    stop,
    pause,
    resume,
    togglePause,
    resumeFromInterruption,
  };
}
