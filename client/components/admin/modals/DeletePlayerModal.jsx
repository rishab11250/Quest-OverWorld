import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import styles from './adminModalStyles';

export default function DeletePlayerModal({
  visible,
  onClose,
  onConfirm,
  player,
  loading = false,
}) {
  if (!player) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={[styles.modalTitle, { color: colors.accent.coral }]}>
            Permanently Delete Player
          </Text>

          <View style={styles.playerPreviewCard}>
            <View style={styles.deleteAvatarBox}>
              <Text style={styles.deleteAvatarText}>
                {player.name ? player.name[0].toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.deletePlayerName}>{player.name}</Text>
              <Text style={styles.deletePlayerEmail}>{player.email}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                {player.team ? (
                  <View style={styles.deletePill}>
                    <Text style={styles.deletePillText}>Party: {player.team.name || 'Guild'}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.deleteWarningBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color={colors.accent.coral}
            />
            <Text style={styles.deleteWarningText}>
              This will permanently delete their account, game progress, and remove them from all
              guilds. This cannot be undone.
            </Text>
          </View>

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSave, { backgroundColor: colors.accent.coral }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FFF" />
                  <Text style={[styles.modalSaveText, { color: '#FFF' }]}>Delete Player</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
