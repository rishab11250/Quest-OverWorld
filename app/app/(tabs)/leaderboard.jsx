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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [rankings, setRankings] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError('');
      const data = await api.get('/leaderboard');
      setRankings(data.rankings || []);
      setMyTeam(data.myTeam || null);
    } catch (err) {
      setError(err.message || 'Failed to load rankings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const renderMedal = (rank) => {
    if (rank === 1) {
      return (
        <View style={[styles.medalCircle, styles.medalGold]}>
          <Text style={styles.medalEmoji}>🥇</Text>
        </View>
      );
    }
    if (rank === 2) {
      return (
        <View style={[styles.medalCircle, styles.medalSilver]}>
          <Text style={styles.medalEmoji}>🥈</Text>
        </View>
      );
    }
    if (rank === 3) {
      return (
        <View style={[styles.medalCircle, styles.medalBronze]}>
          <Text style={styles.medalEmoji}>🥉</Text>
        </View>
      );
    }
    return (
      <View style={styles.rankNumCircle}>
        <Text style={styles.rankNumText}>#{rank}</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pixelTitle}>HALL OF FAME</Text>
        <Text style={styles.subtitle}>GUILD OVERWORLD RANKINGS</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Sticky User Party Rank Card (if in party) */}
      {myTeam ? (
        <View style={styles.myTeamCard}>
          <View style={styles.myTeamHeader}>
            <Text style={styles.myTeamLabel}>YOUR PARTY STANDING</Text>
            <View style={styles.myTeamBadge}>
              <Text style={styles.myTeamBadgeText}>RANK #{myTeam.rank}</Text>
            </View>
          </View>

          <View style={styles.myTeamBody}>
            <View style={styles.myTeamLeft}>
              <Text style={styles.myTeamName}>{myTeam.name}</Text>
              <Text style={styles.myTeamStats}>
                LVL {myTeam.level} • {myTeam.checkpointsCount} Checkpoints • {myTeam.challengesCount} Bounties
              </Text>
            </View>
            <Text style={styles.myTeamScore}>+{myTeam.score} PTS</Text>
          </View>
        </View>
      ) : null}

      {/* Rankings List */}
      <View style={styles.listContainer}>
        {rankings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No adventuring parties on the board yet.</Text>
          </View>
        ) : (
          rankings.map((team) => {
            const isFirst = team.rank === 1;

            return (
              <TouchableOpacity
                key={team._id}
                style={[
                  styles.teamRowCard,
                  isFirst && styles.cardFirst,
                  team.isCurrentTeam && styles.cardCurrentTeam,
                ]}
                onPress={() => router.push(`/team/${team._id}`)}
                activeOpacity={0.8}
              >
                {/* Medal / Rank Icon */}
                {renderMedal(team.rank)}

                {/* Team Info */}
                <View style={styles.teamDetails}>
                  <View style={styles.teamTitleRow}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    {team.isCurrentTeam ? (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.teamSubtext}>
                    LVL {team.level} • {team.membersCount} Players • {team.checkpointsCount} Flags
                  </Text>
                </View>

                {/* Points */}
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>+{team.score}</Text>
                  <Text style={styles.scoreLabel}>PTS</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
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
    gap: spacing.md,
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
  subtitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
    letterSpacing: 2,
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
  myTeamCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 10,
    padding: spacing.cardPadding,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    gap: spacing.xs,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  myTeamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 75, 0.25)',
    paddingBottom: 4,
  },
  myTeamLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  myTeamBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  myTeamBadgeText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  myTeamBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  myTeamLeft: {
    flex: 1,
  },
  myTeamName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  myTeamStats: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  myTeamScore: {
    ...typography.displayPixel,
    fontSize: 16,
    color: colors.accent.gold,
  },
  listContainer: {
    gap: spacing.sm,
  },
  teamRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  cardFirst: {
    borderColor: 'rgba(242, 200, 75, 0.5)',
    backgroundColor: '#2E274D',
  },
  cardCurrentTeam: {
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
  },
  medalCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalGold: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  medalSilver: {
    backgroundColor: 'rgba(201, 195, 221, 0.2)',
    borderWidth: 1,
    borderColor: '#C9C3DD',
  },
  medalBronze: {
    backgroundColor: 'rgba(232, 102, 75, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
  },
  medalEmoji: {
    fontSize: 18,
  },
  rankNumCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1A33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  rankNumText: {
    ...typography.monoSm,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
    fontSize: 12,
  },
  teamDetails: {
    flex: 1,
    gap: 2,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamName: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  youBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  teamSubtext: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    ...typography.displayPixel,
    fontSize: 13,
    color: colors.accent.gold,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
    fontFamily: 'monospace',
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
});
