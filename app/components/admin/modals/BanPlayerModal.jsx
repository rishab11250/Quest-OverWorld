import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import styles from './adminModalStyles';

export default function BanPlayerModal({
  visible,
  onClose,
  onConfirm,
  player,
  reason,
  setReason,
  isUnban = false,
}) {
  if (!player) return null;

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
            {isUnban ? 'Unban Adventurer' : 'Ban Player Account'}
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
                {player.name ? player.name[0].toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.banPlayerName}>{player.name}</Text>
              <Text style={styles.banPlayerEmail}>{player.email}</Text>
            </View>
          </View>

          {!isUnban ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>REASON FOR BAN</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                placeholder="e.g. GPS spoofing / fraudulent QR scanning"
                placeholderTextColor="#7E75A0"
                multiline
                value={reason}
                onChangeText={setReason}
              />
            </View>
          ) : (
            <Text style={styles.modalSub}>
              This will restore full tournament access for {player.name}.
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
                {isUnban ? 'Restore Player' : 'Confirm Ban'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
