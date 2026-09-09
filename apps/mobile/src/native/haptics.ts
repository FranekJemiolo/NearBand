import { Platform, Vibration } from 'react-native';

export type HapticFeedbackType = 'pttDown' | 'pttUp' | 'rogerBeep' | 'squelchWarning';

export class HapticsManager {
  private isEnabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public trigger(type: HapticFeedbackType): void {
    if (!this.isEnabled) return;

    if (Platform.OS === 'android') {
      switch (type) {
        case 'pttDown':
          // Crisp sharp click on transmit key down
          Vibration.vibrate(45);
          break;
        case 'pttUp':
          // Soft release tap
          Vibration.vibrate(25);
          break;
        case 'rogerBeep':
          // Authentic CB radio double pulse roger beep
          Vibration.vibrate([0, 30, 50, 30]);
          break;
        case 'squelchWarning':
          // Urgent triple buzz for squelch community mute
          Vibration.vibrate([0, 80, 60, 80, 60, 80]);
          break;
      }
    } else if (Platform.OS === 'ios') {
      // In native iOS runtime, triggers UIImpactFeedbackGenerator / UINotificationFeedbackGenerator
      switch (type) {
        case 'pttDown':
          Vibration.vibrate(50);
          break;
        case 'pttUp':
          Vibration.vibrate(20);
          break;
        case 'rogerBeep':
          Vibration.vibrate([0, 25, 40, 25]);
          break;
        case 'squelchWarning':
          Vibration.vibrate([0, 70, 50, 70]);
          break;
      }
    }
  }
}

export const haptics = new HapticsManager();
