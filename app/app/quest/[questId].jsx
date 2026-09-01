import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import SubScreenHeader from '../../components/SubScreenHeader';
import StatusBanner from '../../components/StatusBanner';
import LoadingScreen from '../../components/LoadingScreen';
import DialogueBox from '../../components/DialogueBox';

export default function QuestDetailScreen() {
  const insets = useSafeAreaInsets();
  const { questId } = useLocalSearchParams();
  const router = useRouter();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchQuest = useCallback(async () => {
    if (!questId) return;
    try {
      setError('');
      const data = await api.get(`/quests/${questId}`);
      setQuest(data.quest);
    } catch (err) {
      setError(err.message || 'Failed to load quest.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [questId]);

  useEffect(() => {
    fetchQuest();
  }, [fetchQuest]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuest();
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Unrolling Quest Parchment..." />;
  }

  if (error || !quest) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Quest not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Return to Realm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent.gold}
        />
      }
    >
      <SubScreenHeader title="CAMPUS QUESTS" fallbackRoute="/(tabs)/home" />

      <View style={styles.header}>
        <Text style={styles.title}>{quest.name}</Text>
        <Text style={styles.campusBadge}>{quest.campus?.toUpperCase()}</Text>
      </View>

      <StatusBanner type="error" message={error} />

      <DialogueBox
        speaker="QUEST LOG"
        text={quest.description || 'Journey forth across landmarks to discover ancient lore.'}
      />

      {/* Checkpoints Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          WAYPOINT STATIONS ({quest.checkpoints?.length || 0})
        </Text>

        <View style={styles.checkpointList}>
          {quest.checkpoints?.map((cp, index) => (
            <View key={cp._id || index} style={styles.checkpointCard}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>#{cp.order || index + 1}</Text>
              </View>
              <View style={styles.checkpointInfo}>
                <Text style={styles.checkpointTitle}>{cp.title}</Text>
                <Text style={styles.checkpointClue}>{cp.clue}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+{cp.points || 100} PTS</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyLg,
    color: colors.accent.coral,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  backButtonText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  header: {
    gap: 6,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  title: {
    ...typography.displayPixelLg,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  campusBadge: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  checkpointList: {
    gap: spacing.xs,
  },
  checkpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    ...typography.displayPixelSm,
    color: colors.accent.gold,
  },
  checkpointInfo: {
    flex: 1,
  },
  checkpointTitle: {
    ...typography.bodyLgBold,
    color: colors.text.onDark.primary,
  },
  checkpointClue: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  pointsBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
  },
});
