import { SpatialEngineService } from '../services/spatial.service';

describe('SpatialEngineService', () => {
  let spatial: SpatialEngineService;

  beforeEach(() => {
    spatial = new SpatialEngineService();
  });

  it('generates dynamic room name and grid ID', () => {
    const coords = { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() };
    const info = spatial.getRoomInfoForCoordinates(19, coords);
    expect(info.gridId).toContain('grid_');
    expect(info.roomName).toBe(`nearband_ch19_${info.gridId}`);
  });

  it('registers user location and finds nearby users within 5 miles', async () => {
    const center = { latitude: 40.7128, longitude: -74.006, timestamp: Date.now() };
    // 2 km away in Manhattan
    const nearby = { latitude: 40.73, longitude: -74.006, timestamp: Date.now() };
    // 30 km away in New Jersey (outside 5 miles / 8 km)
    const farAway = { latitude: 40.95, longitude: -74.006, timestamp: Date.now() };

    await spatial.updateUserLocation('user1', 19, center);
    await spatial.updateUserLocation('user2', 19, nearby);
    await spatial.updateUserLocation('user3', 19, farAway);

    const found = await spatial.findNearbyUsers(19, center);
    expect(found).toContain('user1');
    expect(found).toContain('user2');
    expect(found).not.toContain('user3');
  });

  it('removes user from channel spatial index', async () => {
    const coords = { latitude: 40.7128, longitude: -74.006, timestamp: Date.now() };
    await spatial.updateUserLocation('user1', 19, coords);

    let found = await spatial.findNearbyUsers(19, coords);
    expect(found).toContain('user1');

    await spatial.removeUserFromChannel('user1', 19);
    found = await spatial.findNearbyUsers(19, coords);
    expect(found).not.toContain('user1');
  });
});
