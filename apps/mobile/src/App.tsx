import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Header } from './components/Header';
import { ChannelTuner } from './components/ChannelTuner';
import { PttButton } from './components/PttButton';
import { SquelchModal } from './components/SquelchModal';
import { usePttController } from './hooks/usePttController';
import { useRadioTuner } from './hooks/useRadioTuner';

export default function App() {
  const [squelchModalVisible, setSquelchModalVisible] = useState(false);
  const { channel, handle, squelchedUsers, selectChannel, squelchUser, unsquelchUser } =
    useRadioTuner();

  const {
    pttMode,
    isTransmitting,
    countdownSeconds,
    handlePressIn,
    handlePressOut,
    handleTap,
    togglePttMode,
  } = usePttController();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0c" />
      <View style={styles.container}>
        <Header
          handle={handle}
          pttMode={pttMode}
          onTogglePttMode={togglePttMode}
          onOpenSquelchModal={() => setSquelchModalVisible(true)}
        />

        <ChannelTuner selectedChannel={channel} onSelectChannel={selectChannel} />

        {/* Central Display */}
        <View style={styles.centerStage}>
          <View style={styles.tunerDisplayCard}>
            <Text style={styles.channelLabel}>ACTIVE FREQUENCY</Text>
            <Text testID="channel-display-number" style={styles.channelDisplayNumber}>
              CH {channel.toString().padStart(2, '0')}
            </Text>
            <Text testID="channel-status-text" style={styles.channelStatusText}>
              {isTransmitting ? 'TRANSMITTING VOICE' : 'SCANNING AIRWAVES'}
            </Text>
          </View>
        </View>

        {/* Bottom PTT Control Area */}
        <PttButton
          isTransmitting={isTransmitting}
          countdownSeconds={countdownSeconds}
          pttMode={pttMode}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onTap={handleTap}
        />

        <SquelchModal
          visible={squelchModalVisible}
          squelchedUsers={squelchedUsers}
          onClose={() => setSquelchModalVisible(false)}
          onVoteSquelch={squelchUser}
          onUnsquelch={unsquelchUser}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
    justifyContent: 'space-between',
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tunerDisplayCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f1118',
    borderWidth: 1,
    borderColor: '#1e2230',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  channelLabel: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#6c7287',
    letterSpacing: 2,
    marginBottom: 4,
  },
  channelDisplayNumber: {
    fontFamily: 'Courier',
    fontSize: 54,
    fontWeight: '900',
    color: '#ffb000',
    letterSpacing: 2,
  },
  channelStatusText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#00ff66',
    letterSpacing: 1,
    marginTop: 6,
  },
});
