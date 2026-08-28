import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

const CATEGORY_ICONS = {
  photo: 'camera',
  riddle: 'help-rhombus-outline',
  trivia: 'head-question-outline',
  creative: 'feather',
};

export default function ChallengeCard({ challenge, onPress }) {
  const submissionStatus = challenge.submission?.status;
  const isApproved = submissionStatus === 'approved';
  const isPending = submissionStatus === 'pending';
  const isRejected = submissionStatus === 'rejected';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isApproved && styles.cardApproved,
        isPending && styles.cardPending,
        isRejected && styles.cardRejected,
      ]}
      onPress={() => onPress(challenge._id)}
      activeOpacity={0.8}
    >
      {/* 8-Bit Gilded Corner Accents */}
      <View
        style={[
          styles.corner,
          styles.cornerTL,
          isApproved && styles.cornerGreen,
          isRejected && styles.cornerCoral,
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.cornerTR,
          isApproved && styles.cornerGreen,
          isRejected && styles.cornerCoral,
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.cornerBL,
          isApproved && styles.cornerGreen,
          isRejected && styles.cornerCoral,
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.cornerBR,
          isApproved && styles.cornerGreen,
          isRejected && styles.cornerCoral,
        ]}
      />

      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.categoryChip}>
          <MaterialCommunityIcons
            name={CATEGORY_ICONS[challenge.category] || 'trophy-outline'}
            size={14}
            color={colors.accent.gold}
          />
          <Text style={styles.categoryChipText}>{challenge.category.toUpperCase()}</Text>
        </View>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>+{challenge.points} PTS</Text>
        </View>
      </View>

      {/* Title & Description */}
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {challenge.description}
      </Text>

      {/* Footer / Status */}
      <View style={styles.footerRow}>
        <View style={styles.statusPill}>
          {isApproved ? (
            <View style={styles.statusApproved}>
              <MaterialCommunityIcons name="check-circle" size={14} color={colors.accent.green} />
              <Text style={styles.statusApprovedText}>CLAIMED</Text>
            </View>
          ) : isPending ? (
            <View style={styles.statusPending}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.accent.gold} />
              <Text style={styles.statusPendingText}>UNDER REVIEW</Text>
            </View>
          ) : isRejected ? (
            <View style={styles.statusRejected}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.accent.coral} />
              <Text style={styles.statusRejectedText}>RESUBMIT SOLUTION</Text>
            </View>
          ) : (
            <View style={styles.statusOpen}>
              <Text style={styles.statusOpenText}>OPEN BOUNTY ›</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
    position: 'relative',
  },
  cardApproved: {
    borderColor: colors.accent.green,
    backgroundColor: 'rgba(75, 181, 67, 0.05)',
  },
  cardPending: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.05)',
  },
  cardRejected: {
    borderColor: colors.accent.coral,
    backgroundColor: 'rgba(232, 102, 75, 0.05)',
  },
  corner: {
    position: 'absolute',
    width: 5,
    height: 5,
    backgroundColor: colors.accent.gold,
    zIndex: 5,
  },
  cornerGreen: {
    backgroundColor: colors.accent.green,
  },
  cornerCoral: {
    backgroundColor: colors.accent.coral,
  },
  cornerTL: {
    top: -1,
    left: -1,
  },
  cornerTR: {
    top: -1,
    right: -1,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#322A54',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryChipText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 7,
  },
  pointsBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsBadgeText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
  },
  title: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  description: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusApprovedText: {
    ...typography.displayPixelXs,
    color: colors.accent.green,
    fontSize: 7,
  },
  statusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPendingText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 7,
  },
  statusRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusRejectedText: {
    ...typography.displayPixelXs,
    color: colors.accent.coral,
    fontSize: 7,
  },
  statusOpen: {
    paddingVertical: 2,
  },
  statusOpenText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
});
