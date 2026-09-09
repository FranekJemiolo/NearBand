import { Coordinates, LiveKitRoomInfo } from '@nearband/shared';

export type PttMode = 'hold' | 'tap';

export interface MobileRadioState {
  currentChannel: number;
  handle: string;
  userId: string;
  isTransmitting: boolean;
  pttMode: PttMode;
  countdownSeconds: number;
  squelchedUsers: Set<string>;
  activeRoomInfo?: LiveKitRoomInfo;
  isMuted: boolean;
  coordinates?: Coordinates;
}

export interface RadioActionCallbacks {
  onChannelSelect: (channel: number) => void;
  onPttStart: () => void;
  onPttEnd: () => void;
  onTogglePttMode: () => void;
  onVoteSquelch: (targetUserId: string) => void;
}
