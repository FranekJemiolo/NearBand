import { RadioAudioEngine } from '../audio/livekitClient';

describe('RadioAudioEngine (WebRTC LiveKit Transport & Mixing)', () => {
  it('connects to room and manages transmission state', async () => {
    const engine = new RadioAudioEngine();
    expect(engine.getStatus().isConnected).toBe(false);

    await engine.connectRoom('http://localhost:7880', 'token_123', 'nearband_ch19_grid1');
    expect(engine.getStatus().isConnected).toBe(true);
    expect(engine.getStatus().currentRoom).toBe('nearband_ch19_grid1');

    await engine.startTransmitting();
    expect(engine.getStatus().isTransmitting).toBe(true);

    await engine.stopTransmitting();
    expect(engine.getStatus().isTransmitting).toBe(false);

    await engine.disconnectRoom();
    expect(engine.getStatus().isConnected).toBe(false);
  });

  it('notifies on incoming audio tracks and speaker changes', () => {
    const onSpeakers = jest.fn();
    const engine = new RadioAudioEngine({ onSpeakersChanged: onSpeakers });

    const accepted1 = engine.handleIncomingTrack('user_1', 'Rusty Falcon');
    expect(accepted1).toBe(true);
    expect(onSpeakers).toHaveBeenCalledWith(['Rusty Falcon']);

    // Overlapping collision: another speaker joins concurrently
    const accepted2 = engine.handleIncomingTrack('user_2', 'Neon Coyote');
    expect(accepted2).toBe(true);
    expect(onSpeakers).toHaveBeenCalledWith(['Rusty Falcon', 'Neon Coyote']);

    engine.handleTrackStopped('user_1');
    expect(onSpeakers).toHaveBeenCalledWith(['Neon Coyote']);
  });

  it('filters and silences squelched users', () => {
    const onSpeakers = jest.fn();
    const engine = new RadioAudioEngine({ onSpeakersChanged: onSpeakers });

    engine.setSquelchedUsers(new Set(['spammer_99']));

    // Squelched user attempt is rejected
    const accepted = engine.handleIncomingTrack('spammer_99', 'Bad Actor');
    expect(accepted).toBe(false);

    // If active speaker is squelched retroactively, they are dropped immediately
    engine.handleIncomingTrack('user_ok', 'Good Actor');
    expect(engine.getStatus().activeSpeakerCount).toBe(1);

    engine.setSquelchedUsers(new Set(['spammer_99', 'user_ok']));
    expect(engine.getStatus().activeSpeakerCount).toBe(0);
  });

  it('integrates microphone level with VAD', () => {
    const engine = new RadioAudioEngine();
    const changed = engine.processMicLevel(-10);
    expect(typeof changed).toBe('boolean');
  });
});
