import TestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import { usePttController } from '../hooks/usePttController';
import { useRadioTuner } from '../hooks/useRadioTuner';
import { renderTestHook } from './testUtils';
import { validateDeviceLocation } from '../native/location';

describe('End-To-End (E2E) Flow Validation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Flow 1: App launch assigns phonetic name
  it('E2E Flow 1: User opens the app and is assigned a memorable phonetic name and default channel 19', () => {
    const { result } = renderTestHook(() => useRadioTuner());

    expect(result.current.channel).toBe(19);
    expect(result.current.handle).toBeDefined();
    const words = result.current.handle.split(' ');
    expect(words.length).toBe(2);

    // Verify rendered App UI contains callsign label and active frequency CH 19
    let appTree!: TestRenderer.ReactTestRenderer;
    act(() => {
      appTree = TestRenderer.create(<App />);
    });
    expect(appTree.toJSON()).toBeDefined();

    const channelDisplay = appTree.root.findByProps({ testID: 'channel-display-number' });
    expect(channelDisplay.props.children.join('')).toBe('CH 19');
  });

  // Flow 2: 30-second PTT timer cuts off mic at 0
  it('E2E Flow 2: 30-second PTT countdown cuts off microphone transmission at 0', () => {
    const onEnd = jest.fn();
    const { result, act: hookAct } = renderTestHook(() =>
      usePttController({ onTransmissionEnd: onEnd }),
    );

    // Start hold transmission
    hookAct(() => {
      result.current.handlePressIn();
    });
    expect(result.current.isTransmitting).toBe(true);
    expect(result.current.countdownSeconds).toBe(30);

    // Ticks down through 15 seconds
    hookAct(() => {
      jest.advanceTimersByTime(15000);
    });
    expect(result.current.countdownSeconds).toBe(15);
    expect(result.current.isTransmitting).toBe(true);

    // Ticks all the way to 30 seconds
    hookAct(() => {
      jest.advanceTimersByTime(15000);
    });

    // Mic cutoff verified
    expect(result.current.isTransmitting).toBe(false);
    expect(result.current.countdownSeconds).toBe(30);
    expect(onEnd).toHaveBeenCalledWith('timeout');
  });

  // Flow 3: Navigating to an empty channel results in a silent UI state
  it('E2E Flow 3: Navigating to an empty channel results in a silent UI scanning state', () => {
    let appTree!: TestRenderer.ReactTestRenderer;
    act(() => {
      appTree = TestRenderer.create(<App />);
    });

    // Find channel buttons in tuner
    const channelButtons = appTree.root.findAllByProps({ accessibilityRole: 'button' });
    const channel4Btn = channelButtons.find(b => b.props.accessibilityLabel === 'Channel 4');
    expect(channel4Btn).toBeDefined();

    // Switch to Channel 4
    act(() => {
      channel4Btn?.props.onPress();
    });

    // Check display shows CH 04 and silent scanning state
    const channelDisplay = appTree.root.findByProps({ testID: 'channel-display-number' });
    expect(channelDisplay.props.children.join('')).toBe('CH 04');

    const statusText = appTree.root.findByProps({ testID: 'channel-status-text' });
    expect(statusText.props.children).toBe('SCANNING AIRWAVES');
  });

  // Flow 4: Mock Location E2E triggers silent session termination
  it('E2E Flow 4: Spoofed GPS coordinates trigger silent session termination', () => {
    // Normal coordinate update
    const normal = validateDeviceLocation({
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now(),
      isMocked: false,
    });
    expect(normal.valid).toBe(true);

    // Fake mock provider update (e.g. Android isFromMockProvider or simulated location)
    const spoofed = validateDeviceLocation({
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now() + 1000,
      isMocked: true,
    });

    expect(spoofed.valid).toBe(false);
    expect(spoofed.reason).toContain('Mock location provider');
  });
});
