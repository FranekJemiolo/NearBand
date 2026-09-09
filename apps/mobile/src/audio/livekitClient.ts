import { VoiceActivityDetector } from './vad';

export interface AudioRoomCallbacks {
  onSpeakersChanged?: (activeHandles: string[]) => void;
  onDisconnected?: () => void;
}

export class RadioAudioEngine {
  private isConnected: boolean = false;
  private isTransmitting: boolean = false;
  private currentRoom: string | null = null;
  private vad: VoiceActivityDetector;
  private squelchedUserIds: Set<string> = new Set();
  private activeSpeakers: Map<string, string> = new Map(); // userId -> handle
  private callbacks: AudioRoomCallbacks;

  constructor(callbacks?: AudioRoomCallbacks) {
    this.callbacks = callbacks ?? {};
    this.vad = new VoiceActivityDetector({
      onGateChange: isGated => {
        if (this.isTransmitting) {
          // If silence detected, pause transmission; if voice resumes, unpause
          this.applyTransmissionState(!isGated);
        }
      },
    });
  }

  public async connectRoom(_serverUrl: string, _token: string, roomName: string): Promise<boolean> {
    this.currentRoom = roomName;
    this.isConnected = true;
    return true;
  }

  public async disconnectRoom(): Promise<void> {
    this.isConnected = false;
    this.isTransmitting = false;
    this.currentRoom = null;
    this.activeSpeakers.clear();
    this.callbacks.onDisconnected?.();
  }

  public async startTransmitting(): Promise<void> {
    if (!this.isConnected) return;
    this.isTransmitting = true;
    this.vad.reset();
    this.applyTransmissionState(true);
  }

  public async stopTransmitting(): Promise<void> {
    this.isTransmitting = false;
    this.applyTransmissionState(false);
  }

  private applyTransmissionState(_enabled: boolean): void {
    // In native runtime, mutess/unmutes local AudioTrack
  }

  public setSquelchedUsers(users: Set<string>): void {
    this.squelchedUserIds = new Set(users);
    // Drop any active speakers who are newly squelched
    for (const userId of this.squelchedUserIds) {
      if (this.activeSpeakers.has(userId)) {
        this.activeSpeakers.delete(userId);
      }
    }
    this.notifySpeakers();
  }

  public handleIncomingTrack(userId: string, handle: string): boolean {
    if (this.squelchedUserIds.has(userId)) {
      // Squelched: do not play audio
      return false;
    }

    this.activeSpeakers.set(userId, handle);
    this.notifySpeakers();
    return true;
  }

  public handleTrackStopped(userId: string): void {
    this.activeSpeakers.delete(userId);
    this.notifySpeakers();
  }

  private notifySpeakers(): void {
    this.callbacks.onSpeakersChanged?.(Array.from(this.activeSpeakers.values()));
  }

  public processMicLevel(dbLevel: number): boolean {
    return this.vad.processAudioLevel(dbLevel);
  }

  public getStatus() {
    return {
      isConnected: this.isConnected,
      isTransmitting: this.isTransmitting,
      currentRoom: this.currentRoom,
      activeSpeakerCount: this.activeSpeakers.size,
      vad: this.vad.getStatus(),
    };
  }
}
