import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function ChallengeStatusCard({ status, points, feedback }) {
  if (status === 'approved') {
    return (
      <View style={styles.approvedCard}>
        <MaterialCommunityIcons name="check-decagram" size={32} color={colors.accent.green} />
        <Text style={styles.approvedTitle}>BOUNTY CLAIMED!</Text>
        <Text style={styles.approvedSub}>
          Your party earned +{points || 150} XP for completing this mission.
        </Text>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={styles.pendingCard}>
        <MaterialCommunityIcons name="clock-outline" size={32} color={colors.accent.gold} />
        <Text style={styles.pendingTitle}>UNDER GUILD REVIEW</Text>
        <Text style={styles.pendingSub}>
          Your party’s submission is in the review queue. Points will be awarded upon approval.
        </Text>
      </View>
    );
  }

  if (status === 'rejected' && feedback) {
    return (
      <View style={styles.feedbackBox}>
        <Text style={styles.feedbackLabel}>ADMIN FEEDBACK:</Text>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  approvedCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent.green,
    gap: spacing.xs,
  },
  approvedTitle: {
    ...typography.headingLg,
    color: colors.accent.green,
    fontWeight: '800',
  },
  approvedSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: spacing.xs,
  },
  pendingTitle: {
    ...typography.headingLg,
    color: colors.accent.gold,
    fontWeight: '800',
  },
  pendingSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  feedbackBox: {
    backgroundColor: '#381C28',
    borderRadius: 6,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.coral,
    gap: 2,
    marginBottom: spacing.sm,
  },
  feedbackLabel: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.coral,
    letterSpacing: 1,
  },
  feedbackText: {
    ...typography.bodyMd,
    color: '#FFF',
  },
});
