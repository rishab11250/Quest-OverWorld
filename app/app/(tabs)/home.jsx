import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import DialogueBox from '../../components/DialogueBox';
import ProgressBar from '../../components/ProgressBar';
import PixelBadge from '../../components/PixelBadge';

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
    return <LoadingScreen message="Unveiling Quest Realm..." />;
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

      {/* Party Score & Level Progression Banner */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>PARTY XP</Text>
        <Text style={styles.pointsValue}>+{team?.score || 0} PTS</Text>
        <View style={styles.badgeCentered}>
          <PixelBadge label={`LVL ${level}`} variant="gold" />
        </View>

        {team ? (
          <ProgressBar
            current={team?.score || 0}
            max={250}
            label={`NEXT LEVEL PROGRESS (LVL ${level + 1})`}
          />
        ) : null}
      </View>

      <StatusBanner type="error" message={error} />

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
            <Text style={styles.primaryButtonText}>Head to Party HQ</Text>
          </TouchableOpacity>
        </View>
      ) : quest ? (
        /* Active Quest Content */
        <View style={styles.questContainer}>
          <View style={styles.questCard}>
            <View style={styles.questHeaderRow}>
              <View style={styles.questTag}>
                <Text style={styles.questTagText}>ACTIVE QUEST</Text>
              </View>
              <Text style={styles.questPoints}>+{quest.totalPoints || 700} PTS TOTAL</Text>
            </View>

            <Text style={styles.questName}>{quest.name}</Text>
            <Text style={styles.questDesc}>{quest.description}</Text>

            <View style={styles.stationCounterBox}>
              <Text style={styles.stationCounterText}>
                📍 Station {data?.currentOrder || 1} of {quest.checkpoints?.length || 4}
              </Text>
            </View>
          </View>

          {/* Current Clue / Objective */}
          {data?.currentClue ? (
            <View style={styles.clueCard}>
              <Text style={styles.clueHeading}>CURRENT OBJECTIVE CLUE</Text>
              <Text style={styles.clueBody}>{data.currentClue}</Text>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push('/camera/scanner')}
                activeOpacity={0.8}
              >
                <Text style={styles.scanButtonText}>📷 Scan Station QR Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <DialogueBox
              speaker="ARCH-MAGE"
              text="You have conquered all stations in this realm quest! Check the Bounty Board for special missions or view the Hall of Fame."
            />
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Active Quest</Text>
          <Text style={styles.emptySubtitle}>
            The realm is currently peaceful. Check back soon for new campus events!
          </Text>
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
  content: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  pixelTitle: {
    ...typography.displayPixelLg,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  pixelSubtitle: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  pointsCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: spacing.xs,
    alignItems: 'center',
  },
  pointsLabel: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  pointsValue: {
    ...typography.displayPixelLg,
    fontSize: 22,
    lineHeight: 30,
    color: colors.accent.gold,
    textAlign: 'center',
    marginVertical: 2,
  },
  badgeCentered: {
    alignItems: 'center',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.sm,
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
  primaryButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    ...typography.bodyLgBold,
    color: colors.bg.dusk,
  },
  questContainer: {
    gap: spacing.md,
  },
  questCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  questHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questTag: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questTagText: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 10,
  },
  questPoints: {
    ...typography.captionSemiBold,
    color: colors.text.onDark.secondary,
  },
  questName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  questDesc: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 20,
  },
  stationCounterBox: {
    backgroundColor: '#1E1A33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  stationCounterText: {
    ...typography.captionBold,
    color: colors.accent.gold,
  },
  clueCard: {
    backgroundColor: '#272044',
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: spacing.sm,
  },
  clueHeading: {
    ...typography.captionBold,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  clueBody: {
    ...typography.bodyLgSemiBold,
    color: '#FFF',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  scanButtonText: {
    ...typography.bodyLgBold,
    color: colors.bg.dusk,
  },
});
