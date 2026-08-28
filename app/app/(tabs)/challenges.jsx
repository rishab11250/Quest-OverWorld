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

const CATEGORY_ICONS = {
  photo: 'camera',
  riddle: 'help-rhombus-outline',
  trivia: 'head-question-outline',
  creative: 'feather',
};

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
    return c.category.toUpperCase() === selectedCategory;
  });

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
        <Text style={styles.pixelTitle}>BOUNTY BOARD</Text>
        <Text style={styles.subtitle}>SPECIAL CAMPUS CHALLENGES</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Challenge List */}
      <View style={styles.listContainer}>
        {filteredChallenges.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bounties found in this category.</Text>
          </View>
        ) : (
          filteredChallenges.map((challenge) => {
            const submission = challenge.submission;
            const status = submission?.status;
            const iconName = CATEGORY_ICONS[challenge.category] || 'sword';

            return (
              <TouchableOpacity
                key={challenge._id}
                style={[
                  styles.challengeCard,
                  status === 'approved' && styles.cardApproved,
                  status === 'pending' && styles.cardPending,
                ]}
                onPress={() => router.push(`/challenge/${challenge._id}`)}
                activeOpacity={0.8}
              >
                {/* Category Icon + Header */}
                <View style={styles.cardTopRow}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons
                      name={iconName}
                      size={20}
                      color={colors.accent.gold}
                    />
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.challengeCategory}>
                      {challenge.category.toUpperCase()}
                    </Text>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  </View>

                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>+{challenge.points}</Text>
                  </View>
                </View>

                {/* Description Preview */}
                <Text style={styles.challengeDescription} numberOfLines={2}>
                  {challenge.description}
                </Text>

                {/* Status Footer Pill */}
                <View style={styles.cardFooter}>
                  {status === 'approved' ? (
                    <View style={[styles.statusPill, styles.statusApproved]}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#FFF" />
                      <Text style={styles.statusTextApproved}>CLAIMED (+{challenge.points} PTS)</Text>
                    </View>
                  ) : status === 'pending' ? (
                    <View style={[styles.statusPill, styles.statusPending]}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={colors.bg.dusk} />
                      <Text style={styles.statusTextPending}>UNDER REVIEW</Text>
                    </View>
                  ) : status === 'rejected' ? (
                    <View style={[styles.statusPill, styles.statusRejected]}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color="#FFF" />
                      <Text style={styles.statusTextRejected}>RESUBMIT SOLUTION</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusPill, styles.statusAvailable]}>
                      <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.accent.gold} />
                      <Text style={styles.statusTextAvailable}>OPEN BOUNTY</Text>
                    </View>
                  )}

                  <Text style={styles.actionPrompt}>View Details ›</Text>
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
  categoryScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryChip: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  categoryChipActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
    letterSpacing: 0.8,
  },
  categoryChipTextActive: {
    color: colors.bg.dusk,
  },
  listContainer: {
    gap: spacing.md,
  },
  challengeCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 10,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  cardApproved: {
    borderColor: 'rgba(95, 191, 122, 0.4)',
  },
  cardPending: {
    borderColor: 'rgba(242, 200, 75, 0.4)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  challengeCategory: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    fontSize: 10,
    letterSpacing: 1,
  },
  challengeTitle: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  pointsBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pointsBadgeText: {
    ...typography.monoSm,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  challengeDescription: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#362E52',
    paddingTop: spacing.xs,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: colors.accent.green,
  },
  statusTextApproved: {
    ...typography.caption,
    fontWeight: '800',
    color: '#FFF',
    fontSize: 10,
  },
  statusPending: {
    backgroundColor: colors.accent.gold,
  },
  statusTextPending: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.bg.dusk,
    fontSize: 10,
  },
  statusRejected: {
    backgroundColor: colors.accent.coral,
  },
  statusTextRejected: {
    ...typography.caption,
    fontWeight: '800',
    color: '#FFF',
    fontSize: 10,
  },
  statusAvailable: {
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: colors.accent.goldDim,
  },
  statusTextAvailable: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    fontSize: 10,
  },
  actionPrompt: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.accent.gold,
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
