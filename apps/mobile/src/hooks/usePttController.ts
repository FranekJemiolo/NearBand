import { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_TRANSMISSION_DURATION_SECONDS } from '@nearband/shared';
import { PttMode } from '../types';

export interface PttControllerOptions {
  initialMode?: PttMode;
  maxDurationSeconds?: number;
  onTransmissionStart?: () => void;
  onTransmissionEnd?: (reason: 'released' | 'timeout') => void;
}

export function usePttController(options?: PttControllerOptions) {
  const [pttMode, setPttMode] = useState<PttMode>(options?.initialMode ?? 'hold');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    options?.maxDurationSeconds ?? MAX_TRANSMISSION_DURATION_SECONDS,
  );

  const maxDuration = options?.maxDurationSeconds ?? MAX_TRANSMISSION_DURATION_SECONDS;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTransmission = useCallback(
    (reason: 'released' | 'timeout' = 'released') => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsTransmitting(false);
      setCountdownSeconds(maxDuration);
      options?.onTransmissionEnd?.(reason);
    },
    [maxDuration, options],
  );

  const startTransmission = useCallback(() => {
    if (isTransmitting) return;

    setIsTransmitting(true);
    setCountdownSeconds(maxDuration);
    options?.onTransmissionStart?.();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          stopTransmission('timeout');
          return maxDuration;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isTransmitting, maxDuration, options, stopTransmission]);

  const handlePressIn = useCallback(() => {
    if (pttMode === 'hold') {
      startTransmission();
    }
  }, [pttMode, startTransmission]);

  const handlePressOut = useCallback(() => {
    if (pttMode === 'hold') {
      stopTransmission('released');
    }
  }, [pttMode, stopTransmission]);

  const handleTap = useCallback(() => {
    if (pttMode === 'tap') {
      if (isTransmitting) {
        stopTransmission('released');
      } else {
        startTransmission();
      }
    }
  }, [pttMode, isTransmitting, startTransmission, stopTransmission]);

  const togglePttMode = useCallback(() => {
    if (isTransmitting) {
      stopTransmission('released');
    }
    setPttMode(prev => (prev === 'hold' ? 'tap' : 'hold'));
  }, [isTransmitting, stopTransmission]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    pttMode,
    isTransmitting,
    countdownSeconds,
    startTransmission,
    stopTransmission,
    handlePressIn,
    handlePressOut,
    handleTap,
    togglePttMode,
    setPttMode,
  };
}
