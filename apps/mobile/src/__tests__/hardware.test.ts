import {
  HardwareVolumeManager,
  hardwareVolume,
  useHardwareVolumePtt,
} from '../native/volumeButton';
import { BackgroundAudioManager } from '../native/background';
import { locationService } from '../native/location';
import { haptics } from '../native/haptics';
import { permissionsManager } from '../native/permissions';
import { Platform, PermissionsAndroid, PermissionStatus, Vibration } from 'react-native';
import { renderTestHook } from './testUtils';

describe('Hardware & Native Services', () => {
  describe('HardwareVolumeManager', () => {
    let volumeManager: HardwareVolumeManager;

    beforeEach(() => {
      volumeManager = new HardwareVolumeManager();
    });

    it('ignores events when interception is disabled', () => {
      const listener = jest.fn();
      volumeManager.addListener(listener);

      volumeManager.emitKeyEvent({ button: 'volumeUp', action: 'down', timestamp: Date.now() });
      expect(listener).not.toHaveBeenCalled();

      expect(volumeManager.handleAndroidKeyEvent({ keyCode: 24, action: 0, repeatCount: 0 })).toBe(
        false,
      );
      expect(volumeManager.handleIosVolumeEvent({ volume: 0.5, direction: 'up' })).toBe(false);
    });

    it('emits events when interception is enabled', () => {
      const listener = jest.fn();
      const unsubscribe = volumeManager.addListener(listener);

      volumeManager.enableInterception();
      expect(volumeManager.isEnabled()).toBe(true);

      volumeManager.emitKeyEvent({ button: 'volumeDown', action: 'down', timestamp: Date.now() });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      volumeManager.emitKeyEvent({ button: 'volumeDown', action: 'up', timestamp: Date.now() });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('returns false for unrecognized Android keycodes', () => {
      volumeManager.enableInterception();
      expect(volumeManager.handleAndroidKeyEvent({ keyCode: 999, action: 0, repeatCount: 0 })).toBe(
        false,
      );
    });
  });

  describe('useHardwareVolumePtt hook', () => {
    it('hooks volume button events to onPttDown and onPttUp', () => {
      const onDown = jest.fn();
      const onUp = jest.fn();

      const { unmount, act } = renderTestHook(() =>
        useHardwareVolumePtt({ onPttDown: onDown, onPttUp: onUp }),
      );

      act(() => {
        hardwareVolume.emitKeyEvent({ button: 'volumeUp', action: 'down', timestamp: Date.now() });
      });
      expect(onDown).toHaveBeenCalledTimes(1);

      act(() => {
        hardwareVolume.emitKeyEvent({ button: 'volumeUp', action: 'up', timestamp: Date.now() });
      });
      expect(onUp).toHaveBeenCalledTimes(1);

      unmount();
      expect(hardwareVolume.isEnabled()).toBe(false);
    });

    it('disables interception when enabled is false', () => {
      const onDown = jest.fn();
      const onUp = jest.fn();
      renderTestHook(() =>
        useHardwareVolumePtt({ onPttDown: onDown, onPttUp: onUp, enabled: false }),
      );
      expect(hardwareVolume.isEnabled()).toBe(false);
    });
  });

  describe('BackgroundAudioManager', () => {
    it('manages background audio lifecycle and notification state', async () => {
      const bg = new BackgroundAudioManager();
      expect(bg.getStatus().isRunning).toBe(false);

      await bg.startService({ channel: 19, handle: 'Neon Coyote' });
      const status = bg.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.channel).toBe(19);
      expect(status.handle).toBe('Neon Coyote');

      bg.updateNotification(9, 'Neon Coyote');
      expect(bg.getStatus().channel).toBe(9);

      await bg.stopService();
      expect(bg.getStatus().isRunning).toBe(false);
    });
  });

  describe('LocationServiceManager', () => {
    it('stores valid locations and rejects invalid locations', () => {
      const valid = locationService.setLocation({
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: Date.now(),
      });
      expect(valid.valid).toBe(true);
      expect(locationService.getLastLocation()?.latitude).toBe(40.7128);

      const invalid = locationService.setLocation({
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: Date.now(),
        isMocked: true,
      });
      expect(invalid.valid).toBe(false);
      // Last location remains the valid one
      expect(locationService.getLastLocation()?.latitude).toBe(40.7128);
    });
  });

  describe('HapticsManager', () => {
    it('respects setEnabled(false)', () => {
      jest.clearAllMocks();
      haptics.setEnabled(false);
      haptics.trigger('pttDown');
      expect(Vibration.vibrate).not.toHaveBeenCalled();

      haptics.setEnabled(true);
      haptics.trigger('pttDown');
      expect(Vibration.vibrate).toHaveBeenCalled();
    });
  });

  describe('PermissionsManager Error & Denial Handling', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      jest.clearAllMocks();
    });

    it('handles permission request exceptions gracefully', async () => {
      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockRejectedValueOnce(new Error('Permission service dead'));
      const status = await permissionsManager.requestFineLocation();
      expect(status).toBe('denied');

      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockRejectedValueOnce(new Error('Permission service dead'));
      const bgStatus = await permissionsManager.requestBackgroundLocation();
      expect(bgStatus).toBe('denied');

      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockRejectedValueOnce(new Error('Permission service dead'));
      const micStatus = await permissionsManager.requestMicrophone();
      expect(micStatus).toBe('denied');

      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockRejectedValueOnce(new Error('Permission service dead'));
      const notifStatus = await permissionsManager.requestNotifications();
      expect(notifStatus).toBe('denied');
    });

    it('correctly maps DENIED status', async () => {
      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockResolvedValueOnce('denied' as PermissionStatus);
      const status = await permissionsManager.requestFineLocation();
      expect(status).toBe('denied');
    });
  });
});
