import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import ChallengeCard from '../../components/challenge/ChallengeCard';

const CATEGORIES = ['ALL', 'PHOTO', 'RIDDLE', 'TRIVIA', 'CREATIVE'];

export default function ChallengesScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [error, setError] = useState('');

  const fetchChallenges = useCallback(async () => {
    try {
      setError('');
      const data = await api.get('/challenges');
      setChallenges(data.challenges || []);
      setTeam(data.team || null);
    } catch (err) {
      setError(err.message || 'Failed to load bounties.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
  };

  const filteredChallenges = challenges.filter((c) => {
    if (selectedCategory === 'ALL') return true;
    return c.category?.toUpperCase() === selectedCategory;
  });

  if (loading && !refreshing) {
    return <LoadingScreen message="Unrolling Bounty Board..." />;
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
        <Text style={styles.pixelTitle}>BOUNTY BOARD</Text>
        <Text style={styles.subtitle}>SPECIAL CAMPUS CHALLENGES</Text>
      </View>

      <StatusBanner type="error" message={error} />

      {/* No Team State */}
      {!team ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Party Required for Bounties</Text>
          <Text style={styles.emptySub}>
            Join or form an adventuring party to unlock side quests and submit photo bounties.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/team')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Head to Party HQ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === cat && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Challenges List */}
          <View style={styles.listSection}>
            {filteredChallenges.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Bounties in Category</Text>
                <Text style={styles.emptySub}>
                  Switch category filters or check back later for new guild challenges.
                </Text>
              </View>
            ) : (
              filteredChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  onPress={(id) => router.push(`/challenge/${id}`)}
                />
              ))
            )}
          </View>
        </>
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
  subtitle: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  categoryScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  categoryPill: {
    backgroundColor: colors.bg.duskRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  categoryPillActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  categoryPillText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
  categoryPillTextActive: {
    color: colors.bg.dusk,
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
    marginBottom: spacing.xs,
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
});
