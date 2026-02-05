'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseVoiceInputOptions {
  /** 言語コード（デフォルト: 日本語） */
  language?: string;
  /** 連続認識モード（デフォルト: true） */
  continuous?: boolean;
  /** 中間結果を取得（デフォルト: true） */
  interimResults?: boolean;
  /** 認識結果を受け取るコールバック */
  onResult?: (transcript: string, isFinal: boolean) => void;
  /** エラー時のコールバック */
  onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
  /** 現在録音中かどうか */
  isListening: boolean;
  /** 認識されたテキスト */
  transcript: string;
  /** 中間結果のテキスト */
  interimTranscript: string;
  /** 音声認識がサポートされているか */
  isSupported: boolean;
  /** 録音を開始 */
  startListening: () => void;
  /** 録音を停止 */
  stopListening: () => void;
  /** 録音を切り替え */
  toggleListening: () => void;
  /** テキストをリセット */
  resetTranscript: () => void;
  /** エラーメッセージ */
  error: string | null;
}

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'ja-JP',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');

  // ブラウザサポートチェック
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // 音声認識のセットアップ
  const setupRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('このブラウザは音声認識に対応していません');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        setTranscript(transcriptRef.current);
        onResult?.(transcriptRef.current, true);
      }

      setInterimTranscript(interim);
      if (interim) {
        onResult?.(transcriptRef.current + interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessages: Record<string, string> = {
        'no-speech': '音声が検出されませんでした',
        'audio-capture': 'マイクにアクセスできません',
        'not-allowed': 'マイクの使用が許可されていません',
        'network': 'ネットワークエラーが発生しました',
        'aborted': '音声認識が中断されました',
        'service-not-allowed': '音声認識サービスが利用できません',
      };

      const errorMessage = errorMessages[event.error] || `エラーが発生しました: ${event.error}`;
      setError(errorMessage);
      onError?.(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    return recognition;
  }, [language, continuous, interimResults, onResult, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = setupRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        setError('音声認識の開始に失敗しました');
      }
    }
  }, [setupRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    error,
  };
}
