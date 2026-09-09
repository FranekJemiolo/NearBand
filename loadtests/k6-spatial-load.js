import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // Warm-up to 100 users
    { duration: '30s', target: 500 }, // Ramp-up to 500 concurrent users in a single grid
    { duration: '20s', target: 500 }, // Hold high-density grid load
    { duration: '10s', target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete under 300ms
    http_req_failed: ['rate<0.01'], // Error rate under 1%
  },
};

const BASE_URL = __ENV.SERVER_URL || 'http://localhost:4000';
// San Francisco dense geographic grid
const BASE_LAT = 37.7749;
const BASE_LON = -122.4194;

export default function () {
  // 1. Create ephemeral session and get phonetic handle
  const sessionRes = http.post(
    `${BASE_URL}/api/session`,
    JSON.stringify({ seed: `k6-user-${__VU}-${Date.now()}` }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(sessionRes, {
    'session created status is 200': r => r.status === 200,
    'has valid userId': r => JSON.parse(r.body).userId !== undefined,
    'has phonetic handle': r => JSON.parse(r.body).handle.split(' ').length === 2,
  });

  const session = JSON.parse(sessionRes.body);

  // 2. Simulate slight GPS jitter within 5-mile radius (~0.01 deg = ~1.1 km)
  const jitterLat = BASE_LAT + (Math.random() - 0.5) * 0.04;
  const jitterLon = BASE_LON + (Math.random() - 0.5) * 0.04;

  // 3. Proximity spatial query for Channel 19
  const nearbyRes = http.get(
    `${BASE_URL}/api/spatial/nearby?channel=19&lat=${jitterLat}&lon=${jitterLon}`,
  );

  check(nearbyRes, {
    'nearby spatial query status is 200': r => r.status === 200,
    'channel matches': r => JSON.parse(r.body).channel === 19,
  });

  // 4. Test moderation vote-to-squelch
  if (__ITER % 25 === 0) {
    const squelchRes = http.post(
      `${BASE_URL}/api/moderation/squelch`,
      JSON.stringify({
        gridId: 'grid_37d7_m122',
        targetUserId: 'target_disruptor',
        reporterUserId: session.userId,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );

    check(squelchRes, {
      'squelch vote status is 200': r => r.status === 200,
    });
  }

  sleep(1);
}
