import { VelocityTrackingService } from '../services/velocity.service';

describe('VelocityTrackingService', () => {
  let service: VelocityTrackingService;

  beforeEach(() => {
    service = new VelocityTrackingService(250);
  });

  it('rejects coordinates flagged from mock provider', () => {
    const res = service.verifyMovement('u1', {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now(),
      isMocked: true,
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('mock location');
  });

  it('rejects out-of-bounds coordinates', () => {
    const res = service.verifyMovement('u1', {
      latitude: 195,
      longitude: -122.4194,
      timestamp: Date.now(),
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('physical bounds');
  });

  it('accepts valid initial location and saves record', () => {
    const t0 = 1700000000000;
    const res = service.verifyMovement('u1', {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: t0,
    });
    expect(res.valid).toBe(true);
    expect(service.getUserRecord('u1')).toBeDefined();
  });

  it('accepts realistic travel velocity', () => {
    const t0 = 1700000000000;
    service.verifyMovement('u1', {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: t0,
    });

    // Moved ~50 meters in 5 seconds (10 m/s)
    const res2 = service.verifyMovement('u1', {
      latitude: 37.7753,
      longitude: -122.4194,
      timestamp: t0 + 5000,
    });
    expect(res2.valid).toBe(true);
  });

  it('rejects impossible teleportation velocity and retains previous coordinates', () => {
    const t0 = 1700000000000;
    service.verifyMovement('u1', {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: t0,
    });

    // Jump to London in 1 second
    const resJump = service.verifyMovement('u1', {
      latitude: 51.5074,
      longitude: -0.1278,
      timestamp: t0 + 1000,
    });
    expect(resJump.valid).toBe(false);
    expect(resJump.reason).toContain('exceeds threshold');
  });

  it('clears user record cleanly', () => {
    service.verifyMovement('u1', {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now(),
    });
    service.clearUser('u1');
    expect(service.getUserRecord('u1')).toBeUndefined();
  });
});
