/**
 * NearBand Shared Domain Models, Constants & Spatial Math
 */

export const CB_MIN_CHANNEL = 1;
export const CB_MAX_CHANNEL = 40;
export const DEFAULT_CHANNEL = 19; // Classic highway & trucker channel

export const PROXIMITY_RADIUS_METERS = 8046.72; // ~5 miles (8 km)
export const MAX_TRANSMISSION_DURATION_SECONDS = 30; // Hard cutoff
export const VAD_SILENCE_TIMEOUT_MS = 2000; // 2 seconds client silence drops transmission
export const MAX_REALISTIC_VELOCITY_MPS = 250; // ~900 km/h (commercial jet threshold)
export const SQUELCH_THRESHOLD = 3; // Flags before handle is squelched locally

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp: number;
  isMocked?: boolean;
}

export interface EphemeralUser {
  userId: string;
  handle: string;
  currentChannel: number;
  lastActive: number;
  squelchCount: number;
  lastCoordinates?: Coordinates;
}

export interface LiveKitRoomInfo {
  roomName: string;
  token: string;
  serverUrl: string;
  channel: number;
  gridId: string;
}

export interface SquelchVote {
  targetUserId: string;
  reporterUserId: string;
  gridId: string;
  timestamp: number;
}

export interface TransmissionState {
  isTransmitting: boolean;
  channel: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  activeSpeakers: string[];
}

export interface AudioCollisionState {
  channel: number;
  isColliding: boolean;
  activeHandleCount: number;
  handles: string[];
}

export interface VelocityCheckResult {
  valid: boolean;
  calculatedSpeedMps: number;
  maxAllowedSpeedMps: number;
  reason?: string;
}

/**
 * Calculates Haversine distance in meters between two lat/lon points.
 */
export function calculateHaversineDistance(
  coord1: Pick<Coordinates, 'latitude' | 'longitude'>,
  coord2: Pick<Coordinates, 'latitude' | 'longitude'>,
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates velocity between two chronological GPS reports.
 */
export function validateVelocity(
  prevCoord: Coordinates,
  nextCoord: Coordinates,
  maxAllowedSpeedMps: number = MAX_REALISTIC_VELOCITY_MPS,
): VelocityCheckResult {
  const dtSeconds = Math.max((nextCoord.timestamp - prevCoord.timestamp) / 1000, 0.001);
  const distanceMeters = calculateHaversineDistance(prevCoord, nextCoord);
  const calculatedSpeed = distanceMeters / dtSeconds;

  if (calculatedSpeed > maxAllowedSpeedMps) {
    return {
      valid: false,
      calculatedSpeedMps: calculatedSpeed,
      maxAllowedSpeedMps,
      reason: `Velocity ${calculatedSpeed.toFixed(1)} m/s exceeds threshold of ${maxAllowedSpeedMps} m/s`,
    };
  }

  return {
    valid: true,
    calculatedSpeedMps: calculatedSpeed,
    maxAllowedSpeedMps,
  };
}

/**
 * Converts latitude/longitude to a spatial grid ID representing ~5 miles.
 * Uses 2 decimal places precision (~1.1 km cell) grouped into ~8km buckets.
 */
export function getSpatialGridId(lat: number, lon: number): string {
  // Approximate 0.07 degrees ~ 7.8 km latitude / longitude step
  const step = 0.072;
  const latBucket = Math.floor(lat / step) * step;
  const lonBucket = Math.floor(lon / step) * step;
  const latStr = latBucket.toFixed(3).replace('.', 'd').replace('-', 'm');
  const lonStr = lonBucket.toFixed(3).replace('.', 'd').replace('-', 'm');
  return `grid_${latStr}_${lonStr}`;
}

/**
 * Generates dynamic LiveKit room name for a channel and spatial grid.
 */
export function getRoomNameForChannel(channel: number, gridId: string): string {
  const safeChannel = Math.max(CB_MIN_CHANNEL, Math.min(CB_MAX_CHANNEL, Math.round(channel)));
  return `nearband_ch${safeChannel}_${gridId}`;
}

const PHONETIC_ADJECTIVES = [
  'Rusty',
  'Neon',
  'Silver',
  'Cobalt',
  'Echo',
  'Copper',
  'Static',
  'Iron',
  'Midnight',
  'Solar',
  'Delta',
  'Amber',
  'Thunder',
  'Velvet',
  'Shadow',
  'Crimson',
  'Phantom',
  'Timber',
  'Granite',
  'Whispering',
];

const PHONETIC_NOUNS = [
  'Falcon',
  'Coyote',
  'Badger',
  'Fox',
  'Hawk',
  'Mustang',
  'Ranger',
  'Nomad',
  'Bison',
  'Condor',
  'Grizzly',
  'Viper',
  'Raven',
  'Wanderer',
  'Drifter',
  'Pilot',
  'Beaver',
  'Wolf',
  'Osprey',
  'Cougar',
];

/**
 * Generates an ephemeral memorable phonetic handle (e.g. "Rusty Falcon").
 */
export function generatePhoneticHandle(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const adjIdx = Math.abs(hash) % PHONETIC_ADJECTIVES.length;
    const nounIdx = Math.abs(Math.floor(hash / 31)) % PHONETIC_NOUNS.length;
    const adj = PHONETIC_ADJECTIVES[adjIdx]!;
    const noun = PHONETIC_NOUNS[nounIdx]!;
    return `${adj} ${noun}`;
  }

  const adj = PHONETIC_ADJECTIVES[Math.floor(Math.random() * PHONETIC_ADJECTIVES.length)]!;
  const noun = PHONETIC_NOUNS[Math.floor(Math.random() * PHONETIC_NOUNS.length)]!;
  return `${adj} ${noun}`;
}
