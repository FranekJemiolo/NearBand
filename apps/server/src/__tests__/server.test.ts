import request from 'supertest';
import { createNearBandServer, NearBandServerInstance } from '../index';

describe('Signaling Server API', () => {
  let serverInstance: NearBandServerInstance;

  beforeEach(() => {
    serverInstance = createNearBandServer();
  });

  afterEach(async () => {
    await serverInstance.stop();
  });

  it('responds with 200 OK on /health', async () => {
    const res = await request(serverInstance.app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('nearband-signaling');
  });

  it('generates an ephemeral session on POST /api/session with seed', async () => {
    const res = await request(serverInstance.app)
      .post('/api/session')
      .send({ seed: 'test-client-123' });
    expect(res.status).toBe(200);
    expect(res.body.userId).toBeDefined();
    expect(res.body.handle).toBeDefined();
    expect(res.body.currentChannel).toBe(19);
  });

  it('generates random handle when seed is omitted', async () => {
    const res = await request(serverInstance.app).post('/api/session').send({});
    expect(res.status).toBe(200);
    expect(res.body.handle.split(' ').length).toBe(2);
  });

  it('starts server on specified port and stops cleanly', async () => {
    const started = await serverInstance.start(0);
    expect(started.listening).toBe(true);
    await serverInstance.stop();
    expect(started.listening).toBe(false);
  });

  it('handles stopping when server is not listening', async () => {
    await expect(serverInstance.stop()).resolves.toBeUndefined();
  });
});
