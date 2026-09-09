import {
  Coordinates,
  validateVelocity,
  MAX_REALISTIC_VELOCITY_MPS,
  VelocityCheckResult,
} from '@nearband/shared';

export interface UserLocationRecord {
  coordinates: Coordinates;
  updatedAt: number;
}

export class VelocityTrackingService {
  private userLocations = new Map<string, UserLocationRecord>();
  private maxAllowedSpeedMps: number;

  constructor(maxAllowedSpeedMps: number = MAX_REALISTIC_VELOCITY_MPS) {
    this.maxAllowedSpeedMps = maxAllowedSpeedMps;
  }

  /**
   * Evaluates incoming coordinates for mock provider flags and realistic travel velocity.
   */
  public verifyMovement(userId: string, newCoords: Coordinates): VelocityCheckResult {
    // 1. OS-level hardware mock detection
    if (newCoords.isMocked) {
      return {
        valid: false,
        calculatedSpeedMps: 0,
        maxAllowedSpeedMps: this.maxAllowedSpeedMps,
        reason: 'Rejected: Coordinates originate from a mock location provider',
      };
    }

    // 2. Coordinate range sanity check
    if (
      newCoords.latitude < -90 ||
      newCoords.latitude > 90 ||
      newCoords.longitude < -180 ||
      newCoords.longitude > 180
    ) {
      return {
        valid: false,
        calculatedSpeedMps: 0,
        maxAllowedSpeedMps: this.maxAllowedSpeedMps,
        reason: 'Rejected: Coordinate values out of physical bounds',
      };
    }

    const previousRecord = this.userLocations.get(userId);

    // If first location update for session, record and accept
    if (!previousRecord) {
      this.userLocations.set(userId, {
        coordinates: newCoords,
        updatedAt: Date.now(),
      });
      return {
        valid: true,
        calculatedSpeedMps: 0,
        maxAllowedSpeedMps: this.maxAllowedSpeedMps,
      };
    }

    // 3. Velocity check between successive readings
    const checkResult = validateVelocity(
      previousRecord.coordinates,
      newCoords,
      this.maxAllowedSpeedMps,
    );

    if (checkResult.valid) {
      this.userLocations.set(userId, {
        coordinates: newCoords,
        updatedAt: Date.now(),
      });
    }

    return checkResult;
  }

  public clearUser(userId: string): void {
    this.userLocations.delete(userId);
  }

  public getUserRecord(userId: string): UserLocationRecord | undefined {
    return this.userLocations.get(userId);
  }
}
