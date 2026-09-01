import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import DialogueBox from '../../components/DialogueBox';
import ProgressBar from '../../components/ProgressBar';
import PixelBadge from '../../components/PixelBadge';
import PixelCard from '../../components/PixelCard';
import { triggerHaptic } from '../../lib/haptics';

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchActiveQuest = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setError('');
      const res = await api.get('/quests/active');
      setData(res);
    } catch (err) {
      if (!isSilent) setError(err.message || 'Failed to load active quest.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchActiveQuest(true);
    }, [fetchActiveQuest])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveQuest(false);
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
      <PixelCard variant="gold" glow style={styles.pointsCard}>
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
      </PixelCard>

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
            onPress={() => {
              triggerHaptic('light');
              router.push('/(tabs)/team');
            }}
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
                📍 Station {quest?.currentOrder || 1} of{' '}
                {quest?.totalCheckpoints || quest?.checkpoints?.length || 4}
              </Text>
            </View>
          </View>

          {/* Current Clue / Objective */}
          {quest?.currentClue ? (
            <PixelCard variant="gold" glow style={styles.clueCard}>
              <View style={styles.clueHeaderRow}>
                <View style={styles.questTag}>
                  <Text style={styles.questTagText}>STATION #{quest.currentClue.order}</Text>
                </View>
                <Text style={styles.questPoints}>+{quest.currentClue.points || 100} PTS</Text>
              </View>
              <Text style={styles.clueTitle}>{quest.currentClue.title}</Text>
              <Text style={styles.clueBody}>{quest.currentClue.clue}</Text>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => {
                  triggerHaptic('medium');
                  router.push('/camera/scanner');
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.bg.dusk} />
                <Text style={styles.scanButtonText}>Scan Station QR Code</Text>
              </TouchableOpacity>
            </PixelCard>
          ) : (
            <DialogueBox
              speaker="ARCH-MAGE"
              text="You have conquered all stations in this realm quest! Check the Bounty Board for special missions or view the Hall of Fame."
            />
          )}

          {/* Expedition Waypoint Roadmap */}
          <PixelCard variant="dusk" style={styles.roadmapCard}>
            <View style={styles.roadmapHeader}>
              <Text style={styles.roadmapTitle}>EXPEDITION WAYPOINTS</Text>
              <Text style={styles.roadmapSub}>
                {Math.max(
                  0,
                  Math.min((quest?.currentOrder || 1) - 1, quest?.totalCheckpoints || 0)
                )}{' '}
                / {quest?.totalCheckpoints || 0} CLEARED
              </Text>
            </View>

            <View style={styles.waypointList}>
              {(quest?.checkpoints && quest.checkpoints.length > 0
                ? quest.checkpoints
                : quest?.currentClue
                  ? [quest.currentClue]
                  : []
              ).map((wp) => {
                const isCleared = wp.order < (quest?.currentOrder || 1);
                const isActive = wp.order === (quest?.currentOrder || 1);
                const isLocked = wp.order > (quest?.currentOrder || 1);
                const waypointTitle = wp.title || wp.name || `Station #${wp.order}`;

                return (
                  <View
                    key={wp._id || wp.order}
                    style={[
                      styles.waypointRow,
                      isActive && styles.waypointRowActive,
                      isCleared && styles.waypointRowCleared,
                    ]}
                  >
                    <View style={styles.waypointLeft}>
                      <View
                        style={[
                          styles.waypointIconCircle,
                          isCleared && styles.iconCircleCleared,
                          isActive && styles.iconCircleActive,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isCleared ? 'check-bold' : isActive ? 'crosshairs-gps' : 'lock'}
                          size={13}
                          color={
                            isCleared
                              ? colors.accent.green
                              : isActive
                                ? colors.accent.gold
                                : '#5A527A'
                          }
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.waypointName,
                            isActive && styles.waypointNameActive,
                            isCleared && styles.waypointNameCleared,
                          ]}
                          numberOfLines={1}
                        >
                          #{wp.order} · {waypointTitle}
                        </Text>
                        <Text style={styles.waypointPoints}>+{wp.points || 0} PTS</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.waypointStatusBadge,
                        isCleared && styles.statusBadgeCleared,
                        isActive && styles.statusBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.waypointStatusText,
                          isCleared && styles.statusTextCleared,
                          isActive && styles.statusTextActive,
                        ]}
                      >
                        {isCleared ? 'CLEARED' : isActive ? 'TARGET' : 'LOCKED'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </PixelCard>
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
    ...typography.displayPixelSm,
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
    paddingVertical: 3,
    borderRadius: 4,
  },
  questTagText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
  questPoints: {
    ...typography.displayPixelXs,
    color: colors.text.onDark.secondary,
    fontSize: 8,
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
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  stationCounterText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
  clueCard: {
    backgroundColor: '#272044',
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: spacing.xs,
  },
  clueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  clueHeading: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    letterSpacing: 1.2,
    fontSize: 9,
  },
  clueStationBadge: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
  clueTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  clueBody: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 22,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent.gold,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  scanButtonText: {
    ...typography.displayPixelSm,
    fontSize: 11,
    color: colors.bg.dusk,
    letterSpacing: 0.5,
  },
  roadmapCard: {
    backgroundColor: colors.bg.duskRaised,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#362E52',
    paddingBottom: 6,
  },
  roadmapTitle: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  roadmapSub: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.text.onDark.secondary,
  },
  waypointList: {
    gap: 6,
  },
  waypointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#362E52',
  },
  waypointRowActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.08)',
  },
  waypointRowCleared: {
    borderColor: 'rgba(75, 181, 67, 0.4)',
  },
  waypointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  waypointIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#161326',
    borderWidth: 1,
    borderColor: '#3D3560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
  },
  iconCircleCleared: {
    borderColor: colors.accent.green,
    backgroundColor: 'rgba(75, 181, 67, 0.15)',
  },
  waypointName: {
    ...typography.bodyMd,
    color: colors.text.onDark.primary,
    fontSize: 12,
  },
  waypointNameActive: {
    ...typography.bodyMdBold,
    color: colors.accent.gold,
  },
  waypointNameCleared: {
    color: colors.text.onDark.secondary,
  },
  waypointPoints: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
    marginTop: 2,
  },
  waypointStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#161326',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderColor: colors.accent.gold,
  },
  statusBadgeCleared: {
    backgroundColor: 'rgba(75, 181, 67, 0.15)',
    borderColor: colors.accent.green,
  },
  waypointStatusText: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
  },
  statusTextActive: {
    color: colors.accent.gold,
  },
  statusTextCleared: {
    color: colors.accent.green,
  },
});
