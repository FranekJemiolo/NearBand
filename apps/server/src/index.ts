import express, { Express } from 'express';
import cors from 'cors';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { generatePhoneticHandle, DEFAULT_CHANNEL } from '@nearband/shared';

export interface NearBandServerInstance {
  app: Express;
  httpServer: HttpServer;
  io: SocketIOServer;
  start: (port: number) => Promise<HttpServer>;
  stop: () => Promise<void>;
}

export function createNearBandServer(): NearBandServerInstance {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nearband-signaling', version: '1.0.0' });
  });

  app.post('/api/session', (req, res) => {
    const seed = req.body && typeof req.body.seed === 'string' ? req.body.seed : undefined;
    const handle = generatePhoneticHandle(seed);
    res.json({
      userId: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      handle,
      currentChannel: DEFAULT_CHANNEL,
      createdAt: Date.now(),
    });
  });

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  const start = (port: number): Promise<HttpServer> => {
    return new Promise(resolve => {
      httpServer.listen(port, () => {
        resolve(httpServer);
      });
    });
  };

  const stop = (): Promise<void> => {
    return new Promise((resolve, reject) => {
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

  return { app, httpServer, io, start, stop };
}

export const defaultInstance = createNearBandServer();
export const { app, httpServer, io } = defaultInstance;
