import Redis from 'ioredis';
import { SQUELCH_THRESHOLD } from '@nearband/shared';

export interface SquelchCheckResult {
  isSquelched: boolean;
  voteCount: number;
  threshold: number;
}

export class SquelchModerationService {
  private redis?: Redis;
  private threshold: number;
  private ttlSeconds: number;
  // In-memory ledger fallback: gridId:targetUserId -> Set<reporterUserId>
  private memoryLedger = new Map<string, Set<string>>();

  constructor(options?: { redisClient?: Redis; threshold?: number; ttlSeconds?: number }) {
    this.redis = options?.redisClient;
    this.threshold = options?.threshold ?? SQUELCH_THRESHOLD;
    this.ttlSeconds = options?.ttlSeconds ?? 86400; // 24-hour rolling window
  }

  private getLedgerKey(gridId: string, targetUserId: string): string {
    return `squelch:${gridId}:${targetUserId}`;
  }

  /**
   * Casts a vote to squelch a target user. Returns updated squelch status.
   */
  public async voteSquelch(
    gridId: string,
    targetUserId: string,
    reporterUserId: string,
  ): Promise<SquelchCheckResult> {
    if (this.redis) {
      try {
        const key = this.getLedgerKey(gridId, targetUserId);
        await this.redis.sadd(key, reporterUserId);
        await this.redis.expire(key, this.ttlSeconds);
        const count = await this.redis.scard(key);

        return {
          isSquelched: count >= this.threshold,
          voteCount: count,
          threshold: this.threshold,
        };
      } catch {
        return this.voteInMemory(gridId, targetUserId, reporterUserId);
      }
    }

    return this.voteInMemory(gridId, targetUserId, reporterUserId);
  }

  private voteInMemory(
    gridId: string,
    targetUserId: string,
    reporterUserId: string,
  ): SquelchCheckResult {
    const key = this.getLedgerKey(gridId, targetUserId);
    let reporters = this.memoryLedger.get(key);
    if (!reporters) {
      reporters = new Set();
      this.memoryLedger.set(key, reporters);
    }
    reporters.add(reporterUserId);

    return {
      isSquelched: reporters.size >= this.threshold,
      voteCount: reporters.size,
      threshold: this.threshold,
    };
  }

  /**
   * Checks if a target user is currently squelched in the given grid.
   */
  public async isUserSquelched(gridId: string, targetUserId: string): Promise<boolean> {
    if (this.redis) {
      try {
        const key = this.getLedgerKey(gridId, targetUserId);
        const count = await this.redis.scard(key);
        return count >= this.threshold;
      } catch {
        return this.isUserSquelchedInMemory(gridId, targetUserId);
      }
    }

    return this.isUserSquelchedInMemory(gridId, targetUserId);
  }

  private isUserSquelchedInMemory(gridId: string, targetUserId: string): boolean {
    const key = this.getLedgerKey(gridId, targetUserId);
    const reporters = this.memoryLedger.get(key);
    return (reporters?.size ?? 0) >= this.threshold;
  }
}
