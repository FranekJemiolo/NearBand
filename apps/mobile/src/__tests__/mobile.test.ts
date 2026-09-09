import { createInitialState, switchChannel } from '../index';
import { CB_MIN_CHANNEL, CB_MAX_CHANNEL, DEFAULT_CHANNEL } from '@nearband/shared';

describe('Mobile App State Core', () => {
  it('creates initial state with default channel 19 and hold mode', () => {
    const state = createInitialState('Neon Coyote');
    expect(state.currentChannel).toBe(DEFAULT_CHANNEL);
    expect(state.handle).toBe('Neon Coyote');
    expect(state.pttMode).toBe('hold');
    expect(state.isTransmitting).toBe(false);

    const defaultState = createInitialState();
    expect(defaultState.handle).toBe('Scanning...');
  });

  it('bounds channel switching between 1 and 40', () => {
    expect(switchChannel(19, 20)).toBe(20);
    expect(switchChannel(19, -5)).toBe(CB_MIN_CHANNEL);
    expect(switchChannel(19, 100)).toBe(CB_MAX_CHANNEL);
  });
});
