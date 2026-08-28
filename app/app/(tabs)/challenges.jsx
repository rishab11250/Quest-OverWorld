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
  },
  pixelTitle: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.5,
    marginTop: 2,
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
  },
});
