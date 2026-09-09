import { Platform, PermissionsAndroid, PermissionStatus, Vibration } from 'react-native';
import { permissionsManager } from '../native/permissions';
import { backgroundAudio } from '../native/background';
import { hardwareVolume } from '../native/volumeButton';
import { haptics } from '../native/haptics';
import { validateDeviceLocation } from '../native/location';

describe('Android Platform Native Suite', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    jest.clearAllMocks();
  });

  describe('Android Runtime Permissions (Location, Mic, Notifications)', () => {
    it('requests FINE_LOCATION and returns granted', async () => {
      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockResolvedValueOnce('granted' as PermissionStatus);

      const status = await permissionsManager.requestFineLocation();
      expect(status).toBe('granted');
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        expect.any(Object),
      );
    });

    it('requests separate BACKGROUND_LOCATION for Android 10+ background radio', async () => {
      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockResolvedValueOnce('granted' as PermissionStatus);

      const status = await permissionsManager.requestBackgroundLocation();
      expect(status).toBe('granted');
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        expect.any(Object),
      );
    });

    it('detects permanently denied / blocked permissions (NEVER_ASK_AGAIN)', async () => {
      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockResolvedValueOnce('never_ask_again' as PermissionStatus);

      const status = await permissionsManager.requestMicrophone();
      expect(status).toBe('blocked');
    });

    it('requests Android 13+ POST_NOTIFICATIONS for ongoing foreground service', async () => {
      jest
        .spyOn(PermissionsAndroid, 'request')
        .mockResolvedValueOnce('granted' as PermissionStatus);

      const status = await permissionsManager.requestNotifications();
      expect(status).toBe('granted');
    });
  });

  describe('Android Foreground Service & WakeLock Management', () => {
    it('starts foreground service with notification channel and holds CPU WakeLock', async () => {
      await backgroundAudio.startService({ channel: 9, handle: 'Rusty Coyote' });

      const config = backgroundAudio.getAndroidConfig();
      expect(config.channelId).toBe('nearband_audio_service');
      expect(config.wakeLockHeld).toBe(true);
      expect(config.notificationTitle).toContain('Channel 9');
      expect(config.notificationText).toContain('Rusty Coyote');

      // Update active channel
      backgroundAudio.updateNotification(19, 'Rusty Coyote');
      expect(backgroundAudio.getAndroidConfig().notificationTitle).toContain('Channel 19');

      // Stop service releases wake lock
      await backgroundAudio.stopService();
      expect(backgroundAudio.getAndroidConfig().wakeLockHeld).toBe(false);
    });
  });

  describe('Android Hardware Key Interception & Key Repeat Suppression', () => {
    it('intercepts KEYCODE_VOLUME_UP (24) and KEYCODE_VOLUME_DOWN (25)', () => {
      hardwareVolume.enableInterception();
      const listener = jest.fn();
      const unsub = hardwareVolume.addListener(listener);

      // Volume Up Down
      const handledUp = hardwareVolume.handleAndroidKeyEvent({
        keyCode: 24,
        action: 0,
        repeatCount: 0,
      });
      expect(handledUp).toBe(true);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ button: 'volumeUp', action: 'down' }),
      );

      // Volume Down Up
      const handledDown = hardwareVolume.handleAndroidKeyEvent({
        keyCode: 25,
        action: 1,
        repeatCount: 0,
      });
      expect(handledDown).toBe(true);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ button: 'volumeDown', action: 'up' }),
      );

      unsub();
      hardwareVolume.disableInterception();
    });

    it('suppresses key repeat events (repeatCount > 0) to prevent PTT stuttering', () => {
      hardwareVolume.enableInterception();
      const listener = jest.fn();
      const unsub = hardwareVolume.addListener(listener);

      // First down key (repeatCount: 0)
      hardwareVolume.handleAndroidKeyEvent({
        keyCode: 24,
        action: 0,
        repeatCount: 0,
      });
      expect(listener).toHaveBeenCalledTimes(1);

      // Subsequent held-down repeat events (repeatCount: 1, 2, 3)
      const consumedRepeat = hardwareVolume.handleAndroidKeyEvent({
        keyCode: 24,
        action: 0,
        repeatCount: 1,
      });
      expect(consumedRepeat).toBe(true); // Consumed so OS volume doesn't change
      expect(listener).toHaveBeenCalledTimes(1); // But NOT re-emitted as new PTT press

      unsub();
      hardwareVolume.disableInterception();
    });
  });

  describe('Android Mock GPS Rejection & Vibrator Patterns', () => {
    it('detects and rejects Android mock location providers', () => {
      const result = validateDeviceLocation({
        latitude: 41.8781,
        longitude: -87.6298,
        isMocked: true,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Mock location provider detected');
    });

    it('triggers Android-specific millisecond vibration patterns', () => {
      haptics.trigger('pttDown');
      expect(Vibration.vibrate).toHaveBeenCalledWith(45);

      haptics.trigger('pttUp');
      expect(Vibration.vibrate).toHaveBeenCalledWith(25);

      haptics.trigger('rogerBeep');
      expect(Vibration.vibrate).toHaveBeenCalledWith([0, 30, 50, 30]);

      haptics.trigger('squelchWarning');
      expect(Vibration.vibrate).toHaveBeenCalledWith([0, 80, 60, 80, 60, 80]);
    });
  });
});
