import { VoiceActivityDetector } from '../audio/vad';

describe('VoiceActivityDetector (VAD)', () => {
  it('initializes with default threshold and un-gated status', () => {
    const vad = new VoiceActivityDetector({ noiseFloorThresholdDb: -45, silenceTimeoutMs: 2000 });
    const status = vad.getStatus();
    expect(status.isGated).toBe(false);
    expect(status.noiseFloorDb).toBe(-45);
    expect(status.silenceTimeoutMs).toBe(2000);
  });

  it('keeps gate open during active speech', () => {
    const onGate = jest.fn();
    const vad = new VoiceActivityDetector({ onGateChange: onGate });

    // Voice speaking at -20 dBFS
    const changed = vad.processAudioLevel(-20, 1000);
    expect(changed).toBe(false);
    expect(vad.getStatus().isGated).toBe(false);
    expect(onGate).not.toHaveBeenCalled();
  });

  it('automatically gates transmission after prolonged silence (> 2000 ms)', () => {
    const onGate = jest.fn();
    const vad = new VoiceActivityDetector({ silenceTimeoutMs: 2000, onGateChange: onGate });

    // Initial voice at t = 1000
    vad.processAudioLevel(-25, 1000);

    // Silence for 1000 ms (t = 2000) -> not yet gated
    expect(vad.processAudioLevel(-60, 2000)).toBe(false);
    expect(vad.getStatus().isGated).toBe(false);

    // Silence for 2100 ms (t = 3100) -> gates
    const changed = vad.processAudioLevel(-60, 3100);
    expect(changed).toBe(true);
    expect(vad.getStatus().isGated).toBe(true);
    expect(onGate).toHaveBeenCalledWith(true);
  });

  it('immediately re-opens gate when speech resumes', () => {
    const onGate = jest.fn();
    const vad = new VoiceActivityDetector({ silenceTimeoutMs: 2000, onGateChange: onGate });

    // Trigger gate via silence
    vad.processAudioLevel(-25, 1000);
    vad.processAudioLevel(-70, 4000);
    expect(vad.getStatus().isGated).toBe(true);

    // Voice resumes at -15 dBFS
    const changed = vad.processAudioLevel(-15, 4500);
    expect(changed).toBe(true);
    expect(vad.getStatus().isGated).toBe(false);
    expect(onGate).toHaveBeenCalledWith(false);
  });

  it('resets state correctly', () => {
    const vad = new VoiceActivityDetector();
    vad.processAudioLevel(-10, 1000);
    vad.reset();
    expect(vad.getStatus().isGated).toBe(false);
  });
});
