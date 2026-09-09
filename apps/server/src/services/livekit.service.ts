import { AccessToken } from 'livekit-server-sdk';

export interface LiveKitConfig {
  apiKey: string;
  apiSecret: string;
  serverUrl: string;
}

export class LiveKitService {
  private apiKey: string;
  private apiSecret: string;
  public serverUrl: string;

  constructor(config?: Partial<LiveKitConfig>) {
    this.apiKey = config?.apiKey || process.env.LIVEKIT_API_KEY || 'devkey';
    this.apiSecret =
      config?.apiSecret ||
      process.env.LIVEKIT_API_SECRET ||
      'secretsecretsecretsecretsecretsecret32';
    this.serverUrl = config?.serverUrl || process.env.LIVEKIT_URL || 'http://localhost:7880';
  }

  /**
   * Generates a token for an unmanaged room allowing simultaneous audio overlap.
   */
  public async generateRoomToken(
    roomName: string,
    participantId: string,
    participantHandle: string,
    ttlSeconds: number = 3600,
  ): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantId,
      name: participantHandle,
      ttl: `${ttlSeconds}s`,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await token.toJwt();
  }
}
