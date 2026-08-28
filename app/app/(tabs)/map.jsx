import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OverworldMap from '../../components/OverworldMap';
import api from '../../lib/api';
import {
  getCurrentLocation,
  getLastKnownLocation,
  startLocationWatcher,
  reverseGeocodeLocation,
} from '../../lib/location';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import PixelCard from '../../components/PixelCard';
import { triggerHaptic } from '../../lib/haptics';

export default function MapScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPin, setSelectedPin] = useState(null);

  const fetchMapData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setError('');

      // 1. Fast cache fetch for immediate position
      const cached = await getLastKnownLocation();
      if (cached) setLocation(cached);

      // 2. Fetch quest data & accurate GPS in parallel
      const [questRes, locRes] = await Promise.all([
        api.get('/quests/active'),
        getCurrentLocation(),
      ]);

      setData(questRes);
      if (locRes) {
        setLocation(locRes);
        // Reverse geocode active station if available
        const currentClue = questRes?.quest?.currentClue;
        if (currentClue) {
          const matchedCp = questRes?.quest?.checkpoints?.find(
            (c) => c.order === questRes.quest.currentOrder
          );
          if (matchedCp) {
            const addr = await reverseGeocodeLocation(matchedCp.latitude, matchedCp.longitude);
            setAddress(addr);
          }
        }
      }
    } catch (err) {
      if (!isSilent) setError(err.message || 'Failed to load atlas data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMapData(true);
    }, [fetchMapData])
  );

  useEffect(() => {
    // Start live GPS stream subscription
    let watcherSub = null;
    startLocationWatcher((freshCoords) => {
      setLocation(freshCoords);
    }).then((sub) => {
      watcherSub = sub;
    });

    // Cleanup watcher on screen unmount
    return () => {
      if (watcherSub && typeof watcherSub.remove === 'function') {
        watcherSub.remove();
      }
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMapData(false);
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
            currentClue={currentClue}
            userLocation={location}
            currentOrder={quest?.currentOrder || 1}
            onSelectPin={setSelectedPin}
            onRecenter={handleRecenter}
          />

          {/* Active Station Card below Map */}
          {currentClue ? (
            <PixelCard variant="gold" glow style={styles.clueCard}>
              <View style={styles.clueHeaderRow}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>STATION #{quest.currentOrder}</Text>
                </View>
                <Text style={styles.cluePoints}>+{currentClue.points || 100} PTS</Text>
              </View>

              <Text style={styles.clueTitle}>{currentClue.title}</Text>
              <Text style={styles.clueBody}>{currentClue.clue}</Text>

              {address ? (
                <View style={styles.addressRow}>
                  <MaterialCommunityIcons
                    name="map-marker-radius"
                    size={14}
                    color={colors.accent.gold}
                  />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {address}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => {
                  triggerHaptic('medium');
                  router.push('/camera/scanner');
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.bg.dusk} />
                <Text style={styles.scanButtonText}>Scan Station QR</Text>
              </TouchableOpacity>
            </PixelCard>
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
    ...typography.displayPixelSm,
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
    paddingVertical: 3,
    borderRadius: 4,
  },
  orderBadgeText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 9,
  },
  cluePoints: {
    ...typography.displayPixelSm,
    color: colors.accent.gold,
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1A33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  addressText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontSize: 11,
    fontWeight: '700',
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
});
