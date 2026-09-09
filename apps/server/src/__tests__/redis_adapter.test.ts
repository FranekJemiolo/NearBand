import { SpatialEngineService } from '../services/spatial.service';
import { SquelchModerationService } from '../services/moderation.service';
import { SessionService } from '../services/session.service';

describe('Services with Redis Client', () => {
  it('exercises Redis branches in SpatialEngineService', async () => {
    const mockRedis: any = {
      geoadd: jest.fn().mockResolvedValue(1),
      geosearch: jest.fn().mockResolvedValue(['u1', 'u2']),
      zrem: jest.fn().mockResolvedValue(1),
    };

    const spatial = new SpatialEngineService({ redisClient: mockRedis });
    const coords = { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() };

    await spatial.updateUserLocation('u1', 19, coords);
    expect(mockRedis.geoadd).toHaveBeenCalled();

    const nearby = await spatial.findNearbyUsers(19, coords);
    expect(nearby).toEqual(['u1', 'u2']);
    expect(mockRedis.geosearch).toHaveBeenCalled();

    await spatial.removeUserFromChannel('u1', 19);
    expect(mockRedis.zrem).toHaveBeenCalled();

    // Test fallback to georadius when geosearch is undefined
    const legacyRedis: any = {
      geoadd: jest.fn().mockResolvedValue(1),
      georadius: jest.fn().mockResolvedValue(['u3']),
    };
    const legacySpatial = new SpatialEngineService({ redisClient: legacyRedis });
    const res = await legacySpatial.findNearbyUsers(19, coords);
    expect(res).toEqual(['u3']);
  });

  it('exercises Redis branches in SquelchModerationService', async () => {
    const mockRedis: any = {
      sadd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      scard: jest.fn().mockResolvedValue(3),
    };

    const moderation = new SquelchModerationService({ redisClient: mockRedis, threshold: 3 });
    const voteRes = await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_1');
    expect(voteRes.isSquelched).toBe(true);
    expect(voteRes.voteCount).toBe(3);
    expect(mockRedis.sadd).toHaveBeenCalled();

    const isSquelched = await moderation.isUserSquelched('grid_1', 'bad_user');
    expect(isSquelched).toBe(true);
    expect(mockRedis.scard).toHaveBeenCalled();
  });

  it('exercises Redis branches in SessionService', async () => {
    const mockRedis: any = {
      hset: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      hgetall: jest.fn().mockResolvedValue({
        userId: 'usr_abc',
        handle: 'Neon Coyote',
        currentChannel: '19',
        lastActive: '1700000000000',
        squelchCount: '0',
      }),
      del: jest.fn().mockResolvedValue(1),
    };

    const sessions = new SessionService(mockRedis);
    const created = await sessions.createSession();
    expect(created.userId).toBeDefined();
    expect(mockRedis.hset).toHaveBeenCalled();

    const fetched = await sessions.getSession('usr_abc');
    expect(fetched?.handle).toBe('Neon Coyote');
    expect(mockRedis.hgetall).toHaveBeenCalled();

    await sessions.updateChannel('usr_abc', 9);
    expect(mockRedis.hset).toHaveBeenCalled();

    await sessions.removeSession('usr_abc');
    expect(mockRedis.del).toHaveBeenCalled();
  });
});
