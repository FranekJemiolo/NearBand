import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { CB_MIN_CHANNEL, CB_MAX_CHANNEL } from '@nearband/shared';

interface ChannelTunerProps {
  selectedChannel: number;
  onSelectChannel: (channel: number) => void;
}

const CHANNELS = Array.from(
  { length: CB_MAX_CHANNEL - CB_MIN_CHANNEL + 1 },
  (_, i) => CB_MIN_CHANNEL + i,
);

export const ChannelTuner: React.FC<ChannelTunerProps> = ({ selectedChannel, onSelectChannel }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={CHANNELS}
        keyExtractor={item => `channel_${item}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = item === selectedChannel;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onSelectChannel(item)}
              style={[styles.channelItem, isSelected && styles.channelItemSelected]}
              accessibilityLabel={`Channel ${item}`}
              accessibilityRole="button"
            >
              <Text style={[styles.channelText, isSelected && styles.channelTextSelected]}>
                {item.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#0a0a0c',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2029',
  },
  listContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  channelItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 6,
    backgroundColor: '#12141c',
    borderWidth: 1,
    borderColor: '#242736',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelItemSelected: {
    backgroundColor: '#ffb000',
    borderColor: '#ffc740',
    shadowColor: '#ffb000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  channelText: {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: '700',
    color: '#8b90a0',
  },
  channelTextSelected: {
    color: '#0a0a0c',
    fontWeight: '900',
  },
});
