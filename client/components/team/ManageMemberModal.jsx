import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { triggerHaptic } from '../../lib/haptics';

export default function ManageMemberModal({
  visible,
  member,
  team,
  isCaptain,
  isViceCaptain,
  onClose,
  onKickMember,
  onToggleViceCaptain,
  onPromoteToCaptain,
}) {
  if (!member) return null;

  const leaderId = typeof team.leader === 'object' ? team.leader._id : team.leader;
  const isTargetCaptain = member._id === leaderId;
  const isTargetViceCaptain =
    team.viceCaptains &&
    team.viceCaptains.some((vc) => (typeof vc === 'object' ? vc._id : vc) === member._id);

  const canKick = !isTargetCaptain && (isCaptain || (isViceCaptain && !isTargetViceCaptain));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {(member.name || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>
                  {isTargetCaptain
                    ? '👑 Party Captain'
                    : isTargetViceCaptain
                      ? '🛡️ Vice-Captain'
                      : '⚔️ Party Member'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={20} color={colors.text.onDark.secondary} />
            </TouchableOpacity>
          </View>

          {/* Action List */}
          <View style={styles.actionList}>
            {/* Captain Options */}
            {isCaptain && !isTargetCaptain ? (
              <>
                {/* Toggle Vice-Captain */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    triggerHaptic('selection');
                    onToggleViceCaptain(member, isTargetViceCaptain ? 'demote' : 'promote');
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={isTargetViceCaptain ? 'shield-remove' : 'shield-account'}
                    size={20}
                    color={colors.accent.gold}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>
                      {isTargetViceCaptain ? 'Demote to Member' : 'Promote to Vice-Captain'}
                    </Text>
                    <Text style={styles.actionSub}>
                      {isTargetViceCaptain
                        ? 'Revokes member removal privileges'
                        : 'Grants power to remove standard members'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Transfer Captaincy */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    triggerHaptic('medium');
                    onPromoteToCaptain(member);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="crown" size={20} color={colors.accent.gold} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Appoint as New Captain</Text>
                    <Text style={styles.actionSub}>You will step down to Vice-Captain</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : null}

            {/* Kick Member */}
            {canKick ? (
              <TouchableOpacity
                style={[styles.actionRow, styles.actionRowDanger]}
                onPress={() => {
                  triggerHaptic('warning');
                  onKickMember(member);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="account-remove"
                  size={20}
                  color={colors.accent.coral}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.accent.coral }]}>
                    Remove from Party
                  </Text>
                  <Text style={styles.actionSub}>Unlinks member from squad roster and chat</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Done</Text>
          </TouchableOpacity>
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
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2F264C',
    paddingBottom: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#322A54',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...typography.bodyLgBold,
    color: colors.accent.gold,
  },
  memberName: {
    ...typography.bodyLgBold,
    color: colors.text.onDark.primary,
  },
  memberRole: {
    ...typography.caption,
    color: colors.accent.gold,
    marginTop: 2,
  },
  actionList: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E1933',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  actionRowDanger: {
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    borderColor: colors.accent.coral,
  },
  actionTitle: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 13,
  },
  actionSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10.5,
    marginTop: 2,
  },
  cancelBtn: {
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
});
