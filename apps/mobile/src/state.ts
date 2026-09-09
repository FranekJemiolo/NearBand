import { CB_MIN_CHANNEL, CB_MAX_CHANNEL, DEFAULT_CHANNEL } from '@nearband/shared';

export interface MobileAppState {
  currentChannel: number;
  handle: string;
  isTransmitting: boolean;
  pttMode: 'hold' | 'tap';
  isMuted: boolean;
  activeSpeakers: string[];
}

export function createInitialState(handle: string = 'Scanning...'): MobileAppState {
  return {
    currentChannel: DEFAULT_CHANNEL,
    handle,
    isTransmitting: false,
    pttMode: 'hold',
    isMuted: false,
    activeSpeakers: [],
  };
}

export function switchChannel(_current: number, target: number): number {
  if (target < CB_MIN_CHANNEL) return CB_MIN_CHANNEL;
  if (target > CB_MAX_CHANNEL) return CB_MAX_CHANNEL;
  return Math.round(target);
}
