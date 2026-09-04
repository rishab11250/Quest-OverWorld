import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export const AVATAR_ICONS = [
  'shield-crown',
  'sword',
  'shield-account',
  'compass',
  'crown',
  'fire',
  'account-star',
  'lightning-bolt',
];

export default function EditHeroModal({
  visible,
  onClose,
  onSave,
  name,
  setName,
  avatar,
  setAvatar,
  loading = false,
  error = '',
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>EDIT HERO IDENTITY</Text>
          <Text style={styles.modalSub}>Update your character name and guild crest</Text>

          {error ? (
            <View style={styles.modalErrorBox}>
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ADVENTURER NAME</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Shadow Adventurer"
              placeholderTextColor={colors.text.onDark.secondary}
              autoCapitalize="words"
              maxLength={30}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>GUILD CREST</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.avatarOption, avatar === icon && styles.avatarOptionSelected]}
                  onPress={() => setAvatar(icon)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={22}
                    color={avatar === icon ? colors.bg.dusk : colors.accent.gold}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={onSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.bg.dusk} />
              ) : (
                <Text style={styles.modalSaveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.displayPixelSm,
    fontSize: 14,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  modalSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    fontSize: 12,
  },
  modalErrorBox: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    padding: 8,
    borderRadius: 4,
  },
  modalErrorText: {
    ...typography.caption,
    color: colors.accent.coral,
    fontSize: 11,
  },
  inputGroup: {
    gap: 4,
    marginTop: 4,
  },
  inputLabel: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#1E1933',
    borderWidth: 1,
    borderColor: '#4A3E70',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text.onDark.primary,
    ...typography.bodyMd,
    fontSize: 13,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E1933',
    borderWidth: 1.5,
    borderColor: '#3D3560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A3E70',
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  modalSaveBtn: {
    flex: 1.5,
    backgroundColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalSaveText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
    fontSize: 12,
  },
});
