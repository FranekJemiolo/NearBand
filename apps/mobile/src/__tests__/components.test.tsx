import TestRenderer, { act } from 'react-test-renderer';
import { ChannelTuner } from '../components/ChannelTuner';
import { PttButton } from '../components/PttButton';
import { Header } from '../components/Header';
import { SquelchModal } from '../components/SquelchModal';
import App from '../App';

describe('Mobile UI Components', () => {
  it('renders App root component cleanly and controls modal', () => {
    const tree = TestRenderer.create(<App />);
    expect(tree.toJSON()).toBeDefined();

    const squelchBtn = tree.root.findByProps({ accessibilityLabel: 'Open squelch moderation' });
    act(() => {
      squelchBtn.props.onPress();
    });

    const closeBtn = tree.root.findByProps({ accessibilityLabel: 'Close squelch modal' });
    act(() => {
      closeBtn.props.onPress();
    });
  });

  it('renders ChannelTuner and triggers onSelectChannel', () => {
    const onSelect = jest.fn();
    const tree = TestRenderer.create(
      <ChannelTuner selectedChannel={19} onSelectChannel={onSelect} />,
    );
    expect(tree.toJSON()).toBeDefined();

    const buttons = tree.root.findAllByProps({ accessibilityRole: 'button' });
    expect(buttons.length).toBeGreaterThan(0);
    act(() => {
      buttons[0]?.props.onPress();
    });
    expect(onSelect).toHaveBeenCalled();
  });

  it('renders PttButton in idle and transmitting states', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const onTap = jest.fn();

    // Hold mode
    const idleTree = TestRenderer.create(
      <PttButton
        isTransmitting={false}
        countdownSeconds={30}
        pttMode="hold"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onTap={onTap}
      />,
    );
    expect(idleTree.toJSON()).toBeDefined();
    const button = idleTree.root.findByProps({ accessibilityRole: 'button' });
    act(() => {
      button.props.onPressIn();
      button.props.onPressOut();
    });
    expect(onPressIn).toHaveBeenCalled();
    expect(onPressOut).toHaveBeenCalled();

    // Tap mode
    const tapTree = TestRenderer.create(
      <PttButton
        isTransmitting={true}
        countdownSeconds={18}
        pttMode="tap"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onTap={onTap}
      />,
    );
    const tapButton = tapTree.root.findByProps({ accessibilityRole: 'button' });
    act(() => {
      tapButton.props.onPress();
    });
    expect(onTap).toHaveBeenCalled();
  });

  it('renders Header with callsign and mode toggle', () => {
    const onToggle = jest.fn();
    const onSquelch = jest.fn();
    const tree = TestRenderer.create(
      <Header
        handle="Rusty Falcon"
        pttMode="hold"
        onTogglePttMode={onToggle}
        onOpenSquelchModal={onSquelch}
      />,
    );
    expect(tree.toJSON()).toBeDefined();

    const modeBtn = tree.root.findByProps({
      accessibilityLabel: 'Toggle PTT mode. Current mode is hold',
    });
    const squelchBtn = tree.root.findByProps({ accessibilityLabel: 'Open squelch moderation' });

    act(() => {
      modeBtn.props.onPress();
      squelchBtn.props.onPress();
    });
    expect(onToggle).toHaveBeenCalled();
    expect(onSquelch).toHaveBeenCalled();
  });

  it('renders SquelchModal and allows voting and unsquelching', () => {
    const onClose = jest.fn();
    const onVote = jest.fn();
    const onUnsquelch = jest.fn();

    const tree = TestRenderer.create(
      <SquelchModal
        visible={true}
        squelchedUsers={new Set(['disruptive_usr'])}
        onClose={onClose}
        onVoteSquelch={onVote}
        onUnsquelch={onUnsquelch}
      />,
    );
    expect(tree.toJSON()).toBeDefined();

    const input = tree.root.findByProps({ placeholder: 'Enter handle or User ID...' });
    act(() => {
      input.props.onChangeText('spammer_123');
    });

    const voteButton = tree.root.findByProps({ accessibilityLabel: 'Vote squelch button' });
    act(() => {
      voteButton.props.onPress();
    });
    expect(onVote).toHaveBeenCalledWith('spammer_123');

    const unsquelchButton = tree.root.findByProps({
      accessibilityLabel: 'Unsquelch disruptive_usr',
    });
    act(() => {
      unsquelchButton.props.onPress();
    });
    expect(onUnsquelch).toHaveBeenCalledWith('disruptive_usr');
  });
});
