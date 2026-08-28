import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogueBox from '../../components/DialogueBox';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function QuestDetailScreen() {
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
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  if (error || !quest) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.screenPadding }]}>
        <Text style={styles.errorText}>{error || 'Quest not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

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
      {/* Top Nav Back */}
      <TouchableOpacity
        style={styles.navBack}
        onPress={handleBack}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.7}
      >
        <Text style={styles.navBackText}>‹ BACK</Text>
      </TouchableOpacity>

      {/* Quest Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{quest.name}</Text>
        <Text style={styles.campus}>{quest.campus || 'Main Campus'}</Text>
      </View>

      {/* Quest Description Dialogue Box */}
      <DialogueBox
        speaker="QUEST OBJECTIVE"
        text={quest.description}
        footnote={`Total Bounty: ${quest.totalPoints || 0} PTS`}
      />

      {/* Checkpoints Checklist */}
      <View style={styles.checkpointsCard}>
        <Text style={styles.sectionTitle}>CHECKPOINT LOG</Text>

        <View style={styles.checkpointsList}>
          {quest.checkpoints?.map((cp, idx) => (
            <View key={cp._id || idx} style={styles.checkpointRow}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{cp.order || idx + 1}</Text>
              </View>
              <View style={styles.checkpointInfo}>
                <Text style={styles.checkpointTitle}>{cp.title}</Text>
                <Text style={styles.checkpointPoints}>+{cp.points} PTS</Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  navBack: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  navBackText: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  header: {
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
    marginBottom: spacing.xs,
  },
  campus: {
    ...typography.bodyMd,
    color: colors.accent.gold,
    fontWeight: '700',
  },
  errorText: {
    ...typography.bodyLg,
    color: colors.accent.coral,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 6,
  },
  backButtonText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
  checkpointsCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.text.onDark.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3560',
    paddingBottom: spacing.sm,
  },
  checkpointsList: {
    gap: spacing.md,
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3D3560',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  orderBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  checkpointInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkpointTitle: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  checkpointPoints: {
    ...typography.monoSm,
    color: colors.accent.gold,
    fontWeight: '700',
  },
});
