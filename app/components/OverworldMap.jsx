import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import { formatDistance, getDistanceInMeters, getBearingAndDirection } from '../lib/location';

const MAP_SIZE = 420;

// Campus Landmarks for Overworld Grid Layout
const CAMPUS_ZONES = [
  { id: 'quad', name: 'NORTH QUAD', x: 80, y: 70, icon: 'tree' },
  { id: 'library', name: 'LIBRARY TOWER', x: 280, y: 80, icon: 'bookshelf' },
  { id: 'clocktower', name: 'CLOCKTOWER', x: 190, y: 190, icon: 'clock-outline' },
  { id: 'fountain', name: 'FOUNTAIN GROVE', x: 90, y: 290, icon: 'water' },
  { id: 'hall', name: 'FOUNDERS VAULT', x: 290, y: 300, icon: 'pillar' },
];

export default function OverworldMap({
  checkpoints = [],
  userLocation,
  currentOrder = 1,
  onSelectPin,
  onRecenter,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Beacon Pulse Animation
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Find active checkpoint
  const activeCheckpoint =
    checkpoints.find((c) => c.order === currentOrder) || checkpoints[0] || null;

  // Calculate distance & bearing between user and active target
  let targetDistance = null;
  let compassInfo = null;

  if (userLocation && activeCheckpoint) {
    targetDistance = getDistanceInMeters(
      userLocation.latitude,
      userLocation.longitude,
      activeCheckpoint.latitude || 28.5458,
      activeCheckpoint.longitude || 77.1926
    );

    compassInfo = getBearingAndDirection(
      userLocation.latitude,
      userLocation.longitude,
      activeCheckpoint.latitude || 28.5458,
      activeCheckpoint.longitude || 77.1926
    );
  }

  // Predefined grid anchors matching campus landmarks
  const DEFAULT_OFFSETS = [
    { x: 100, y: 90 },
    { x: 210, y: 180 },
    { x: 110, y: 280 },
    { x: 280, y: 300 },
  ];

  // Map checkpoints to render nodes
  const nodesToRender = (checkpoints.length > 0 ? checkpoints : DEFAULT_OFFSETS).map((cp, idx) => {
    const defaultPos = DEFAULT_OFFSETS[idx % DEFAULT_OFFSETS.length];
    return {
      _id: cp._id || `cp-${idx}`,
      order: cp.order || idx + 1,
      title: cp.title || `Waypoint #${idx + 1}`,
      x: defaultPos.x,
      y: defaultPos.y,
      latitude: cp.latitude,
      longitude: cp.longitude,
    };
  });

  const playerX = 150;
  const playerY = 170;

  return (
    <View style={styles.container}>
      {/* Target Distance & Bearing HUD Bar */}
      <View style={styles.hudHeader}>
        <View style={styles.hudLeft}>
          <MaterialCommunityIcons name="compass" size={18} color={colors.accent.gold} />
          <Text style={styles.hudTargetText} numberOfLines={1}>
            {activeCheckpoint ? activeCheckpoint.title.toUpperCase() : 'ALL CLEARED'}
          </Text>
        </View>

        <View style={styles.hudRight}>
          {compassInfo ? (
            <View style={styles.bearingBadge}>
              <Text style={styles.bearingArrow}>{compassInfo.arrow}</Text>
              <Text style={styles.bearingText}>{compassInfo.direction}</Text>
            </View>
          ) : null}

          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              {targetDistance != null ? formatDistance(targetDistance) : 'IN RANGE'}
            </Text>
          </View>
        </View>
      </View>

      {/* Map Board */}
      <View style={[styles.mapBoard, { transform: [{ scale: zoomLevel }] }]}>
        {/* Grid Lines */}
        <View style={styles.gridOverlay} />

        {/* Pathways */}
        <View
          style={[
            styles.pathway,
            { top: 95, left: 105, width: 110, transform: [{ rotate: '40deg' }] },
          ]}
        />
        <View
          style={[
            styles.pathway,
            { top: 220, left: 115, width: 100, transform: [{ rotate: '-45deg' }] },
          ]}
        />
        <View style={[styles.pathway, { top: 285, left: 130, width: 150 }]} />

        {/* Campus Landmark Zones */}
        {CAMPUS_ZONES.map((zone) => (
          <View key={zone.id} style={[styles.landmark, { left: zone.x, top: zone.y }]}>
            <MaterialCommunityIcons name={zone.icon} size={16} color="rgba(242, 200, 75, 0.4)" />
            <Text style={styles.landmarkText}>{zone.name}</Text>
          </View>
        ))}

        {/* Checkpoint Pins */}
        {nodesToRender.map((cp) => {
          const isCleared = cp.order < currentOrder;
          const isActive = cp.order === currentOrder;
          const isLocked = cp.order > currentOrder;

          return (
            <View
              key={cp._id || cp.order}
              style={[styles.checkpointNode, { left: cp.x, top: cp.y }]}
            >
              {/* Active Pulse Ring */}
              {isActive ? (
                <Animated.View
                  style={[
                    styles.beaconRing,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
              ) : null}

              {/* Pin Icon */}
              <TouchableOpacity
                style={[
                  styles.pinCircle,
                  isCleared && styles.pinCleared,
                  isActive && styles.pinActive,
                  isLocked && styles.pinLocked,
                ]}
                onPress={() => onSelectPin && onSelectPin(cp)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isCleared ? 'flag-checkered' : isActive ? 'shield-sword' : 'lock-outline'}
                  size={16}
                  color={
                    isCleared ? colors.accent.green : isActive ? colors.accent.gold : '#5A527A'
                  }
                />
              </TouchableOpacity>

              {/* Order Chip */}
              <View style={[styles.orderChip, isActive && styles.orderChipActive]}>
                <Text style={[styles.orderChipText, isActive && styles.orderChipTextActive]}>
                  #{cp.order}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Player Adventurer Token */}
        <View style={[styles.playerNode, { left: playerX, top: playerY }]}>
          <View style={styles.playerRadar} />
          <View style={styles.playerAvatar}>
            <MaterialCommunityIcons name="account-arrow-right" size={16} color="#FFF" />
          </View>
          <Text style={styles.playerLabel}>YOU</Text>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlBtn} onPress={onRecenter} activeOpacity={0.8}>
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.accent.gold} />
          <Text style={styles.controlText}>Recenter Radar</Text>
        </TouchableOpacity>

        <View style={styles.zoomGroup}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.min(z + 0.15, 1.3))}
            activeOpacity={0.8}
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
            activeOpacity={0.8}
          >
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161326',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    overflow: 'hidden',
    gap: spacing.xs,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#201A38',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#362E52',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  hudTargetText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.primary,
    letterSpacing: 1,
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bearingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  bearingArrow: {
    color: colors.accent.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  bearingText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontSize: 10,
    fontWeight: '900',
  },
  distanceBadge: {
    backgroundColor: '#2F2652',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontWeight: '900',
    fontSize: 10,
  },
  mapBoard: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#120F21',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0.5,
    borderColor: 'rgba(61, 53, 96, 0.4)',
  },
  pathway: {
    position: 'absolute',
    height: 3,
    backgroundColor: 'rgba(61, 53, 96, 0.6)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.3)',
  },
  landmark: {
    position: 'absolute',
    alignItems: 'center',
    opacity: 0.7,
  },
  landmarkText: {
    ...typography.caption,
    fontSize: 8,
    color: '#7E75A0',
    fontWeight: '800',
    marginTop: 2,
  },
  checkpointNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  beaconRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262040',
    borderWidth: 1.5,
    borderColor: '#4A4170',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinActive: {
    backgroundColor: '#322A54',
    borderColor: colors.accent.gold,
    borderWidth: 2,
  },
  pinCleared: {
    backgroundColor: 'rgba(95, 191, 122, 0.15)',
    borderColor: colors.accent.green,
  },
  pinLocked: {
    opacity: 0.6,
  },
  orderChip: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#1E1A33',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#4A4170',
  },
  orderChipActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  orderChipText: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '900',
    color: '#7E75A0',
  },
  orderChipTextActive: {
    color: colors.bg.dusk,
  },
  playerNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  playerRadar: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(90, 150, 240, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(90, 150, 240, 0.5)',
  },
  playerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3A70D6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  playerLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '900',
    color: '#8AB4F8',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#1E1A33',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#2B244A',
  },
  controlText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontWeight: '800',
    fontSize: 10,
  },
  zoomGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  zoomBtn: {
    width: 28,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#2B244A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: colors.accent.gold,
    fontWeight: '900',
    fontSize: 14,
  },
});
