import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import PixelCard from '../PixelCard';
import { triggerHaptic } from '../../lib/haptics';

export default function PendingAdmissionCard({ pendingTeam, onCancelRequest, cancelling = false }) {
  if (!pendingTeam) return null;

  return (
    <PixelCard variant="gold" glow style={styles.card}>
      <View style={styles.statusHeader}>
        <View style={styles.pulseDot} />
        <Text style={styles.statusBadgeText}>ADMISSION REQUEST PENDING</Text>
      </View>

      <View style={styles.teamInfoBlock}>
        <Text style={styles.teamName}>{pendingTeam.name}</Text>
        <Text style={styles.teamCode}>INVITE CODE: {pendingTeam.code}</Text>
      </View>

      <Text style={styles.description}>
        Your admission petition has been dispatched. The Party Captain or Vice-Captain must review
        and approve your entry before you can access the guild roster and active radar.
      </Text>

      <View style={styles.waitingIndicator}>
        <ActivityIndicator size="small" color={colors.accent.gold} />
        <Text style={styles.waitingText}>Awaiting Gatekeeper Verification...</Text>
      </View>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => {
          triggerHaptic('warning');
          onCancelRequest();
        }}
        disabled={cancelling}
        activeOpacity={0.8}
      >
        {cancelling ? (
          <ActivityIndicator size="small" color={colors.accent.coral} />
        ) : (
          <Text style={styles.cancelBtnText}>Cancel Join Request</Text>
        )}
      </TouchableOpacity>
    </PixelCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: spacing.sm,
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.gold,
  },
  statusBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  teamInfoBlock: {
    alignItems: 'center',
    gap: 2,
    marginVertical: 4,
  },
  teamName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontSize: 18,
    textAlign: 'center',
  },
  teamCode: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 11,
    letterSpacing: 2,
  },
  description: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E1933',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
    marginVertical: 4,
  },
  waitingText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontSize: 11,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent.coral,
    backgroundColor: 'rgba(232, 102, 75, 0.1)',
    marginTop: 4,
  },
  cancelBtnText: {
    ...typography.captionBold,
    color: colors.accent.coral,
    fontSize: 11,
  },
});
