import { renderTestHook } from './testUtils';
import { usePttController } from '../hooks/usePttController';

describe('usePttController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes in hold mode and idle state', () => {
    const { result } = renderTestHook(() => usePttController());
    expect(result.current.pttMode).toBe('hold');
    expect(result.current.isTransmitting).toBe(false);
    expect(result.current.countdownSeconds).toBe(30);
  });

  it('manages hold-to-talk press in and press out', () => {
    const onStart = jest.fn();
    const onEnd = jest.fn();
    const { result, act } = renderTestHook(() =>
      usePttController({ onTransmissionStart: onStart, onTransmissionEnd: onEnd }),
    );

    act(() => {
      result.current.handlePressIn();
    });

    expect(result.current.isTransmitting).toBe(true);
    expect(onStart).toHaveBeenCalledTimes(1);

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.countdownSeconds).toBe(25);

    act(() => {
      result.current.handlePressOut();
    });

    expect(result.current.isTransmitting).toBe(false);
    expect(result.current.countdownSeconds).toBe(30);
    expect(onEnd).toHaveBeenCalledWith('released');
  });

  it('automatically cuts off transmission after 30 seconds', () => {
    const onEnd = jest.fn();
    const { result, act } = renderTestHook(() => usePttController({ onTransmissionEnd: onEnd }));

    act(() => {
      result.current.handlePressIn();
    });

    expect(result.current.isTransmitting).toBe(true);

    // Advance 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(result.current.isTransmitting).toBe(false);
    expect(onEnd).toHaveBeenCalledWith('timeout');
  });

  it('supports tap-to-talk toggle mode', () => {
    const { result, act } = renderTestHook(() => usePttController({ initialMode: 'tap' }));
    expect(result.current.pttMode).toBe('tap');

    // First tap starts transmission
    act(() => {
      result.current.handleTap();
    });
    expect(result.current.isTransmitting).toBe(true);

    // Second tap stops transmission
    act(() => {
      result.current.handleTap();
    });
    expect(result.current.isTransmitting).toBe(false);
  });

  it('toggles between hold and tap modes', () => {
    const { result, act } = renderTestHook(() => usePttController());
    expect(result.current.pttMode).toBe('hold');

    act(() => {
      result.current.togglePttMode();
    });
    expect(result.current.pttMode).toBe('tap');

    act(() => {
      result.current.togglePttMode();
    });
    expect(result.current.pttMode).toBe('hold');
  });
});
