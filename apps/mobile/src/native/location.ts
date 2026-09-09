import { Coordinates } from '@nearband/shared';

export interface LocationValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateDeviceLocation(coords: Coordinates): LocationValidationResult {
  if (coords.isMocked) {
    return {
      valid: false,
      reason: 'Rejected: Mock location provider detected on device',
    };
  }

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

  return { valid: true };
}
