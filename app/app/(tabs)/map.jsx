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
import OverworldMap from '../../components/OverworldMap';
import api from '../../lib/api';
import { getCurrentLocation } from '../../lib/location';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function MapScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPin, setSelectedPin] = useState(null);

  const fetchMapData = useCallback(async () => {
    try {
      setError('');
      const [questRes, locRes] = await Promise.all([
        api.get('/quests/active'),
        getCurrentLocation(),
      ]);

      setData(questRes);
      if (locRes) setLocation(locRes);
    } catch (err) {
      setError(err.message || 'Failed to load atlas data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMapData();
  };

  const handleRecenter = async () => {
    const freshLoc = await getCurrentLocation();
    if (freshLoc) setLocation(freshLoc);
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
  const currentClue = quest?.currentClue;

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
        <Text style={styles.pixelTitle}>OVERWORLD ATLAS</Text>
        <Text style={styles.subtitle}>
          {quest ? quest.campus.toUpperCase() : 'CAMPUS EXPLORATION'}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* No Team State */}
      {!team ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Party Required</Text>
          <Text style={styles.emptySubtitle}>
            Join an adventuring party to activate waypoint beacons and radar on the campus map.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/team')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Party Headquarters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Stylized Pixel RPG Map Canvas */}
          <OverworldMap
            quest={quest}
            playerLocation={location}
            onRecenter={handleRecenter}
            onSelectCheckpoint={(cp) => setSelectedPin(cp)}
          />

          {/* Active Target Card */}
          {currentClue ? (
            <View style={styles.targetCard}>
              <View style={styles.targetHeader}>
                <View style={styles.targetBadge}>
                  <Text style={styles.targetBadgeText}>ACTIVE TARGET</Text>
                </View>
                <Text style={styles.targetPoints}>+{currentClue.points} PTS</Text>
              </View>

              <Text style={styles.targetTitle}>{currentClue.title}</Text>
              <Text style={styles.targetClue}>{currentClue.clue}</Text>

              <View style={styles.targetFooter}>
                <View style={styles.gpsRow}>
                  <MaterialCommunityIcons name="radar" size={16} color={colors.accent.gold} />
                  <Text style={styles.gpsText}>Search Radius: {currentClue.radius}m</Text>
                </View>

                <TouchableOpacity
                  style={styles.scanTargetButton}
                  onPress={() => router.push('/camera/scanner')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="qrcode-scan" size={16} color={colors.bg.dusk} />
                  <Text style={styles.scanTargetButtonText}>SCAN QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : quest?.isCompleted ? (
            <View style={styles.completedCard}>
              <Text style={styles.completedTitle}>🏆 REALM EXPLORED</Text>
              <Text style={styles.completedSub}>
                All {quest.totalCheckpoints} checkpoints have been deciphered and claimed.
              </Text>
            </View>
          ) : null}

          {/* Pin Inspector Modal / Detail (if pin selected) */}
          {selectedPin ? (
            <View style={styles.pinInspector}>
              <View style={styles.pinInspectorHeader}>
                <Text style={styles.pinInspectorTitle}>
                  Checkpoint #{selectedPin.order}: {selectedPin.title}
                </Text>
                <TouchableOpacity onPress={() => setSelectedPin(null)}>
                  <MaterialCommunityIcons name="close" size={18} color="#8E84B0" />
                </TouchableOpacity>
              </View>
              <Text style={styles.pinInspectorStatus}>
                {selectedPin.order < (quest?.currentOrder || 1)
                  ? '✅ Discovered & Cleared'
                  : selectedPin.order === (quest?.currentOrder || 1)
                  ? '🎯 Current Active Objective'
                  : '🔒 Locked (Clear previous checkpoint first)'}
              </Text>
            </View>
          ) : null}
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
  targetCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.goldDim,
    gap: spacing.xs,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  targetBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetBadgeText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  targetPoints: {
    ...typography.monoSm,
    color: colors.accent.gold,
    fontWeight: '800',
  },
  targetTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '700',
  },
  targetClue: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 20,
  },
  targetFooter: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#3D3560',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanTargetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scanTargetButtonText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
    letterSpacing: 0.8,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gpsText: {
    ...typography.monoSm,
    fontSize: 11,
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
  primaryButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
    width: '100%',
  },
  primaryButtonText: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
  completedCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.green,
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedTitle: {
    ...typography.headingLg,
    color: colors.accent.green,
  },
  completedSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  pinInspector: {
    backgroundColor: '#1E1A33',
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#4A4170',
    gap: 4,
  },
  pinInspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinInspectorTitle: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  pinInspectorStatus: {
    ...typography.bodyMd,
    color: colors.accent.gold,
  },
});
