import { renderTestHook } from './testUtils';
import { useRadioTuner } from '../hooks/useRadioTuner';
import { CB_MIN_CHANNEL, CB_MAX_CHANNEL, DEFAULT_CHANNEL } from '@nearband/shared';

describe('useRadioTuner', () => {
  it('initializes on default channel 19 with initial handle', () => {
    const { result } = renderTestHook(() => useRadioTuner('Neon Coyote'));
    expect(result.current.channel).toBe(DEFAULT_CHANNEL);
    expect(result.current.handle).toBe('Neon Coyote');
    expect(result.current.squelchedUsers.size).toBe(0);
  });

  it('bounds channel selection accurately', () => {
    const { result, act } = renderTestHook(() => useRadioTuner());

    act(() => {
      result.current.selectChannel(5);
    });
    expect(result.current.channel).toBe(5);

    // Below min channel
    act(() => {
      result.current.selectChannel(-10);
    });
    expect(result.current.channel).toBe(CB_MIN_CHANNEL);

    // Above max channel
    act(() => {
      result.current.selectChannel(999);
    });
    expect(result.current.channel).toBe(CB_MAX_CHANNEL);
  });

  it('steps through channels with nextChannel and prevChannel wrapping', () => {
    const { result, act } = renderTestHook(() => useRadioTuner());

    act(() => {
      result.current.selectChannel(40);
      result.current.nextChannel();
    });
    expect(result.current.channel).toBe(1);

    act(() => {
      result.current.prevChannel();
    });
    expect(result.current.channel).toBe(40);
  });

  it('manages squelched users set', () => {
    const { result, act } = renderTestHook(() => useRadioTuner());

    act(() => {
      result.current.squelchUser('bad_actor_1');
    });
    expect(result.current.squelchedUsers.has('bad_actor_1')).toBe(true);

    act(() => {
      result.current.unsquelchUser('bad_actor_1');
    });
    expect(result.current.squelchedUsers.has('bad_actor_1')).toBe(false);
  });

  it('resets handle on command', () => {
    const { result, act } = renderTestHook(() => useRadioTuner('Original Handle'));
    expect(result.current.handle).toBe('Original Handle');

    act(() => {
      result.current.resetHandle();
    });
    expect(result.current.handle.split(' ').length).toBe(2);
  });
});
