import { SessionService } from '../services/session.service';

describe('SessionService', () => {
  let sessions: SessionService;

  beforeEach(() => {
    sessions = new SessionService();
  });

  it('creates ephemeral session with user ID and handle', async () => {
    const session = await sessions.createSession('client-alpha');
    expect(session.userId).toContain('usr_');
    expect(session.handle).toBeDefined();
    expect(session.currentChannel).toBe(19);

    const fetched = await sessions.getSession(session.userId);
    expect(fetched).toEqual(session);
  });

  it('updates channel on active session', async () => {
    const session = await sessions.createSession();
    await sessions.updateChannel(session.userId, 9);

    const updated = await sessions.getSession(session.userId);
    expect(updated?.currentChannel).toBe(9);
  });

  it('removes session cleanly', async () => {
    const session = await sessions.createSession();
    await sessions.removeSession(session.userId);

    const fetched = await sessions.getSession(session.userId);
    expect(fetched).toBeNull();
  });
});
