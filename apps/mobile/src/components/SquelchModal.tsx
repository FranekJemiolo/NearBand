import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

interface SquelchModalProps {
  visible: boolean;
  squelchedUsers: Set<string>;
  onClose: () => void;
  onVoteSquelch: (targetUserId: string) => void;
  onUnsquelch: (userId: string) => void;
}

export const SquelchModal: React.FC<SquelchModalProps> = ({
  visible,
  squelchedUsers,
  onClose,
  onVoteSquelch,
  onUnsquelch,
}) => {
  const [targetId, setTargetId] = useState('');

  const handleVote = () => {
    if (targetId.trim()) {
      onVoteSquelch(targetId.trim());
      setTargetId('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>VOTE-TO-SQUELCH</Text>
          <Text style={styles.description}>
            Flag a disruptive handle to vote for local spatial squelch. 3 votes locally mutes the
            handle across this grid.
          </Text>

          <TextInput
            value={targetId}
            onChangeText={setTargetId}
            placeholder="Enter handle or User ID..."
            placeholderTextColor="#555a6d"
            style={styles.input}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.voteButton}
            onPress={handleVote}
            accessibilityRole="button"
            accessibilityLabel="Vote squelch button"
          >
            <Text style={styles.voteButtonText}>FLAG FOR SQUELCH</Text>
          </TouchableOpacity>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>LOCALLY SQUELCHED ({squelchedUsers.size})</Text>
            {Array.from(squelchedUsers).map(id => (
              <View key={id} style={styles.squelchItem}>
                <Text style={styles.squelchIdText}>{id}</Text>
                <TouchableOpacity
                  onPress={() => onUnsquelch(id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Unsquelch ${id}`}
                >
                  <Text style={styles.unsquelchText}>UNMUTE</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close squelch modal"
          >
            <Text style={styles.closeButtonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000bb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#11131a',
    borderWidth: 1,
    borderColor: '#25293a',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: '900',
    color: '#ff4d5a',
    marginBottom: 8,
    letterSpacing: 1,
  },
  description: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#8b90a0',
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#090a0f',
    borderWidth: 1,
    borderColor: '#2e3348',
    borderRadius: 6,
    color: '#ffffff',
    fontFamily: 'Courier',
    fontSize: 14,
    padding: 12,
    marginBottom: 12,
  },
  voteButton: {
    backgroundColor: '#3b0d14',
    borderWidth: 1,
    borderColor: '#ff334460',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  voteButtonText: {
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '800',
    color: '#ff4d5a',
    letterSpacing: 1,
  },
  listContainer: {
    borderTopWidth: 1,
    borderTopColor: '#202433',
    paddingTop: 12,
    marginBottom: 16,
  },
  listTitle: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#656a7d',
    marginBottom: 8,
    fontWeight: '700',
  },
  squelchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  squelchIdText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#ffffff',
  },
  unsquelchText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#ffb000',
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#1b1d28',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#9ba0b4',
    fontWeight: '700',
  },
});
