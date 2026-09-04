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

export default function PendingRequestsModal({
  visible,
  team,
  onClose,
  onApprove,
  onReject,
  actionLoadingId = null,
}) {
  if (!team) return null;

  const requests = team.pendingRequests || [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="shield-account" size={22} color={colors.accent.gold} />
              <View>
                <Text style={styles.modalTitle}>GUILD ADMISSION QUEUE</Text>
                <Text style={styles.modalSub}>
                  {requests.length} {requests.length === 1 ? 'Adventurer' : 'Adventurers'} seeking
                  entry
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={20} color={colors.text.onDark.secondary} />
            </TouchableOpacity>
          </View>

          {/* List of Requests */}
          <ScrollView style={styles.requestList}>
            {requests.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={32}
                  color={colors.accent.green}
                />
                <Text style={styles.emptyTitle}>Queue Clear</Text>
                <Text style={styles.emptySub}>No pending adventurer recruitment requests.</Text>
              </View>
            ) : (
              requests.map((item, idx) => {
                const user = item.user;
                const userId = typeof user === 'object' ? user?._id : user;
                const userName = user?.name || 'Unknown Adventurer';
                const userEmail = user?.email || 'No email provided';
                const isItemLoading = actionLoadingId === userId;

                return (
                  <View key={userId || idx} style={styles.requestCard}>
                    <View style={styles.requestInfoRow}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>{userName.charAt(0).toUpperCase()}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.applicantName}>{userName}</Text>
                        <Text style={styles.applicantEmail}>{userEmail}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => {
                          triggerHaptic('warning');
                          onReject(userId);
                        }}
                        disabled={Boolean(actionLoadingId)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={16}
                          color={colors.accent.coral}
                        />
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => {
                          triggerHaptic('success');
                          onApprove(userId);
                        }}
                        disabled={Boolean(actionLoadingId)}
                        activeOpacity={0.8}
                      >
                        {isItemLoading ? (
                          <ActivityIndicator size="small" color={colors.bg.dusk} />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="check" size={16} color={colors.bg.dusk} />
                            <Text style={styles.approveBtnText}>Admit to Party</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Done</Text>
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
    maxHeight: '80%',
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2F264C',
    paddingBottom: 10,
  },
  modalTitle: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  modalSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10.5,
    marginTop: 1,
  },
  requestList: {
    maxHeight: 280,
    marginVertical: 4,
  },
  emptyBox: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontSize: 14,
  },
  emptySub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    padding: spacing.sm,
    marginBottom: 8,
    gap: spacing.xs,
  },
  requestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  applicantName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 13,
  },
  applicantEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10.5,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(232, 102, 75, 0.4)',
    backgroundColor: 'rgba(232, 102, 75, 0.1)',
  },
  rejectBtnText: {
    ...typography.captionBold,
    color: colors.accent.coral,
    fontSize: 11,
  },
  approveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: colors.accent.gold,
  },
  approveBtnText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
    fontSize: 11,
  },
  closeBtn: {
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A3E70',
    alignItems: 'center',
    marginTop: 4,
  },
  closeBtnText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
});
