import Redis from 'ioredis';
import { generatePhoneticHandle, DEFAULT_CHANNEL, EphemeralUser } from '@nearband/shared';
import { v4 as uuidv4 } from 'uuid';

export class SessionService {
  private redis?: Redis;
  private memorySessions = new Map<string, EphemeralUser>();

  constructor(redisClient?: Redis) {
    this.redis = redisClient;
  }

  public async createSession(seed?: string): Promise<EphemeralUser> {
    const userId = `usr_${uuidv4().substring(0, 8)}`;
    const handle = generatePhoneticHandle(seed);

    const user: EphemeralUser = {
      userId,
      handle,
      currentChannel: DEFAULT_CHANNEL,
      lastActive: Date.now(),
      squelchCount: 0,
    };

    if (this.redis) {
      try {
        const key = `user:${userId}`;
        await this.redis.hset(key, {
          userId: user.userId,
          handle: user.handle,
          currentChannel: user.currentChannel.toString(),
          lastActive: user.lastActive.toString(),
          squelchCount: user.squelchCount.toString(),
        });
        await this.redis.expire(key, 86400); // 24h session TTL
      } catch {
        this.memorySessions.set(userId, user);
      }
    } else {
      this.memorySessions.set(userId, user);
    }

    return user;
  }

  public async getSession(userId: string): Promise<EphemeralUser | null> {
    if (this.redis) {
      try {
        const record = await this.redis.hgetall(`user:${userId}`);
        if (record && record.userId) {
          return {
            userId: record.userId,
            handle: record.handle || 'Anonymous',
            currentChannel: parseInt(record.currentChannel || '19', 10),
            lastActive: parseInt(record.lastActive || '0', 10),
            squelchCount: parseInt(record.squelchCount || '0', 10),
          };
        }
      } catch {
        return this.memorySessions.get(userId) ?? null;
      }
    }

    return this.memorySessions.get(userId) ?? null;
  }

  public async updateChannel(userId: string, channel: number): Promise<void> {
    const session = await this.getSession(userId);
    if (!session) return;

    session.currentChannel = channel;
    session.lastActive = Date.now();

    if (this.redis) {
      try {
        await this.redis.hset(`user:${userId}`, 'currentChannel', channel.toString());
      } catch {
        this.memorySessions.set(userId, session);
      }
    } else {
      this.memorySessions.set(userId, session);
    }
  }

  public async removeSession(userId: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(`user:${userId}`);
      } catch {
        this.memorySessions.delete(userId);
      }
    } else {
      this.memorySessions.delete(userId);
    }
  }
}
