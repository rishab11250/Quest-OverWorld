import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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

      const cached = await getLastKnownLocation();
      if (cached) setLocation(cached);

      const [questRes, locRes] = await Promise.all([
        api.get('/quests/active'),
        getCurrentLocation(),
      ]);

      setData(questRes);
      if (locRes) {
        setLocation(locRes);
        const currentClue = questRes?.quest?.currentClue;
        if (currentClue) {
          const matchedCp = questRes?.quest?.checkpoints?.find(
            (c) => c.order === questRes.quest.currentOrder
          );
          if (matchedCp) {
            const addr = await reverseGeocodeLocation(matchedCp.latitude, matchedCp.longitude);
            setAddress(addr);
          }
        } else if (locRes.latitude && locRes.longitude) {
          const addr = await reverseGeocodeLocation(locRes.latitude, locRes.longitude);
          setAddress(addr);
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
    let watcherSub = null;
    startLocationWatcher((freshCoords) => {
      setLocation(freshCoords);
    }).then((sub) => {
      watcherSub = sub;
    });

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
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 24) + 16 }]}
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
          {quest
            ? quest.campus?.toUpperCase()
            : team
              ? `PARTY ${team.name.toUpperCase()} · RADAR`
              : 'CAMPUS EXPLORATION'}
        </Text>
      </View>

      <StatusBanner type="error" message={error} />

      {/* Interactive Overworld GPS Map & Radar */}
      <View style={styles.mapSection}>
        <OverworldMap
          checkpoints={quest?.checkpoints || []}
          currentClue={currentClue}
          userLocation={location}
          currentOrder={quest?.currentOrder || 1}
          isCompleted={Boolean(quest?.isCompleted)}
          onSelectPin={setSelectedPin}
          onRecenter={handleRecenter}
        />
      </View>

      {/* Contextual Action & Clue Cards below Map */}
      {!team ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Party Required for Waypoints</Text>
          <Text style={styles.emptySubtitle}>
            Join or form an adventuring party to view waypoint radar and unlock secret coordinates.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              triggerHaptic('medium');
              router.push('/(tabs)/team');
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="account-group" size={18} color={colors.bg.dusk} />
            <Text style={styles.primaryButtonText}>Head to Party HQ</Text>
          </TouchableOpacity>
        </View>
      ) : !quest ? (
        <PixelCard variant="gold" glow style={styles.explorationCard}>
          <View style={styles.explorationHeaderRow}>
            <View style={styles.radarStatusTag}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.radarStatusText}>EXPLORATION RADAR ONLINE</Text>
            </View>
            <Text style={styles.teamBadgeText}>PARTY {team.name.toUpperCase()}</Text>
          </View>

          <Text style={styles.explorationTitle}>Perimeter Scanning Active</Text>
          <Text style={styles.explorationSubtitle}>
            Your party is standing by on the grid. No main quest event is active in this sector.
            Hunt side bounties or explore the campus perimeter.
          </Text>

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

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.bountyButton}
              onPress={() => {
                triggerHaptic('medium');
                router.push('/(tabs)/challenges');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="sword-cross" size={16} color={colors.bg.dusk} />
              <Text style={styles.bountyButtonText}>Hunt Side Bounties</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                triggerHaptic('light');
                router.push('/(tabs)/team');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="shield-account" size={16} color={colors.accent.gold} />
              <Text style={styles.secondaryButtonText}>Party HQ</Text>
            </TouchableOpacity>
          </View>
        </PixelCard>
      ) : quest?.isCompleted ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>All Stations Unlocked!</Text>
          <Text style={styles.emptySubtitle}>
            You have reached every mapped waypoint in this territory.
          </Text>
        </View>
      ) : (
        <PixelCard variant="gold" glow style={styles.clueCard}>
          <View style={styles.clueHeaderRow}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>
                STATION #{currentClue?.order || quest?.currentOrder || 1}
              </Text>
            </View>
            <Text style={styles.cluePoints}>+{currentClue?.points || 100} PTS</Text>
          </View>

          <Text style={styles.clueTitle}>
            {currentClue?.title ||
              (quest?.checkpoints && quest.checkpoints[0]?.title) ||
              'Active Waypoint'}
          </Text>
          <Text style={styles.clueBody}>
            {currentClue?.clue || 'Navigate to the waypoint beacon marked on your radar.'}
          </Text>

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
    ...typography.h2,
    color: colors.text.onDark.primary,
    letterSpacing: 1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.accent.gold,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  mapSection: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  explorationCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  explorationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radarStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(95, 191, 122, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.green,
  },
  radarStatusText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.accent.green,
    letterSpacing: 0.5,
  },
  teamBadgeText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.accent.gold,
  },
  explorationTitle: {
    ...typography.h3,
    color: colors.text.onDark.primary,
    marginTop: 2,
  },
  explorationSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.text.onDark.secondary,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bountyButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent.gold,
    paddingVertical: 12,
    borderRadius: 6,
  },
  bountyButtonText: {
    ...typography.button,
    color: colors.bg.dusk,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2A2347',
    borderWidth: 1,
    borderColor: '#4A3E70',
    paddingVertical: 12,
    borderRadius: 6,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.accent.gold,
    fontSize: 13,
  },
  clueCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  clueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  orderBadgeText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
    fontSize: 11,
  },
  cluePoints: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 13,
  },
  clueTitle: {
    ...typography.h3,
    color: colors.text.onDark.primary,
  },
  clueBody: {
    ...typography.body,
    color: colors.text.onDark.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 75, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addressText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontSize: 11,
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.gold,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  scanButtonText: {
    ...typography.button,
    color: colors.bg.dusk,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.onDark.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.bg.dusk,
    fontSize: 14,
  },
});
