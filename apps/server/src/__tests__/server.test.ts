import request from 'supertest';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { createNearBandServer, NearBandServerInstance } from '../index';

describe('Signaling Server API & Socket.io Protocol', () => {
  let serverInstance: NearBandServerInstance;
  let serverPort: number;

  beforeEach(async () => {
    serverInstance = createNearBandServer();
    const http = await serverInstance.start(0);
    const addr = http.address();
    if (typeof addr === 'object' && addr !== null) {
      serverPort = addr.port;
    }
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

  it('generates an ephemeral session on POST /api/session', async () => {
    const res = await request(serverInstance.app)
      .post('/api/session')
      .send({ seed: 'test-client-123' });
    expect(res.status).toBe(200);
    expect(res.body.userId).toBeDefined();
    expect(res.body.handle).toBeDefined();
    expect(res.body.currentChannel).toBe(19);

    const getRes = await request(serverInstance.app).get(`/api/session/${res.body.userId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.userId).toBe(res.body.userId);
  });

  it('returns 404 for nonexistent session', async () => {
    const res = await request(serverInstance.app).get('/api/session/nonexistent');
    expect(res.status).toBe(404);
  });

  it('handles vote to squelch via REST', async () => {
    const res = await request(serverInstance.app).post('/api/moderation/squelch').send({
      gridId: 'grid_test',
      targetUserId: 'user_target',
      reporterUserId: 'user_reporter',
    });
    expect(res.status).toBe(200);
    expect(res.body.voteCount).toBe(1);

    const badRes = await request(serverInstance.app).post('/api/moderation/squelch').send({});
    expect(badRes.status).toBe(400);
  });

  it('returns nearby users via REST', async () => {
    const res = await request(serverInstance.app)
      .get('/api/spatial/nearby')
      .query({ channel: 19, lat: 40.7128, lon: -74.006 });
    expect(res.status).toBe(200);
    expect(res.body.channel).toBe(19);
    expect(Array.isArray(res.body.users)).toBe(true);

    const badRes = await request(serverInstance.app).get('/api/spatial/nearby');
    expect(badRes.status).toBe(400);
  });

  describe('Socket.io Signaling Flow', () => {
    let clientSocket: ClientSocketType;

    afterEach(() => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
    });

    it('allows client to join channel and receive LiveKit room token', done => {
      clientSocket = ClientSocket(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit(
          'join_channel',
          {
            userId: 'test_user_1',
            channel: 19,
            coordinates: { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() },
          },
          (res: any) => {
            expect(res.success).toBe(true);
            expect(res.roomInfo.roomName).toContain('nearband_ch19_');
            expect(res.roomInfo.token).toBeDefined();
            expect(res.roomInfo.isSquelched).toBe(false);
            done();
          },
        );
      });
    });

    it('terminates session immediately on mock GPS coordinates', done => {
      clientSocket = ClientSocket(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.on('session_terminated', data => {
          expect(data.reason).toContain('mock location');
          done();
        });

        clientSocket.emit('join_channel', {
          userId: 'spoofer_1',
          channel: 19,
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: Date.now(),
            isMocked: true,
          },
        });
      });
    });

    it('migrates room when client crosses into new spatial grid', done => {
      clientSocket = ClientSocket(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit(
          'join_channel',
          {
            userId: 'mover_1',
            channel: 19,
            coordinates: { latitude: 37.7749, longitude: -122.4194, timestamp: 1700000000000 },
          },
          () => {
            clientSocket.on('room_migrated', data => {
              expect(data.gridId).toBeDefined();
              expect(data.token).toBeDefined();
              done();
            });

            // Move ~20 km north over 1000 seconds (~20 m/s, realistic car highway speed)
            clientSocket.emit('update_location', {
              coordinates: {
                latitude: 37.95,
                longitude: -122.4194,
                timestamp: 1700000000000 + 1000000,
              },
            });
          },
        );
      });
    });

    it('terminates session on spoofed coordinates in update_location', done => {
      clientSocket = ClientSocket(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit(
          'join_channel',
          {
            userId: 'user_spoof_update',
            channel: 19,
            coordinates: { latitude: 37.7749, longitude: -122.4194, timestamp: 1700000000000 },
          },
          () => {
            clientSocket.on('session_terminated', data => {
              expect(data.reason).toBeDefined();
              done();
            });

            // Instant jump to Paris
            clientSocket.emit('update_location', {
              coordinates: {
                latitude: 48.8566,
                longitude: 2.3522,
                timestamp: 1700000000000 + 1000,
              },
            });
          },
        );
      });
    });

    it('processes vote_squelch via socket and broadcasts user_squelched', done => {
      clientSocket = ClientSocket(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        // Vote before joining returns error
        clientSocket.emit('vote_squelch', { targetUserId: 'troublemaker' }, (res: any) => {
          expect(res.error).toBeDefined();

          // Now join channel
          clientSocket.emit(
            'join_channel',
            {
              userId: 'voter_1',
              channel: 19,
              coordinates: { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() },
            },
            () => {
              clientSocket.emit(
                'vote_squelch',
                { targetUserId: 'troublemaker' },
                (voteRes: any) => {
                  expect(voteRes.success).toBe(true);
                  done();
                },
              );
            },
          );
        });
      });
    });
  });
});
