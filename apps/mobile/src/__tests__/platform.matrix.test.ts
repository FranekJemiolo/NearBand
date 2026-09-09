import { Platform, Vibration } from 'react-native';
import { backgroundAudio } from '../native/background';
import { hardwareVolume } from '../native/volumeButton';
import { haptics } from '../native/haptics';
import { validateDeviceLocation } from '../native/location';

describe('Cross-Platform Parity Matrix (iOS vs Android)', () => {
  const platforms: Array<'ios' | 'android'> = ['ios', 'android'];

  platforms.forEach(targetPlatform => {
    describe(`Platform Parity for: ${targetPlatform.toUpperCase()}`, () => {
      beforeEach(() => {
        Platform.OS = targetPlatform;
        jest.clearAllMocks();
      });

      it('verifies coordinate validation behaves identically across platforms', () => {
        const validCoords = { latitude: 51.5074, longitude: -0.1278 };
        const mockCoords = { latitude: 51.5074, longitude: -0.1278, isMocked: true };
        const oobCoords = { latitude: 95.0, longitude: -0.1278 };

        expect(validateDeviceLocation(validCoords).valid).toBe(true);
        expect(validateDeviceLocation(mockCoords).valid).toBe(false);
        expect(validateDeviceLocation(oobCoords).valid).toBe(false);
      });

      it('manages background audio lifecycle symmetrically', async () => {
        const started = await backgroundAudio.startService({
          channel: 19,
          handle: 'Echo Maverick',
        });
        expect(started).toBe(true);
        expect(backgroundAudio.getStatus().isRunning).toBe(true);
        expect(backgroundAudio.getStatus().channel).toBe(19);

        backgroundAudio.updateNotification(9, 'Echo Maverick');
        expect(backgroundAudio.getStatus().channel).toBe(9);

        await backgroundAudio.stopService();
        expect(backgroundAudio.getStatus().isRunning).toBe(false);
      });

      it('triggers distinct tactile feedback for radio actions', () => {
        haptics.trigger('pttDown');
        expect(Vibration.vibrate).toHaveBeenCalled();

        haptics.trigger('pttUp');
        expect(Vibration.vibrate).toHaveBeenCalled();

        haptics.trigger('rogerBeep');
        expect(Vibration.vibrate).toHaveBeenCalled();

        haptics.trigger('squelchWarning');
        expect(Vibration.vibrate).toHaveBeenCalled();
      });

      it('enables and disables hardware volume button interception seamlessly', () => {
        hardwareVolume.enableInterception();
        expect(hardwareVolume.isEnabled()).toBe(true);

        const listener = jest.fn();
        const unsub = hardwareVolume.addListener(listener);

        hardwareVolume.emitKeyEvent({
          button: 'volumeUp',
          action: 'down',
          timestamp: 1000,
        });
        expect(listener).toHaveBeenCalledWith({
          button: 'volumeUp',
          action: 'down',
          timestamp: 1000,
        });

        unsub();
        hardwareVolume.disableInterception();
        expect(hardwareVolume.isEnabled()).toBe(false);
      });
    });
  });
});
