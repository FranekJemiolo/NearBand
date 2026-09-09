import { useState, useCallback } from 'react';
import {
  DEFAULT_CHANNEL,
  CB_MIN_CHANNEL,
  CB_MAX_CHANNEL,
  generatePhoneticHandle,
} from '@nearband/shared';

export interface RadioTunerState {
  channel: number;
  handle: string;
  squelchedUsers: Set<string>;
}

export function useRadioTuner(initialHandle?: string) {
  const [channel, setChannel] = useState<number>(DEFAULT_CHANNEL);
  const [handle, setHandle] = useState<string>(() => initialHandle || generatePhoneticHandle());
  const [squelchedUsers, setSquelchedUsers] = useState<Set<string>>(new Set());

  const selectChannel = useCallback((targetChannel: number) => {
    if (targetChannel < CB_MIN_CHANNEL) {
      setChannel(CB_MIN_CHANNEL);
    } else if (targetChannel > CB_MAX_CHANNEL) {
      setChannel(CB_MAX_CHANNEL);
    } else {
      setChannel(Math.round(targetChannel));
    }
  }, []);

  const nextChannel = useCallback(() => {
    setChannel(prev => (prev < CB_MAX_CHANNEL ? prev + 1 : CB_MIN_CHANNEL));
  }, []);

  const prevChannel = useCallback(() => {
    setChannel(prev => (prev > CB_MIN_CHANNEL ? prev - 1 : CB_MAX_CHANNEL));
  }, []);

  const squelchUser = useCallback((userId: string) => {
    setSquelchedUsers(prev => new Set(prev).add(userId));
  }, []);

  const unsquelchUser = useCallback((userId: string) => {
    setSquelchedUsers(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const resetHandle = useCallback(() => {
    setHandle(generatePhoneticHandle());
  }, []);

  return {
    channel,
    handle,
    squelchedUsers,
    selectChannel,
    nextChannel,
    prevChannel,
    squelchUser,
    unsquelchUser,
    resetHandle,
    setHandle,
  };
}
