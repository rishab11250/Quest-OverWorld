import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import colors from '../../../theme/colors';
import styles from './adminModalStyles';

export default function RejectFeedbackModal({
  visible,
  onClose,
  onConfirm,
  feedback,
  setFeedback,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={[styles.modalTitle, { color: colors.accent.coral }]}>Reject Submission</Text>
          <Text style={styles.modalSub}>
            Provide feedback so the party can resubmit with valid proof:
          </Text>
          <TextInput
            style={[styles.input, { height: 90 }]}
            placeholder="e.g. Photo was blurry or landmark was out of frame"
            placeholderTextColor="#7E75A0"
            multiline
            value={feedback}
            onChangeText={setFeedback}
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSave, { backgroundColor: colors.accent.coral }]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalSaveText, { color: '#FFF' }]}>Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
