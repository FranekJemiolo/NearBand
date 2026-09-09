import { Platform } from 'react-native';

export interface BackgroundServiceConfig {
  channel: number;
  handle: string;
}

export type InterruptionCallback = () => void;
export type RouteChangeCallback = (reason: 'headsetUnplugged' | 'routeChanged') => void;

export interface IosAudioSessionConfig {
  category: 'PlayAndRecord';
  mode: 'VoiceChat' | 'SpokenAudio';
  options: string[];
  active: boolean;
}

export interface AndroidForegroundConfig {
  channelId: string;
  channelName: string;
  notificationTitle: string;
  notificationText: string;
  wakeLockHeld: boolean;
}

export class BackgroundAudioManager {
  private isRunning: boolean = false;
  private currentChannel: number = 19;
  private currentHandle: string = 'NearBand';

  // iOS Specific State
  private iosSession: IosAudioSessionConfig = {
    category: 'PlayAndRecord',
    mode: 'VoiceChat',
    options: ['DefaultToSpeaker', 'AllowBluetooth', 'DuckOthers'],
    active: false,
  };
  private interruptionCallbacks: Set<InterruptionCallback> = new Set();
  private routeChangeCallbacks: Set<RouteChangeCallback> = new Set();

  // Android Specific State
  private androidConfig: AndroidForegroundConfig = {
    channelId: 'nearband_audio_service',
    channelName: 'NearBand CB Channel Monitor',
    notificationTitle: 'NearBand - Monitoring Channel 19',
    notificationText: 'Handle: NearBand | Proximity: 5-Mile Radius',
    wakeLockHeld: false,
  };

  public async startService(config: BackgroundServiceConfig): Promise<boolean> {
    this.currentChannel = config.channel;
    this.currentHandle = config.handle;
    this.isRunning = true;

    if (Platform.OS === 'android') {
      this.androidConfig.notificationTitle = `NearBand - Monitoring Channel ${this.currentChannel}`;
      this.androidConfig.notificationText = `Handle: ${this.currentHandle} | Proximity: 5-Mile Radius`;
      this.androidConfig.wakeLockHeld = true;
      return true;
    } else if (Platform.OS === 'ios') {
      this.iosSession.active = true;
      return true;
    }

    return true;
  }

  public async stopService(): Promise<void> {
    this.isRunning = false;

    if (Platform.OS === 'android') {
      this.androidConfig.wakeLockHeld = false;
    } else if (Platform.OS === 'ios') {
      this.iosSession.active = false;
    }
  }

  public updateNotification(channel: number, handle: string): void {
    this.currentChannel = channel;
    this.currentHandle = handle;

    if (Platform.OS === 'android') {
      this.androidConfig.notificationTitle = `NearBand - Monitoring Channel ${channel}`;
      this.androidConfig.notificationText = `Handle: ${handle} | Proximity: 5-Mile Radius`;
    }
  }

  /**
   * iOS AVAudioSession Interruption Handlers (e.g. incoming phone call, Siri, alarm)
   */
  public onInterruption(callback: InterruptionCallback): () => void {
    this.interruptionCallbacks.add(callback);
    return () => {
      this.interruptionCallbacks.delete(callback);
    };
  }

  public onAudioRouteChange(callback: RouteChangeCallback): () => void {
    this.routeChangeCallbacks.add(callback);
    return () => {
      this.routeChangeCallbacks.delete(callback);
    };
  }

  public simulateIosInterruptionBegan(): void {
    for (const cb of this.interruptionCallbacks) {
      cb();
    }
  }

  public simulateIosRouteChange(reason: 'headsetUnplugged' | 'routeChanged'): void {
    for (const cb of this.routeChangeCallbacks) {
      cb(reason);
    }
  }

  public getIosSessionConfig(): IosAudioSessionConfig {
    return { ...this.iosSession };
  }

  public getAndroidConfig(): AndroidForegroundConfig {
    return { ...this.androidConfig };
  }

  public getStatus(): { isRunning: boolean; channel: number; handle: string } {
    return {
      isRunning: this.isRunning,
      channel: this.currentChannel,
      handle: this.currentHandle,
    };
  }
}

export const backgroundAudio = new BackgroundAudioManager();
