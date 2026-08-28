import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function AdminBountiesTab({
  challenges,
  onOpenCreateChallenge,
  onDeleteChallenge,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.cardSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>SPECIAL BOUNTIES ({challenges.length})</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenCreateChallenge}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>+ Add Bounty</Text>
          </TouchableOpacity>
        </View>

        {challenges.map((c) => (
          <View key={c._id} style={styles.bountyCard}>
            <View style={styles.bountyTop}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{c.category?.toUpperCase()}</Text>
              </View>
              <View style={styles.pointsBadgeMini}>
                <Text style={styles.pointsBadgeMiniText}>+{c.points} PTS</Text>
              </View>
            </View>

            <Text style={styles.bountyTitle}>{c.title}</Text>
            <Text style={styles.bountyDesc}>{c.description}</Text>

            <View style={styles.bountyFooter}>
              <Text style={styles.verifyModeText}>
                Mode: {c.verificationType === 'auto_answer' ? '⚡ Auto Answer' : '🛡️ Guild Review'}
              </Text>
              <TouchableOpacity
                onPress={() => onDeleteChallenge(c._id)}
                style={styles.deleteIconBtn}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.accent.coral} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  cardSection: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  actionBtn: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  bountyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  bountyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: '#322A54',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    fontSize: 10,
  },
  pointsBadgeMini: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsBadgeMiniText: {
    ...typography.monoSm,
    fontWeight: '900',
    color: colors.accent.gold,
    fontSize: 11,
  },
  bountyTitle: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  bountyDesc: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  bountyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#362E52',
    paddingTop: spacing.xs,
    marginTop: 4,
  },
  verifyModeText: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  deleteIconBtn: {
    padding: 6,
  },
});
