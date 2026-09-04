import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function AdminOverviewTab({ stats, teams, onNavigateReviews }) {
  return (
    <View style={styles.container}>
      {/* 6 Key Metrics Tiles */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats?.teams || 0}</Text>
          <Text style={styles.statLabel}>Parties Formed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats?.users || 0}</Text>
          <Text style={styles.statLabel}>Adventurers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats?.checkpoints || 0}</Text>
          <Text style={styles.statLabel}>GPS Stations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats?.challenges || 0}</Text>
          <Text style={styles.statLabel}>Live Bounties</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.accent.gold }]}>
            +{stats?.totalXpAwarded || 0}
          </Text>
          <Text style={styles.statLabel}>Total XP Generated</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.statCard,
            (stats?.pendingSubmissions || 0) > 0 && styles.statCardHighlight,
          ]}
          onPress={onNavigateReviews}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.statNum,
              (stats?.pendingSubmissions || 0) > 0 && { color: colors.accent.coral },
            ]}
          >
            {stats?.pendingSubmissions || 0}
          </Text>
          <Text style={styles.statLabel}>Needs Review ›</Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard Snapshot */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>REAL-TIME PARTY LEADERBOARD</Text>
          <Text style={styles.sectionMeta}>{teams?.length || 0} PARTIES REGISTERED</Text>
        </View>

        {!teams || teams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardSub}>No teams joined the realm yet.</Text>
          </View>
        ) : (
          teams.map((team, idx) => (
            <View key={team._id} style={styles.teamMiniRow}>
              <Text style={styles.teamRankNum}>#{idx + 1}</Text>
              <View style={styles.teamMiniInfo}>
                <Text style={styles.teamMiniName}>{team.name}</Text>
                <Text style={styles.teamMiniCode}>CODE: {team.code}</Text>
              </View>
              <Text style={styles.teamMiniScore}>+{team.score || 0} PTS</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  statCardHighlight: {
    borderColor: colors.accent.coral,
    backgroundColor: 'rgba(232, 102, 75, 0.1)',
  },
  statNum: {
    ...typography.headingLg,
    fontWeight: '900',
    color: colors.text.onDark.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
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
  sectionMeta: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
  },
  teamMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  teamRankNum: {
    ...typography.monoSm,
    fontWeight: '900',
    color: colors.accent.gold,
    width: 24,
  },
  teamMiniInfo: {
    flex: 1,
  },
  teamMiniName: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  teamMiniCode: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontFamily: 'monospace',
  },
  teamMiniScore: {
    ...typography.monoSm,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  emptyCardSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
});
