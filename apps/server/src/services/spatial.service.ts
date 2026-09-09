import Redis from 'ioredis';
import {
  Coordinates,
  calculateHaversineDistance,
  getSpatialGridId,
  getRoomNameForChannel,
  PROXIMITY_RADIUS_METERS,
} from '@nearband/shared';

export interface SpatialServiceOptions {
  redisClient?: Redis;
  proximityRadiusMeters?: number;
}

export class SpatialEngineService {
  private redis?: Redis;
  private proximityRadiusMeters: number;
  // In-memory fallback map: channel -> Map<userId, Coordinates>
  private memoryGeoStore = new Map<number, Map<string, Coordinates>>();

  constructor(options?: SpatialServiceOptions) {
    this.redis = options?.redisClient;
    this.proximityRadiusMeters = options?.proximityRadiusMeters ?? PROXIMITY_RADIUS_METERS;
  }

  private getChannelKey(channel: number): string {
    return `channel:${channel}:locations`;
  }

  /**
   * Registers or updates a user's location on a specific channel.
   */
  public async updateUserLocation(
    userId: string,
    channel: number,
    coords: Coordinates,
  ): Promise<string> {
    const gridId = getSpatialGridId(coords.latitude, coords.longitude);

    if (this.redis) {
      try {
        const key = this.getChannelKey(channel);
        await this.redis.geoadd(key, coords.longitude, coords.latitude, userId);
      } catch (err) {
        // Fallback to in-memory if Redis error occurs
        this.updateMemoryStore(userId, channel, coords);
      }
    } else {
      this.updateMemoryStore(userId, channel, coords);
    }

    return gridId;
  }

  private updateMemoryStore(userId: string, channel: number, coords: Coordinates): void {
    let channelMap = this.memoryGeoStore.get(channel);
    if (!channelMap) {
      channelMap = new Map();
      this.memoryGeoStore.set(channel, channelMap);
    }
    channelMap.set(userId, coords);
  }

  /**
   * Finds user IDs within the proximity radius on the given channel.
   */
  public async findNearbyUsers(
    channel: number,
    coords: Coordinates,
    radiusMeters: number = this.proximityRadiusMeters,
  ): Promise<string[]> {
    if (this.redis) {
      try {
        const key = this.getChannelKey(channel);
        // Using geosearch (Redis 6.2+) with fallback to georadius
        if (typeof this.redis.geosearch === 'function') {
          const results = await this.redis.geosearch(
            key,
            'FROMLONLAT',
            coords.longitude,
            coords.latitude,
            'BYRADIUS',
            radiusMeters,
            'm',
          );
          return (results as string[]) ?? [];
        } else {
          const results = await (
            this.redis as unknown as { georadius: (...args: unknown[]) => Promise<string[]> }
          ).georadius(
            key,
            coords.longitude,
            coords.latitude,
            radiusMeters,
            'm',
          );
          return (results as string[]) ?? [];
        }
      } catch {
        return this.findNearbyUsersInMemory(channel, coords, radiusMeters);
      }
    }

    return this.findNearbyUsersInMemory(channel, coords, radiusMeters);
  }

  private findNearbyUsersInMemory(
    channel: number,
    targetCoords: Coordinates,
    radiusMeters: number,
  ): string[] {
    const channelMap = this.memoryGeoStore.get(channel);
    if (!channelMap) return [];

    const nearby: string[] = [];
    for (const [userId, userCoords] of channelMap.entries()) {
      const dist = calculateHaversineDistance(targetCoords, userCoords);
      if (dist <= radiusMeters) {
        nearby.push(userId);
      }
    }
    return nearby;
  }

  /**
   * Removes a user from a channel's spatial index.
   */
  public async removeUserFromChannel(userId: string, channel: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.zrem(this.getChannelKey(channel), userId);
      } catch {
        this.removeUserFromMemory(userId, channel);
      }
    } else {
      this.removeUserFromMemory(userId, channel);
    }
  }

  private removeUserFromMemory(userId: string, channel: number): void {
    const channelMap = this.memoryGeoStore.get(channel);
    if (channelMap) {
      channelMap.delete(userId);
    }
  }

  /**
   * Resolves the dynamic LiveKit room name for a channel and coordinate pair.
   */
  public getRoomInfoForCoordinates(
    channel: number,
    coords: Coordinates,
  ): { gridId: string; roomName: string } {
    const gridId = getSpatialGridId(coords.latitude, coords.longitude);
    const roomName = getRoomNameForChannel(channel, gridId);
    return { gridId, roomName };
  }
}
