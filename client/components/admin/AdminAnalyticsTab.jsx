import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
};

export default function AdminAnalyticsTab({ questId }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkpointData, setCheckpointData] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const qParam = questId ? `?questId=${questId}` : '';
      const [cpRes, chRes] = await Promise.all([
        api.get(`/admin/analytics/checkpoints${qParam}`),
        api.get(`/admin/analytics/challenges${qParam}`),
      ]);
      setCheckpointData(cpRes);
      setChallengeData(chRes);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [questId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Compiling Event Aggregations...</Text>
      </View>
    );
  }

  const cpSummary = checkpointData?.summary || {};
  const chSummary = challengeData?.summary || {};
  const checkpoints = checkpointData?.checkpoints || [];
  const challenges = challengeData?.challenges || [];

  return (
    <View style={styles.container}>
      {/* Header / Refresh Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>POST-EVENT ANALYTICS</Text>
          <Text style={styles.headerSubtitle}>
            {checkpointData?.quest?.name
              ? `Quest: ${checkpointData.quest.name}`
              : 'Realm Progression & Telemetry'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color={refreshing ? colors.text.onDark.secondary : colors.accent.gold}
          />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* 4 Summary Cards */}
      <View style={styles.cardsGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.cardValue}>{cpSummary.totalTeams || 0}</Text>
          <Text style={styles.cardLabel}>Parties Enrolled</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.cardValue, { color: colors.accent.teal }]}>
            {cpSummary.completionRate || 0}%
          </Text>
          <Text style={styles.cardLabel}>Completion Rate</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.cardValue, { color: colors.accent.coral }]} numberOfLines={1}>
            {chSummary.hardestChallenge ? chSummary.hardestChallenge.title : 'None'}
          </Text>
          <Text style={styles.cardLabel}>
            Hardest Bounty{' '}
            {chSummary.hardestChallenge ? `(${chSummary.hardestChallenge.finalPassRate}%)` : ''}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.cardValue, { color: colors.accent.gold }]} numberOfLines={1}>
            {cpSummary.longestBottleneckCheckpoint
              ? cpSummary.longestBottleneckCheckpoint.name
              : 'None'}
          </Text>
          <Text style={styles.cardLabel}>
            Longest Bottleneck{' '}
            {cpSummary.longestBottleneckCheckpoint
              ? `(${formatDuration(cpSummary.longestBottleneckCheckpoint.avgTimeToClearSeconds)})`
              : ''}
          </Text>
        </View>
      </View>

      {/* Table 1: Checkpoint Funnel & Clear Times */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <MaterialCommunityIcons name="flag-checkered" size={16} color={colors.accent.gold} />
          <Text style={styles.sectionTitle}>CHECKPOINT FUNNEL & TIME-TO-CLEAR</Text>
        </View>

        {checkpoints.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No checkpoints registered for this event.</Text>
          </View>
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: 32 }]}>#</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Checkpoint</Text>
              <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>Clears</Text>
              <Text style={[styles.th, { width: 68, textAlign: 'right' }]}>Avg Time</Text>
              <Text style={[styles.th, { width: 68, textAlign: 'right' }]}>Drop-off</Text>
            </View>

            {checkpoints.map((cp) => (
              <View key={cp._id} style={styles.tableDataRow}>
                <Text style={styles.orderBadge}>{cp.order}</Text>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cellTitle} numberOfLines={1}>
                    {cp.name}
                  </Text>
                  {cp.prerequisites && cp.prerequisites.length > 1 ? (
                    <Text style={styles.branchNotice}>
                      Branch merge ({cp.prerequisites.length})
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.cellSub, { width: 50, textAlign: 'center' }]}>
                  {cp.teamsCleared}
                </Text>
                <Text
                  style={[
                    styles.cellSub,
                    { width: 68, textAlign: 'right', color: colors.accent.gold },
                  ]}
                >
                  {formatDuration(cp.avgTimeToClearSeconds)}
                </Text>
                <View style={[styles.dropOffCell, { width: 68 }]}>
                  <Text
                    style={[styles.dropOffText, cp.dropOffRate > 30 ? styles.highDropOff : null]}
                  >
                    {cp.dropOffRate}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Table 2: Challenge Performance & Hints */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <MaterialCommunityIcons name="sword-cross" size={16} color={colors.accent.coral} />
          <Text style={styles.sectionTitle}>BOUNTY PERFORMANCE & HINTS</Text>
        </View>

        {challenges.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bounties recorded for this event.</Text>
          </View>
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 1.3 }]}>Bounty</Text>
              <Text style={[styles.th, { width: 44, textAlign: 'center' }]}>Try 1</Text>
              <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>Pass %</Text>
              <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>Avg Att</Text>
              <Text style={[styles.th, { width: 44, textAlign: 'right' }]}>Hints</Text>
            </View>

            {challenges.map((ch) => (
              <View key={ch._id} style={styles.tableDataRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.cellTitle} numberOfLines={1}>
                    {ch.title}
                  </Text>
                  <Text style={styles.categoryBadge}>{ch.category}</Text>
                </View>
                <Text style={[styles.cellSub, { width: 44, textAlign: 'center' }]}>
                  {ch.firstTrySuccessRate}%
                </Text>
                <Text
                  style={[
                    styles.cellSub,
                    {
                      width: 50,
                      textAlign: 'center',
                      color: ch.finalPassRate >= 70 ? colors.accent.teal : colors.accent.coral,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {ch.finalPassRate}%
                </Text>
                <Text style={[styles.cellSub, { width: 50, textAlign: 'center' }]}>
                  {ch.avgAttemptsBeforeSolve || 0}
                </Text>
                <Text
                  style={[
                    styles.cellSub,
                    {
                      width: 44,
                      textAlign: 'right',
                      color:
                        ch.hintsRevealedCount > 0
                          ? colors.accent.gold
                          : colors.text.onDark.secondary,
                    },
                  ]}
                >
                  {ch.hintsRevealedCount || 0}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.headingSm,
    fontWeight: '900',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: spacing.xs,
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  errorBox: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderColor: colors.accent.coral,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.accent.coral,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#3D3560',
    alignItems: 'center',
  },
  cardValue: {
    ...typography.headingMd,
    fontWeight: '900',
    color: colors.text.onDark.primary,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionContainer: {
    gap: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
    letterSpacing: 1,
  },
  tableCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3560',
  },
  th: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 53, 96, 0.5)',
  },
  orderBadge: {
    width: 32,
    ...typography.monoSm,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  cellTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  branchNotice: {
    ...typography.caption,
    fontSize: 9,
    color: colors.accent.teal,
    fontStyle: 'italic',
  },
  categoryBadge: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.onDark.secondary,
    textTransform: 'uppercase',
  },
  cellSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.onDark.primary,
  },
  dropOffCell: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dropOffText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  highDropOff: {
    color: colors.accent.coral,
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#3D3560',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
});
