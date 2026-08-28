import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OverworldMap from '../../components/OverworldMap';
import api from '../../lib/api';
import { getCurrentLocation } from '../../lib/location';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';

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
    return <LoadingScreen message="Aligning Atlas Cartography..." />;
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
          {quest ? quest.campus?.toUpperCase() : 'CAMPUS EXPLORATION'}
        </Text>
      </View>

      <StatusBanner type="error" message={error} />

      {/* No Team State */}
      {!team ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Party Required for Waypoints</Text>
          <Text style={styles.emptySubtitle}>
            Join or form an adventuring party to view waypoint radar and unlock secret coordinates.
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
        /* Map Component */
        <View style={styles.mapSection}>
          <OverworldMap
            checkpoints={quest?.checkpoints || []}
            userLocation={location}
            currentOrder={quest?.currentOrder || 1}
            onSelectPin={setSelectedPin}
            onRecenter={handleRecenter}
          />

          {/* Active Station Card below Map */}
          {currentClue ? (
            <View style={styles.clueCard}>
              <View style={styles.clueHeaderRow}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>STATION #{quest.currentOrder}</Text>
                </View>
                <Text style={styles.cluePoints}>+{currentClue.points || 100} PTS</Text>
              </View>

              <Text style={styles.clueTitle}>{currentClue.title}</Text>
              <Text style={styles.clueBody}>{currentClue.clue}</Text>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push('/camera/scanner')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.bg.dusk} />
                <Text style={styles.scanButtonText}>Scan Station QR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>All Stations Unlocked!</Text>
              <Text style={styles.emptySubtitle}>
                You have reached every mapped waypoint in this territory.
              </Text>
            </View>
          )}
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
    fontWeight: '800',
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
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  mapSection: {
    gap: spacing.md,
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
  },
  orderBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderBadgeText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.gold,
    fontSize: 10,
  },
  cluePoints: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontWeight: '700',
  },
  clueTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  clueBody: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 20,
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
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
});
