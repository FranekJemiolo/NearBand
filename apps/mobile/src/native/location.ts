export interface LocationValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ExtendedDeviceLocation {
  latitude: number;
  longitude: number;
  timestamp?: number;
  isMocked?: boolean;
  accuracy?: number; // Meters
  speed?: number | null; // m/s
  heading?: number | null;
  provider?: 'gps' | 'network' | 'fused' | 'corelocation';
}

export function validateDeviceLocation(coords: ExtendedDeviceLocation): LocationValidationResult {
  // Reject mock GPS on both Android (Mock Provider) and iOS (Simulated Location)
  if (coords.isMocked) {
    return {
      valid: false,
      reason: 'Rejected: Mock location provider detected on device',
    };
  }

  // Reject physically invalid latitude/longitude
  if (
    coords.latitude < -90 ||
    coords.latitude > 90 ||
    coords.longitude < -180 ||
    coords.longitude > 180
  ) {
    return {
      valid: false,
      reason: 'Rejected: Coordinates out of physical bounds',
    };
  }

  // Reject imprecise locations (> 150m error) because 5-mile radio cells require reasonable fix
  if (coords.accuracy !== undefined && coords.accuracy > 150) {
    return {
      valid: false,
      reason: `Rejected: Low location accuracy (${Math.round(coords.accuracy)}m > 150m threshold)`,
    };
  }

  return { valid: true };
}

export class LocationServiceManager {
  private lastLocation: ExtendedDeviceLocation | null = null;

  public setLocation(loc: ExtendedDeviceLocation): LocationValidationResult {
    const check = validateDeviceLocation(loc);
    if (check.valid) {
      this.lastLocation = loc;
    }
    return check;
  }

  public getLastLocation(): ExtendedDeviceLocation | null {
    return this.lastLocation;
  }
}

export const locationService = new LocationServiceManager();
