import {
  calculateHaversineDistance,
  validateVelocity,
  getSpatialGridId,
  getRoomNameForChannel,
  generatePhoneticHandle,
  MAX_REALISTIC_VELOCITY_MPS,
} from '../index';

describe('Shared Proximity & Velocity Math', () => {
  it('calculates accurate Haversine distance', () => {
    // New York to Philadelphia (~130 km)
    const ny = { latitude: 40.7128, longitude: -74.006 };
    const philly = { latitude: 39.9526, longitude: -75.1652 };
    const distanceMeters = calculateHaversineDistance(ny, philly);

    expect(distanceMeters).toBeGreaterThan(120000);
    expect(distanceMeters).toBeLessThan(140000);
  });

  it('validates realistic pedestrian and car velocities', () => {
    const t0 = 1700000000000;
    const start = { latitude: 37.7749, longitude: -122.4194, timestamp: t0 };
    // Moved ~100 meters over 10 seconds = 10 m/s (~36 km/h)
    const end = { latitude: 37.7758, longitude: -122.4194, timestamp: t0 + 10000 };

    const result = validateVelocity(start, end);
    expect(result.valid).toBe(true);
    expect(result.calculatedSpeedMps).toBeLessThan(20);
  });

  it('rejects teleportation and impossible velocity jumps', () => {
    const t0 = 1700000000000;
    const start = { latitude: 37.7749, longitude: -122.4194, timestamp: t0 };
    // Jump to Tokyo (thousands of km in 2 seconds)
    const end = { latitude: 35.6762, longitude: 139.6503, timestamp: t0 + 2000 };

    const result = validateVelocity(start, end);
    expect(result.valid).toBe(false);
    expect(result.calculatedSpeedMps).toBeGreaterThan(MAX_REALISTIC_VELOCITY_MPS);
    expect(result.reason).toBeDefined();
  });

  it('generates consistent grid IDs and room names', () => {
    const gridId1 = getSpatialGridId(40.7128, -74.006);
    const gridId2 = getSpatialGridId(40.713, -74.005);
    expect(gridId1).toBe(gridId2);

    const room = getRoomNameForChannel(19, gridId1);
    expect(room).toBe(`nearband_ch19_${gridId1}`);

    // Bounds checking on channels
    expect(getRoomNameForChannel(999, 'grid1')).toContain('ch40');
    expect(getRoomNameForChannel(0, 'grid1')).toContain('ch1');
  });

  it('generates memorable phonetic handles', () => {
    const handle1 = generatePhoneticHandle('user-seed-123');
    const handle2 = generatePhoneticHandle('user-seed-123');
    expect(handle1).toBe(handle2);
    expect(handle1.split(' ').length).toBe(2);

    const randomHandle = generatePhoneticHandle();
    expect(randomHandle.split(' ').length).toBe(2);
  });
});
