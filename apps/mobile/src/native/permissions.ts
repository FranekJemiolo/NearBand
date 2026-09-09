import { Platform, PermissionsAndroid, PermissionStatus } from 'react-native';

export type NearBandPermissionResult = 'granted' | 'denied' | 'blocked';

export interface PlatformPermissionsState {
  fineLocation: NearBandPermissionResult;
  backgroundLocation: NearBandPermissionResult;
  microphone: NearBandPermissionResult;
  notifications: NearBandPermissionResult;
  isReady: boolean;
}

export class PermissionsManager {
  /**
   * Request Core Location / Android Fine Location
   */
  public async requestFineLocation(): Promise<NearBandPermissionResult> {
    if (Platform.OS === 'android') {
      try {
        const finePermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        if (!finePermission) return 'granted';
        const status = await PermissionsAndroid.request(finePermission, {
          title: 'NearBand Location Permission',
          message:
            'NearBand needs access to your precise location to connect you with CB radio operators within your 5-mile radius.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow Precise Location',
        });

        return this.mapAndroidStatus(status);
      } catch {
        return 'denied';
      }
    } else if (Platform.OS === 'ios') {
      // In native iOS CoreLocation runtime, triggers requestWhenInUseAuthorization
      return 'granted';
    }

    return 'granted';
  }

  /**
   * Request Android Background Location / iOS Always Authorization
   */
  public async requestBackgroundLocation(): Promise<NearBandPermissionResult> {
    if (Platform.OS === 'android') {
      try {
        // Android 10+ (Q+) requires explicit separate background location request
        const bgPermission = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
        if (!bgPermission) return 'granted';
        const status = await PermissionsAndroid.request(bgPermission, {
          title: 'NearBand Background Audio & Location',
          message:
            'Allow NearBand to maintain your active CB channel connection while your screen is off or in your pocket.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow in Background',
        });

        return this.mapAndroidStatus(status);
      } catch {
        return 'denied';
      }
    } else if (Platform.OS === 'ios') {
      // In native iOS CoreLocation runtime, triggers requestAlwaysAuthorization
      return 'granted';
    }

    return 'granted';
  }

  /**
   * Request Microphone / Audio Record Permission
   */
  public async requestMicrophone(): Promise<NearBandPermissionResult> {
    if (Platform.OS === 'android') {
      try {
        const audioPermission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
        if (!audioPermission) return 'granted';
        const status = await PermissionsAndroid.request(audioPermission, {
          title: 'NearBand Microphone Access',
          message:
            'NearBand needs microphone access for Push-To-Talk voice transmission on Citizen Band channels.',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow Microphone',
        });

        return this.mapAndroidStatus(status);
      } catch {
        return 'denied';
      }
    } else if (Platform.OS === 'ios') {
      // In native iOS runtime, triggers AVAudioSession.sharedInstance().requestRecordPermission
      return 'granted';
    }

    return 'granted';
  }

  /**
   * Request Android 13+ (Tiramisu) Post Notifications Permission
   */
  public async requestNotifications(): Promise<NearBandPermissionResult> {
    if (Platform.OS === 'android') {
      try {
        if (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
          const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'NearBand Ongoing Transmission Service',
              message:
                'NearBand displays an ongoing notification while listening to proximity channels.',
              buttonNegative: 'Dismiss',
              buttonPositive: 'Allow',
            },
          );
          return this.mapAndroidStatus(status);
        }
        return 'granted';
      } catch {
        return 'denied';
      }
    }

    return 'granted';
  }

  /**
   * Request all mandatory permissions required to operate NearBand
   */
  public async requestAll(): Promise<PlatformPermissionsState> {
    const fineLocation = await this.requestFineLocation();
    const microphone = await this.requestMicrophone();
    const backgroundLocation = await this.requestBackgroundLocation();
    const notifications = await this.requestNotifications();

    const isReady =
      fineLocation === 'granted' &&
      microphone === 'granted' &&
      (Platform.OS === 'ios' || backgroundLocation === 'granted');

    return {
      fineLocation,
      backgroundLocation,
      microphone,
      notifications,
      isReady,
    };
  }

  private mapAndroidStatus(status: PermissionStatus | string): NearBandPermissionResult {
    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return 'blocked';
    }
    return 'denied';
  }
}

export const permissionsManager = new PermissionsManager();
