import { Platform, Vibration } from 'react-native';
import { permissionsManager } from '../native/permissions';
import { backgroundAudio } from '../native/background';
import { hardwareVolume } from '../native/volumeButton';
import { haptics } from '../native/haptics';
import { validateDeviceLocation } from '../native/location';

describe('iOS Platform Native Suite', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    jest.clearAllMocks();
  });

  describe('iOS Permissions & CoreLocation', () => {
    it('requests and returns granted for iOS CoreLocation and Audio', async () => {
      const fine = await permissionsManager.requestFineLocation();
      expect(fine).toBe('granted');

      const bg = await permissionsManager.requestBackgroundLocation();
      expect(bg).toBe('granted');

      const mic = await permissionsManager.requestMicrophone();
      expect(mic).toBe('granted');

      const all = await permissionsManager.requestAll();
      expect(all.isReady).toBe(true);
      expect(all.fineLocation).toBe('granted');
      expect(all.microphone).toBe('granted');
    });

    it('rejects simulated / mock locations on iOS', () => {
      const result = validateDeviceLocation({
        latitude: 37.7749,
        longitude: -122.4194,
        isMocked: true,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Mock location provider detected');
    });

    it('rejects low accuracy fixes on iOS to maintain tight 5-mile radio clustering', () => {
      const result = validateDeviceLocation({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 250, // 250m error is too inaccurate
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Low location accuracy');
    });
  });

  describe('iOS AVAudioSession & Lifecycle Management', () => {
    it('configures AVAudioSession for PlayAndRecord with VoiceChat and Speaker routing', async () => {
      await backgroundAudio.startService({ channel: 19, handle: 'Neon Falcon' });

      const iosConfig = backgroundAudio.getIosSessionConfig();
      expect(iosConfig.active).toBe(true);
      expect(iosConfig.category).toBe('PlayAndRecord');
      expect(iosConfig.mode).toBe('VoiceChat');
      expect(iosConfig.options).toContain('DefaultToSpeaker');
      expect(iosConfig.options).toContain('AllowBluetooth');
      expect(iosConfig.options).toContain('DuckOthers');

      await backgroundAudio.stopService();
      expect(backgroundAudio.getIosSessionConfig().active).toBe(false);
    });

    it('handles iOS audio interruptions (e.g. incoming phone call or Siri) by invoking callbacks', () => {
      const onInterruption = jest.fn();
      const unsubscribe = backgroundAudio.onInterruption(onInterruption);

      backgroundAudio.simulateIosInterruptionBegan();
      expect(onInterruption).toHaveBeenCalledTimes(1);

      unsubscribe();
      backgroundAudio.simulateIosInterruptionBegan();
      expect(onInterruption).toHaveBeenCalledTimes(1);
    });

    it('handles iOS audio route change events (e.g. wired headset or AirPods unplugged)', () => {
      const onRouteChange = jest.fn();
      const unsubscribe = backgroundAudio.onAudioRouteChange(onRouteChange);

      backgroundAudio.simulateIosRouteChange('headsetUnplugged');
      expect(onRouteChange).toHaveBeenCalledWith('headsetUnplugged');

      unsubscribe();
    });
  });

  describe('iOS Hardware Volume & Haptics', () => {
    it('dispatches iOS volume change events to key listeners', () => {
      hardwareVolume.enableInterception();
      const listener = jest.fn();
      const unsub = hardwareVolume.addListener(listener);

      const handled = hardwareVolume.handleIosVolumeEvent({
        volume: 0.8,
        direction: 'up',
      });

      expect(handled).toBe(true);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          button: 'volumeUp',
          action: 'down',
        }),
      );

      unsub();
      hardwareVolume.disableInterception();
    });

    it('triggers iOS-tailored tactile pulses for PTT, Roger Beep, and Squelch', () => {
      haptics.trigger('pttDown');
      expect(Vibration.vibrate).toHaveBeenCalledWith(50);

      haptics.trigger('pttUp');
      expect(Vibration.vibrate).toHaveBeenCalledWith(20);

      haptics.trigger('rogerBeep');
      expect(Vibration.vibrate).toHaveBeenCalledWith([0, 25, 40, 25]);

      haptics.trigger('squelchWarning');
      expect(Vibration.vibrate).toHaveBeenCalledWith([0, 70, 50, 70]);
    });
  });
});
