import { useEffect, useRef } from 'react';

export type VolumeButtonType = 'volumeUp' | 'volumeDown';

export interface VolumeKeyEvent {
  button: VolumeButtonType;
  action: 'down' | 'up';
  timestamp: number;
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
