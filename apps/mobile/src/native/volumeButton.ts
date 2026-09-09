import { useEffect, useRef } from 'react';

export type VolumeButtonType = 'volumeUp' | 'volumeDown';

export interface VolumeKeyEvent {
  button: VolumeButtonType;
  action: 'down' | 'up';
  timestamp: number;
}

export interface AndroidRawKeyEvent {
  keyCode: number; // 24 = KEYCODE_VOLUME_UP, 25 = KEYCODE_VOLUME_DOWN
  action: 0 | 1; // 0 = ACTION_DOWN, 1 = ACTION_UP
  repeatCount: number;
  timestamp?: number;
}

export interface IosVolumeChangeEvent {
  volume: number;
  direction: 'up' | 'down';
  timestamp?: number;
}

export type VolumeKeyListener = (event: VolumeKeyEvent) => void;

export class HardwareVolumeManager {
  private listeners: Set<VolumeKeyListener> = new Set();
  private isInterceptionActive: boolean = false;

  public addListener(listener: VolumeKeyListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emitKeyEvent(event: VolumeKeyEvent): void {
    if (!this.isInterceptionActive) return;
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Android-specific key event dispatcher
   * KeyCode 24 = VOLUME_UP, 25 = VOLUME_DOWN
   * Ignores repeat events (repeatCount > 0) to avoid stuttering PTT triggers
   */
  public handleAndroidKeyEvent(raw: AndroidRawKeyEvent): boolean {
    if (!this.isInterceptionActive) return false;

    // Reject repeat keys when user holds the hardware button down
    if (raw.repeatCount > 0) {
      return true; // Still consume key so volume UI doesn't pop up
    }

    let button: VolumeButtonType | null = null;
    if (raw.keyCode === 24) {
      button = 'volumeUp';
    } else if (raw.keyCode === 25) {
      button = 'volumeDown';
    }

    if (!button) return false;

    const action = raw.action === 0 ? 'down' : 'up';
    this.emitKeyEvent({
      button,
      action,
      timestamp: raw.timestamp || Date.now(),
    });

    return true;
  }

  /**
   * iOS-specific volume delta observer
   */
  public handleIosVolumeEvent(event: IosVolumeChangeEvent): boolean {
    if (!this.isInterceptionActive) return false;

    const button: VolumeButtonType = event.direction === 'up' ? 'volumeUp' : 'volumeDown';

    // Simulate crisp down-up pulse for iOS volume trigger
    this.emitKeyEvent({
      button,
      action: 'down',
      timestamp: event.timestamp || Date.now(),
    });

    return true;
  }

  public enableInterception(): void {
    this.isInterceptionActive = true;
  }

  public disableInterception(): void {
    this.isInterceptionActive = false;
  }

  public isEnabled(): boolean {
    return this.isInterceptionActive;
  }
}

export const hardwareVolume = new HardwareVolumeManager();

export interface UseHardwareVolumeOptions {
  onPttDown: () => void;
  onPttUp: () => void;
  enabled?: boolean;
}

export function useHardwareVolumePtt({
  onPttDown,
  onPttUp,
  enabled = true,
}: UseHardwareVolumeOptions) {
  const isDownRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hardwareVolume.disableInterception();
      return;
    }

    hardwareVolume.enableInterception();

    const unsubscribe = hardwareVolume.addListener(event => {
      if (event.action === 'down') {
        if (!isDownRef.current) {
          isDownRef.current = true;
          onPttDown();
        }
      } else if (event.action === 'up') {
        if (isDownRef.current) {
          isDownRef.current = false;
          onPttUp();
        }
      }
    });

    return () => {
      unsubscribe();
      hardwareVolume.disableInterception();
    };
  }, [enabled, onPttDown, onPttUp]);
}
