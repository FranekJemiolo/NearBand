import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PttMode } from '../types';

interface PttButtonProps {
  isTransmitting: boolean;
  countdownSeconds: number;
  pttMode: PttMode;
  onPressIn: () => void;
  onPressOut: () => void;
  onTap: () => void;
  disabled?: boolean;
}

export const PttButton: React.FC<PttButtonProps> = ({
  isTransmitting,
  countdownSeconds,
  pttMode,
  onPressIn,
  onPressOut,
  onTap,
  disabled = false,
}) => {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={pttMode === 'hold' ? onPressIn : undefined}
        onPressOut={pttMode === 'hold' ? onPressOut : undefined}
        onPress={pttMode === 'tap' ? onTap : undefined}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={isTransmitting ? 'Transmitting audio' : 'Push to talk'}
        style={[
          styles.button,
          isTransmitting ? styles.buttonTransmitting : styles.buttonIdle,
          disabled && styles.buttonDisabled,
        ]}
      >
        <View style={styles.innerContent}>
          <Text style={[styles.statusText, isTransmitting && styles.statusTextTransmitting]}>
            {isTransmitting ? 'TRANSMITTING' : 'PUSH TO TALK'}
          </Text>

          {isTransmitting ? (
            <Text style={styles.timerText}>{countdownSeconds}s</Text>
          ) : (
            <Text style={styles.modeSubtext}>
              {pttMode === 'hold' ? 'HOLD TO TALK' : 'TAP TO TALK'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIdle: {
    backgroundColor: '#13151f',
    borderColor: '#ffb000',
    shadowColor: '#ffb000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonTransmitting: {
    backgroundColor: '#3d0a0f',
    borderColor: '#ff3344',
    shadowColor: '#ff3344',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
    borderColor: '#4a4e60',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: '800',
    color: '#ffb000',
    letterSpacing: 2,
    marginBottom: 6,
  },
  statusTextTransmitting: {
    color: '#ff4d5a',
  },
  timerText: {
    fontFamily: 'Courier',
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  modeSubtext: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#717688',
    letterSpacing: 1,
  },
});
