import { useState, useEffect } from 'react';
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
import { triggerHaptic } from '../../lib/haptics';

export default function RenameTeamModal({
  visible,
  currentName,
  onClose,
  onRename,
  loading = false,
}) {
  const [name, setName] = useState(currentName || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(currentName || '');
    setError('');
  }, [currentName, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Party name cannot be empty.');
      triggerHaptic('error');
      return;
    }
    if (name.trim() === currentName) {
      onClose();
      return;
    }
    triggerHaptic('medium');
    onRename(name.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="shield-edit" size={20} color={colors.accent.gold} />
              <Text style={styles.modalTitle}>RENAME GUILD PARTY</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={18} color={colors.text.onDark.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            As the Party Captain, you can change the official name of your guild expedition.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEW PARTY NAME</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError('');
              }}
              placeholder="e.g. Shadow Seekers"
              placeholderTextColor="#7E75A0"
              maxLength={30}
              autoFocus
              editable={!loading}
            />
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.bg.dusk} />
              ) : (
                <Text style={styles.saveBtnText}>Save Name</Text>
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.displayPixelXs,
    fontSize: 8.5,
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  modalSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    padding: 8,
    borderRadius: 4,
  },
  errorText: {
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
    fontSize: 7,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#1E1933',
    borderWidth: 1,
    borderColor: '#4A3E70',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.text.onDark.primary,
    ...typography.bodyMd,
    fontSize: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A3E70',
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
    fontSize: 12,
  },
});
