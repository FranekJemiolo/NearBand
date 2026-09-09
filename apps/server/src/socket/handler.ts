import { Server as SocketIOServer, Socket } from 'socket.io';
import { Coordinates } from '@nearband/shared';
import { SpatialEngineService } from '../services/spatial.service';
import { LiveKitService } from '../services/livekit.service';
import { VelocityTrackingService } from '../services/velocity.service';
import { SquelchModerationService } from '../services/moderation.service';
import { SessionService } from '../services/session.service';

export interface HandlerServices {
  spatial: SpatialEngineService;
  livekit: LiveKitService;
  velocity: VelocityTrackingService;
  moderation: SquelchModerationService;
  session: SessionService;
}

export function registerSocketHandlers(io: SocketIOServer, services: HandlerServices) {
  io.on('connection', (socket: Socket) => {
    let currentUserId: string | null = null;
    let currentChannel: number | null = null;
    let currentGridId: string | null = null;

    socket.on(
      'join_channel',
      async (
        data: { userId: string; channel: number; coordinates: Coordinates },
        callback?: (res: { success?: boolean; error?: string; roomInfo?: unknown }) => void,
      ) => {
        const { userId, channel, coordinates } = data;
        currentUserId = userId;
        currentChannel = channel;

        // 1. Verify movement & mock status
        const velCheck = services.velocity.verifyMovement(userId, coordinates);
        if (!velCheck.valid) {
          socket.emit('session_terminated', { reason: velCheck.reason });
          socket.disconnect(true);
          if (callback) callback({ error: velCheck.reason });
          return;
        }

        // 2. Resolve room & grid
        const { gridId, roomName } = services.spatial.getRoomInfoForCoordinates(
          channel,
          coordinates,
        );
        currentGridId = gridId;

        // 3. Check moderation
        const isSquelched = await services.moderation.isUserSquelched(gridId, userId);

        // 4. Update spatial index & session
        await services.spatial.updateUserLocation(userId, channel, coordinates);
        await services.session.updateChannel(userId, channel);

        const user = await services.session.getSession(userId);
        const handle = user?.handle || 'Unknown Radio';

        // 5. Generate LiveKit token
        const token = await services.livekit.generateRoomToken(roomName, userId, handle);

        // 6. Find nearby users count
        const nearby = await services.spatial.findNearbyUsers(channel, coordinates);

        socket.join(roomName);

        const roomInfo = {
          roomName,
          token,
          serverUrl: services.livekit.serverUrl,
          channel,
          gridId,
          isSquelched,
          nearbyCount: nearby.length,
        };

        socket.to(roomName).emit('user_joined', {
          userId,
          handle,
          channel,
          nearbyCount: nearby.length,
        });

        if (callback) callback({ success: true, roomInfo });
      },
    );

    socket.on('update_location', async (data: { coordinates: Coordinates }) => {
      if (!currentUserId || !currentChannel) return;

      const velCheck = services.velocity.verifyMovement(currentUserId, data.coordinates);
      if (!velCheck.valid) {
        socket.emit('session_terminated', { reason: velCheck.reason });
        socket.disconnect(true);
        return;
      }

      const { gridId, roomName } = services.spatial.getRoomInfoForCoordinates(
        currentChannel,
        data.coordinates,
      );

      // Detect spatial grid cell boundary crossing
      if (currentGridId && currentGridId !== gridId) {
        currentGridId = gridId;
        const user = await services.session.getSession(currentUserId);
        const handle = user?.handle || 'Unknown Radio';
        const newToken = await services.livekit.generateRoomToken(roomName, currentUserId, handle);

        socket.emit('room_migrated', {
          roomName,
          token: newToken,
          gridId,
          channel: currentChannel,
        });
      }

      await services.spatial.updateUserLocation(currentUserId, currentChannel, data.coordinates);
    });

    socket.on(
      'vote_squelch',
      async (
        data: { targetUserId: string },
        callback?: (res: { success?: boolean; error?: string; result?: unknown }) => void,
      ) => {
        if (!currentUserId || !currentGridId) {
          if (callback) callback({ error: 'Not in an active grid' });
          return;
        }

        const result = await services.moderation.voteSquelch(
          currentGridId,
          data.targetUserId,
          currentUserId,
        );

        if (result.isSquelched) {
          io.to(`nearband_ch${currentChannel}_${currentGridId}`).emit('user_squelched', {
            targetUserId: data.targetUserId,
            gridId: currentGridId,
          });
        }

        if (callback) callback({ success: true, result });
      },
    );

    socket.on('disconnect', async () => {
      if (currentUserId && currentChannel) {
        await services.spatial.removeUserFromChannel(currentUserId, currentChannel);
        services.velocity.clearUser(currentUserId);
      }
    });
  });
}
