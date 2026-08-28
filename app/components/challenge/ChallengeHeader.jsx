import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function ChallengeHeader({ challenge }) {
  if (!challenge) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryLabel}>
            {(challenge.category || 'photo').toUpperCase()} CHALLENGE
          </Text>
          <View style={styles.pointsChip}>
            <Text style={styles.pointsChipText}>+{challenge.points || 150} PTS</Text>
          </View>
        </View>
        <Text style={styles.title}>{challenge.title}</Text>
      </View>

      {/* Mission Objective Card */}
      <View style={styles.objectiveCard}>
        <Text style={styles.cardHeader}>MISSION OBJECTIVE</Text>
        <Text style={styles.objectiveText}>{challenge.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  pointsChip: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsChipText: {
    ...typography.displayPixelSm,
    color: colors.accent.gold,
  },
  title: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  objectiveCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  cardHeader: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  objectiveText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 22,
  },
});
