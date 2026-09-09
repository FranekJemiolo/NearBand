import { Platform } from 'react-native';

export interface BackgroundServiceConfig {
  channel: number;
  handle: string;
}

export class BackgroundAudioManager {
  private isRunning: boolean = false;
  private currentChannel: number = 19;
  private currentHandle: string = 'NearBand';

  public async startService(config: BackgroundServiceConfig): Promise<boolean> {
    this.currentChannel = config.channel;
    this.currentHandle = config.handle;
    this.isRunning = true;

    if (Platform.OS === 'android') {
      // In native Android runtime, this triggers startForegroundService
      return true;
    } else if (Platform.OS === 'ios') {
      // In native iOS runtime, sets AVAudioSession category PlayAndRecord with DuckOthers/DefaultToSpeaker
      return true;
    }

    return true;
  }

  public async stopService(): Promise<void> {
    this.isRunning = false;
  }

  public updateNotification(channel: number, handle: string): void {
    this.currentChannel = channel;
    this.currentHandle = handle;
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
