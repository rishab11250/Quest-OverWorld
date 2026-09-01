import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { triggerHaptic } from '../../lib/haptics';

export default function TransferCaptainModal({
  visible,
  team,
  currentUserId,
  onClose,
  onConfirmTransferAndLeave,
  loading = false,
}) {
  const [selectedLeaderId, setSelectedLeaderId] = useState(null);

  if (!team) return null;

  const eligibleMembers = (team.members || []).filter((m) => {
    const memberId = typeof m === 'object' ? m._id : m;
    return memberId !== currentUserId;
  });

  const handleConfirm = () => {
    if (!selectedLeaderId) return;
    triggerHaptic('medium');
    onConfirmTransferAndLeave(selectedLeaderId);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="crown" size={22} color={colors.accent.gold} />
              <Text style={styles.modalTitle}>APPOINT NEW CAPTAIN</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={20} color={colors.text.onDark.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            As Party Captain, you must transfer squad leadership to an active adventurer before
            leaving "{team.name}".
          </Text>

          <ScrollView style={styles.memberList}>
            {eligibleMembers.map((member) => {
              const memberId = typeof member === 'object' ? member._id : member;
              const isSelected = selectedLeaderId === memberId;
              const isViceCaptain =
                team.viceCaptains &&
                team.viceCaptains.some((vc) => (typeof vc === 'object' ? vc._id : vc) === memberId);

              return (
                <TouchableOpacity
                  key={memberId}
                  style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedLeaderId(memberId);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>
                      {(member.name || 'A').charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {isViceCaptain ? (
                        <View style={styles.vcBadge}>
                          <Text style={styles.vcBadgeText}>VICE-CAPTAIN</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>

                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={22}
                    color={isSelected ? colors.accent.gold : colors.text.onDark.secondary}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Stay in Party</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !selectedLeaderId && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selectedLeaderId || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.bg.dusk} />
              ) : (
                <Text style={styles.confirmBtnText}>Transfer & Leave</Text>
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
    borderRadius: 10,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    maxHeight: '80%',
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  modalSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    fontSize: 12,
  },
  memberList: {
    maxHeight: 220,
    marginVertical: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E1933',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    marginBottom: 6,
  },
  memberRowSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...typography.bodyLgBold,
    color: colors.accent.gold,
    fontSize: 14,
  },
  memberName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 13,
  },
  vcBadge: {
    backgroundColor: 'rgba(62, 207, 142, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.green,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  vcBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 6,
    color: colors.accent.green,
  },
  memberEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
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
  confirmBtn: {
    flex: 1.5,
    backgroundColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
    fontSize: 12,
  },
});
