import { VAD_SILENCE_TIMEOUT_MS } from '@nearband/shared';

export interface VadOptions {
  noiseFloorThresholdDb?: number; // Decibel threshold, default -45 dBFS
  silenceTimeoutMs?: number; // Prolonged silence duration before pausing, default 2000 ms
  onGateChange?: (isGated: boolean) => void;
}

export class VoiceActivityDetector {
  private noiseFloorDb: number;
  private silenceTimeoutMs: number;
  private onGateChange?: (isGated: boolean) => void;

  private isGated: boolean = false;
  private lastSpeechTimestamp: number = Date.now();
  private currentDb: number = -100;

  constructor(options?: VadOptions) {
    this.noiseFloorDb = options?.noiseFloorThresholdDb ?? -45;
    this.silenceTimeoutMs = options?.silenceTimeoutMs ?? VAD_SILENCE_TIMEOUT_MS;
    this.onGateChange = options?.onGateChange;
  }

  /**
   * Processes a raw audio level reading in decibels (dBFS).
   * Returns true if gate state changed.
   */
  public processAudioLevel(dbLevel: number, timestamp: number = Date.now()): boolean {
    this.currentDb = dbLevel;

    if (dbLevel >= this.noiseFloorDb) {
      this.lastSpeechTimestamp = timestamp;

      if (this.isGated) {
        this.isGated = false;
        this.onGateChange?.(false);
        return true;
      }
    } else {
      const silenceDuration = timestamp - this.lastSpeechTimestamp;

      if (silenceDuration >= this.silenceTimeoutMs && !this.isGated) {
        this.isGated = true;
        this.onGateChange?.(true);
        return true;
      }
    }

    return false;
  }

  public getStatus() {
    return {
      isGated: this.isGated,
      currentDb: this.currentDb,
      noiseFloorDb: this.noiseFloorDb,
      silenceTimeoutMs: this.silenceTimeoutMs,
      lastSpeechTimestamp: this.lastSpeechTimestamp,
    };
  }

  public reset(): void {
    this.isGated = false;
    this.lastSpeechTimestamp = Date.now();
    this.currentDb = -100;
  }
}
