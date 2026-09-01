import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import colors from '../../../theme/colors';
import styles from './adminModalStyles';

export default function BanGuildModal({
  visible,
  onClose,
  onConfirm,
  team,
  reason,
  setReason,
  isUnban = false,
}) {
  if (!team) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text
            style={[
              styles.modalTitle,
              { color: isUnban ? colors.accent.green : colors.accent.coral },
            ]}
          >
            {isUnban ? 'Unban Guild / Party' : 'Disqualify Guild'}
          </Text>

          <View style={styles.playerPreviewCard}>
            <View
              style={[
                styles.banAvatarBox,
                isUnban && {
                  backgroundColor: 'rgba(62, 207, 142, 0.15)',
                  borderColor: colors.accent.green,
                },
              ]}
            >
              <Text style={[styles.banAvatarText, isUnban && { color: colors.accent.green }]}>
                {team.name ? team.name[0].toUpperCase() : 'G'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.banPlayerName}>{team.name}</Text>
              <Text style={styles.banPlayerEmail}>
                Score: {team.score || 0} PTS · Code: {team.code}
              </Text>
            </View>
          </View>

          {!isUnban ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>REASON FOR DISQUALIFICATION</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                placeholder="e.g. Tournament rule violation"
                placeholderTextColor="#7E75A0"
                multiline
                value={reason}
                onChangeText={setReason}
              />
            </View>
          ) : (
            <Text style={styles.modalSub}>
              This will restore leaderboard and quest access for {team.name}.
            </Text>
          )}

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSave,
                { backgroundColor: isUnban ? colors.accent.green : colors.accent.coral },
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalSaveText, { color: '#FFF' }]}>
                {isUnban ? 'Restore Guild' : 'Confirm Ban'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
