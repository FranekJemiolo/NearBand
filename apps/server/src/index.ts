import express, { Express } from 'express';
import cors from 'cors';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { SpatialEngineService } from './services/spatial.service';
import { LiveKitService } from './services/livekit.service';
import { VelocityTrackingService } from './services/velocity.service';
import { SquelchModerationService } from './services/moderation.service';
import { SessionService } from './services/session.service';
import { registerSocketHandlers } from './socket/handler';

export interface ServerOptions {
  redisClient?: Redis;
  livekitConfig?: {
    apiKey?: string;
    apiSecret?: string;
    serverUrl?: string;
  };
}

export interface NearBandServerInstance {
  app: Express;
  httpServer: HttpServer;
  io: SocketIOServer;
  services: {
    spatial: SpatialEngineService;
    livekit: LiveKitService;
    velocity: VelocityTrackingService;
    moderation: SquelchModerationService;
    session: SessionService;
  };
  start: (port: number) => Promise<HttpServer>;
  stop: () => Promise<void>;
}

export function createNearBandServer(options?: ServerOptions): NearBandServerInstance {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Initialize services
  const spatial = new SpatialEngineService({ redisClient: options?.redisClient });
  const livekit = new LiveKitService(options?.livekitConfig);
  const velocity = new VelocityTrackingService();
  const moderation = new SquelchModerationService({ redisClient: options?.redisClient });
  const session = new SessionService(options?.redisClient);

  const services = { spatial, livekit, velocity, moderation, session };

  // REST API Endpoints
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nearband-signaling', version: '1.0.0' });
  });

  app.post('/api/session', async (req, res) => {
    const seed = req.body && typeof req.body.seed === 'string' ? req.body.seed : undefined;
    const userSession = await session.createSession(seed);
    res.json(userSession);
  });

  app.get('/api/session/:userId', async (req, res) => {
    const user = await session.getSession(req.params.userId);
    if (!user) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(user);
  });

  app.post('/api/moderation/squelch', async (req, res) => {
    const { gridId, targetUserId, reporterUserId } = req.body || {};
    if (!gridId || !targetUserId || !reporterUserId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    const result = await moderation.voteSquelch(gridId, targetUserId, reporterUserId);
    res.json(result);
  });

  app.get('/api/spatial/nearby', async (req, res) => {
    const channel = parseInt(req.query.channel as string, 10) || 19;
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ error: 'Invalid latitude or longitude' });
      return;
    }

    const nearbyUsers = await spatial.findNearbyUsers(channel, {
      latitude: lat,
      longitude: lon,
      timestamp: Date.now(),
    });

    res.json({ channel, count: nearbyUsers.length, users: nearbyUsers });
  });

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  // Socket.io handlers
  registerSocketHandlers(io, services);

  const start = (port: number): Promise<HttpServer> => {
    return new Promise(resolve => {
      httpServer.listen(port, () => {
        resolve(httpServer);
      });
    });
  };

  const stop = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      io.close();
      if (!httpServer.listening) {
        resolve();
        return;
      }
      httpServer.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  return { app, httpServer, io, services, start, stop };
}

export const defaultInstance = createNearBandServer();
export const { app, httpServer, io } = defaultInstance;
