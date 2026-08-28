import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import DialogueBox from '../../components/DialogueBox';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchActiveQuest = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/quests/active');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load active quest.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveQuest();
  }, [fetchActiveQuest]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveQuest();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  const quest = data?.quest;
  const team = data?.team;
  const level = Math.floor((team?.score || 0) / 250) + 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent.gold}
        />
      }
    >
      {/* Brand & Party XP Header */}
      <View style={styles.header}>
        <Text style={styles.pixelTitle}>QUEST OVERWORLD</Text>
        <Text style={styles.pixelSubtitle}>
          {team ? `${team.name.toUpperCase()} • LVL ${level}` : 'CAMPUS EXPLORATION'}
        </Text>
      </View>

      {/* Party Score Banner */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>PARTY XP</Text>
        <Text style={styles.pointsValue}>+{team?.score || 0} PTS</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>LVL {level}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* No Team State */}
      {!team ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Active Party</Text>
          <Text style={styles.emptySubtitle}>
            Join or form an adventuring party to receive quest clues and compete on the leaderboard.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/team')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Party Headquarters</Text>
          </TouchableOpacity>
        </View>
      ) : !quest ? (
        /* Team in place but No Quest State */
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Active Quest</Text>
          <Text style={styles.emptySubtitle}>
            Your party is assembled, but no active quest is currently deployed. Check back soon!
          </Text>
        </View>
      ) : quest.isCompleted ? (
        /* Quest Completed State */
        <View style={styles.completedCard}>
          <Text style={styles.completedTitle}>🏆 QUEST COMPLETED!</Text>
          <Text style={styles.completedSub}>
            All checkpoints in {quest.name} have been cleared by your party.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/leaderboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>View Guild Rankings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Active Checkpoint Clue Flow */
        <View style={styles.questContainer}>
          {/* Progress Header */}
          <View style={styles.progressHeader}>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                CHECKPOINT {quest.currentOrder} OF {quest.totalCheckpoints}
              </Text>
            </View>
            <Text style={styles.questName}>{quest.name}</Text>
          </View>

          {/* Current Clue Dialogue Box */}
          {quest.currentClue ? (
            <DialogueBox
              speaker={`CLUE #${quest.currentClue.order}: ${quest.currentClue.title.toUpperCase()}`}
              text={quest.currentClue.clue}
              footnote={`Bounty on Scan: +${quest.currentClue.points} PTS • Search Radius: ${quest.currentClue.radius}m`}
            />
          ) : null}

          {/* Quick Action Navigation */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/map')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>🗺️ View Overworld Map</Text>
            </TouchableOpacity>
          </View>

          {/* Completed Checkpoints Summary */}
          {quest.completedCheckpoints?.length > 0 ? (
            <View style={styles.completedListCard}>
              <Text style={styles.completedListTitle}>CLEARED CHECKPOINTS</Text>
              {quest.completedCheckpoints.map((cp) => (
                <View key={cp._id} style={styles.clearedRow}>
                  <Text style={styles.clearedIcon}>🚩</Text>
                  <Text style={styles.clearedTitle}>{cp.title}</Text>
                  <Text style={styles.clearedPoints}>+{cp.points} PTS</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pixelTitle: {
    ...typography.displayPixel,
    fontSize: 16,
    color: colors.accent.gold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pixelSubtitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
    letterSpacing: 2,
  },
  pointsCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.gold,
  },
  pointsLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  pointsValue: {
    ...typography.displayPixel,
    fontSize: 22,
    color: colors.accent.gold,
    marginVertical: spacing.xs,
  },
  levelBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  levelBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  errorBanner: {
    backgroundColor: colors.accent.coral,
    borderRadius: 6,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  questContainer: {
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBadge: {
    backgroundColor: colors.bg.duskRaised,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  progressBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  questName: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  actionGrid: {
    marginTop: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
  },
  primaryButtonText: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
  },
  secondaryButtonText: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.accent.gold,
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  completedCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.green,
    alignItems: 'center',
    gap: spacing.md,
  },
  completedTitle: {
    ...typography.headingLg,
    color: colors.accent.green,
    textAlign: 'center',
  },
  completedSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  completedListCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  completedListTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3560',
    paddingBottom: spacing.xs,
  },
  clearedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  clearedIcon: {
    fontSize: 14,
  },
  clearedTitle: {
    ...typography.bodyMd,
    color: colors.text.onDark.primary,
    fontWeight: '600',
    flex: 1,
  },
  clearedPoints: {
    ...typography.monoSm,
    color: colors.accent.green,
    fontWeight: '700',
  },
});
