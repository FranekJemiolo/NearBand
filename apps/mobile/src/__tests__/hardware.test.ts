import {
  HardwareVolumeManager,
  hardwareVolume,
  useHardwareVolumePtt,
} from '../native/volumeButton';
import { BackgroundAudioManager } from '../native/background';
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
});
