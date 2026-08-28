import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import LeaderboardRow from '../../components/leaderboard/LeaderboardRow';

export default function LeaderboardScreen() {
  const [rankings, setRankings] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setError('');
      const data = await api.get('/leaderboard');
      setRankings(data.rankings || []);
      setMyTeam(data.myTeam || null);
    } catch (err) {
      if (!isSilent) {
        setError(err.message || 'Failed to load rankings.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard(true);
    }, [fetchLeaderboard])
  );

  useEffect(() => {
    // Auto-refresh polling every 15s for live leaderboard changes
    const pollTimer = setInterval(() => {
      fetchLeaderboard(true);
    }, 15000);

    return () => clearInterval(pollTimer);
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(false);
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Calculating Realm Rankings..." />;
  }

  const myTeamRank = myTeam ? rankings.findIndex((r) => r._id === myTeam._id) + 1 : 0;

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
        <Text style={styles.subtitle}>CAMPUS GUILD RANKINGS</Text>
      </View>

      <StatusBanner type="error" message={error} />

      {/* Sticky My Team Standing Banner */}
      {myTeam && myTeamRank > 0 ? (
        <View style={styles.standingBanner}>
          <View style={styles.standingLeft}>
            <Text style={styles.standingLabel}>YOUR PARTY STANDING</Text>
            <Text style={styles.standingName}>{myTeam.name}</Text>
          </View>
          <View style={styles.standingRight}>
            <Text style={styles.standingRank}>#{myTeamRank}</Text>
            <Text style={styles.standingPoints}>+{myTeam.score || 0} PTS</Text>
          </View>
        </View>
      ) : null}

      {/* Rankings Table */}
      <View style={styles.listSection}>
        {rankings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>The Hall is Quiet</Text>
            <Text style={styles.emptySub}>
              No parties have earned points yet. Scan checkpoints or claim bounties to lead the
              ranks!
            </Text>
          </View>
        ) : (
          rankings.map((item, idx) => (
            <LeaderboardRow
              key={item._id}
              item={item}
              rank={idx + 1}
              isMyTeam={myTeam?._id === item._id}
            />
          ))
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
  subtitle: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  standingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#272044',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    borderRadius: 8,
    padding: spacing.cardPadding,
  },
  standingLeft: {
    gap: 2,
  },
  standingLabel: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.gold,
    letterSpacing: 1,
    fontSize: 10,
  },
  standingName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  standingRight: {
    alignItems: 'flex-end',
  },
  standingRank: {
    ...typography.displayLg,
    color: colors.accent.gold,
    fontWeight: '900',
  },
  standingPoints: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontWeight: '700',
  },
  listSection: {
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  emptySub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
});
