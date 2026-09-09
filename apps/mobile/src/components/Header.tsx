import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PttMode } from '../types';

interface HeaderProps {
  handle: string;
  pttMode: PttMode;
  onTogglePttMode: () => void;
  onOpenSquelchModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  handle,
  pttMode,
  onTogglePttMode,
  onOpenSquelchModal,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>NEARBAND</Text>
          <View style={styles.geofencePill}>
            <View style={styles.activeDot} />
            <Text style={styles.geofenceText}>5 MILES</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={onTogglePttMode}
            style={styles.modeButton}
            accessibilityRole="button"
            accessibilityLabel={`Toggle PTT mode. Current mode is ${pttMode}`}
          >
            <Text style={styles.modeButtonText}>{pttMode.toUpperCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenSquelchModal}
            style={styles.squelchButton}
            accessibilityRole="button"
            accessibilityLabel="Open squelch moderation"
          >
            <Text style={styles.squelchButtonText}>MUTE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.handleContainer}>
        <Text style={styles.handleLabel}>CALLSIGN:</Text>
        <Text style={styles.handleValue}>{handle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0a0a0c',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1c24',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginRight: 10,
  },
  geofencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#072412',
    borderWidth: 1,
    borderColor: '#00ff6640',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff66',
    marginRight: 5,
  },
  geofenceText: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: '700',
    color: '#00ff66',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeButton: {
    backgroundColor: '#1b1e2a',
    borderWidth: 1,
    borderColor: '#2e3346',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  modeButtonText: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '700',
    color: '#ffb000',
  },
  squelchButton: {
    backgroundColor: '#261114',
    borderWidth: 1,
    borderColor: '#ff334450',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  squelchButtonText: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '700',
    color: '#ff4d5a',
  },
  handleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handleLabel: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#656a7d',
    marginRight: 6,
  },
  handleValue: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: '800',
    color: '#ffb000',
    letterSpacing: 1,
  },
});
