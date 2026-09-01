import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import { formatDistance, getDistanceInMeters, getBearingAndDirection } from '../lib/location';
import { triggerHaptic } from '../lib/haptics';
import { getTimeOfDayAtmosphere } from '../theme/atmosphere';

// Structured campus landmark zones linked directly to checkpoint sequence
const ZONE_ANCHORS = [
  { order: 1, name: 'NORTH QUAD', sub: 'Station 1 · Whispering Oak', icon: 'tree', x: 45, y: 35 },
  {
    order: 2,
    name: 'CLOCKTOWER PLAZA',
    sub: 'Station 2 · Western Steps',
    icon: 'clock-outline',
    x: 200,
    y: 110,
  },
  {
    order: 3,
    name: 'ALUMNI WATERS',
    sub: 'Station 3 · Fountain Rim',
    icon: 'water',
    x: 45,
    y: 220,
  },
  {
    order: 4,
    name: 'FOUNDERS GROUNDS',
    sub: 'Station 4 · Grand Vault',
    icon: 'pillar',
    x: 200,
    y: 295,
  },
];

export default function OverworldMap({
  checkpoints = [],
  currentClue = null,
  userLocation,
  currentOrder = 1,
  onSelectPin,
  onRecenter,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sonarAnim = useRef(new Animated.Value(0)).current;
  const atmosphere = getTimeOfDayAtmosphere();

  // Active Station Beacon Pulse Animation
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Sonar Radar Sweep Loop
  useEffect(() => {
    const sonarLoop = Animated.loop(
      Animated.timing(sonarAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    sonarLoop.start();
    return () => sonarLoop.stop();
  }, [sonarAnim]);

  // Find active checkpoint
  const activeCheckpoint =
    currentClue || checkpoints.find((c) => c.order === currentOrder) || checkpoints[0] || null;

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

  // Map checkpoints to structured nodes
  const nodesToRender = ZONE_ANCHORS.map((zone) => {
    const cpData = checkpoints.find((c) => c.order === zone.order) || {};
    return {
      ...zone,
      ...cpData,
      _id: cpData._id || `station-${zone.order}`,
      title: cpData.title || zone.name,
      order: zone.order,
      points: cpData.points || 100,
    };
  });

  // Player position dynamically follows path toward active station
  const activeNode = nodesToRender.find((n) => n.order === currentOrder) || nodesToRender[0];
  const prevNode = nodesToRender.find((n) => n.order === currentOrder - 1) || activeNode;
  const playerX = Math.round((prevNode.x + activeNode.x) / 2) + 20;
  const playerY = Math.round((prevNode.y + activeNode.y) / 2) + 15;

  const sonarScale = sonarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.2],
  });
  const sonarOpacity = sonarAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.8, 0.5, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: atmosphere.bgTint }]}>
      {/* Target Distance & Bearing HUD Bar */}
      <View style={styles.hudHeader}>
        <View style={styles.hudLeft}>
          {/* 8-Bit Compass Rose Dial */}
          <View style={styles.compassDial}>
            <View
              style={[
                styles.compassNeedle,
                { transform: [{ rotate: `${compassInfo?.bearing || 0}deg` }] },
              ]}
            >
              <View style={styles.compassNeedleNorth} />
              <View style={styles.compassNeedleSouth} />
            </View>
            <Text style={styles.compassDialN}>N</Text>
          </View>

          <View style={styles.hudTextContainer}>
            <Text style={styles.hudTargetText} numberOfLines={1} ellipsizeMode="tail">
              {activeCheckpoint
                ? `STATION #${currentOrder}: ${activeCheckpoint.title.toUpperCase()}`
                : 'ALL QUESTS CLEARED'}
            </Text>
            <Text style={styles.hudTargetSub}>
              {currentOrder <= 4 ? `Step ${currentOrder} of 4 Waypoints` : 'Campus Vault Unlocked'}
            </Text>
          </View>
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
              {targetDistance != null ? formatDistance(targetDistance) : 'RADAR LOCK'}
            </Text>
          </View>
        </View>
      </View>

      {/* Map Board */}
      <View style={[styles.mapBoard, { transform: [{ scale: zoomLevel }] }]}>
        {/* Topographic Coordinate Grid Lines */}
        <View style={styles.gridOverlay} />

        {/* Clean Sequential Quest Trail (1 -> 2 -> 3 -> 4) */}
        {/* Segment 1 -> 2 */}
        <View
          style={[
            styles.trailSegment,
            currentOrder > 1 ? styles.trailCleared : styles.trailActive,
            { top: 90, left: 54, width: 172, transform: [{ rotate: '25.8deg' }] },
          ]}
        />
        {/* Segment 2 -> 3 */}
        <View
          style={[
            styles.trailSegment,
            currentOrder > 2
              ? styles.trailCleared
              : currentOrder === 2
                ? styles.trailActive
                : styles.trailLocked,
            { top: 183, left: 45, width: 190, transform: [{ rotate: '-35.3deg' }] },
          ]}
        />
        {/* Segment 3 -> 4 */}
        <View
          style={[
            styles.trailSegment,
            currentOrder > 3
              ? styles.trailCleared
              : currentOrder === 3
                ? styles.trailActive
                : styles.trailLocked,
            { top: 275, left: 54, width: 172, transform: [{ rotate: '25.8deg' }] },
          ]}
        />

        {/* Station Nodes */}
        {nodesToRender.map((node) => {
          const isCleared = node.order < currentOrder;
          const isActive = node.order === currentOrder;
          const isLocked = node.order > currentOrder;

          return (
            <View key={node._id} style={[styles.nodeContainer, { left: node.x, top: node.y }]}>
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
                onPress={() => {
                  triggerHaptic('light');
                  if (onSelectPin) onSelectPin(node);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isCleared ? 'check-bold' : isActive ? node.icon : 'lock'}
                  size={16}
                  color={
                    isCleared ? colors.accent.green : isActive ? colors.accent.gold : '#5A527A'
                  }
                />
              </TouchableOpacity>

              {/* Node Tag & Order */}
              <View style={[styles.nodeCard, isActive && styles.nodeCardActive]}>
                <Text style={[styles.nodeOrderText, isActive && styles.nodeOrderTextActive]}>
                  #{node.order} · {node.name}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Player Adventurer Beacon with Live Sonar Sweep */}
        <View style={[styles.playerNode, { left: playerX, top: playerY }]}>
          {/* Animated Expanding Sonar Sweep */}
          <Animated.View
            style={[
              styles.sonarWave,
              {
                transform: [{ scale: sonarScale }],
                opacity: sonarOpacity,
              },
            ]}
          />
          <View style={styles.playerRadar} />
          <View style={styles.playerAvatar}>
            <MaterialCommunityIcons name="account" size={14} color="#FFF" />
          </View>
          <View style={styles.playerLabelPill}>
            <Text style={styles.playerLabelText}>YOU</Text>
          </View>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => {
            triggerHaptic('medium');
            if (onRecenter) onRecenter();
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.accent.gold} />
          <Text style={styles.controlText}>Recenter</Text>
        </TouchableOpacity>

        <View style={styles.zoomGroup}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => {
              triggerHaptic('light');
              setZoomLevel((z) => Math.min(z + 0.15, 1.3));
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => {
              triggerHaptic('light');
              setZoomLevel((z) => Math.max(z - 0.15, 0.85));
            }}
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
    backgroundColor: '#151126',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    overflow: 'hidden',
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#201A38',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#362E52',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.xs,
  },
  compassDial: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#161326',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compassDialN: {
    position: 'absolute',
    top: -2,
    fontSize: 6,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  compassNeedle: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassNeedleNorth: {
    width: 2,
    height: 6,
    backgroundColor: colors.accent.coral,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  compassNeedleSouth: {
    width: 2,
    height: 6,
    backgroundColor: '#6A628B',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  hudTextContainer: {
    flex: 1,
  },
  hudTargetText: {
    ...typography.captionBold,
    color: colors.accent.gold,
    letterSpacing: 0.8,
    fontSize: 11,
  },
  hudTargetSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.secondary,
    marginTop: 1,
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  bearingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  bearingArrow: {
    color: colors.accent.gold,
    fontSize: 11,
    fontWeight: '900',
  },
  bearingText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.accent.gold,
  },
  distanceBadge: {
    backgroundColor: '#2E274D',
    borderWidth: 1,
    borderColor: '#4A4170',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.text.onDark.primary,
  },
  mapBoard: {
    height: 350,
    position: 'relative',
    backgroundColor: '#120E22',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  trailSegment: {
    position: 'absolute',
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 1,
  },
  trailCleared: {
    borderColor: colors.accent.green,
    opacity: 0.9,
  },
  trailActive: {
    borderColor: colors.accent.gold,
    opacity: 1,
  },
  trailLocked: {
    borderColor: '#3D3560',
    opacity: 0.4,
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    width: 140,
    marginLeft: -50,
  },
  beaconRing: {
    position: 'absolute',
    top: -8,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    zIndex: 1,
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262040',
    borderWidth: 2,
    borderColor: '#4A4170',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pinCleared: {
    backgroundColor: 'rgba(62, 207, 142, 0.2)',
    borderColor: colors.accent.green,
  },
  pinActive: {
    backgroundColor: '#2D2350',
    borderColor: colors.accent.gold,
  },
  pinLocked: {
    backgroundColor: '#1E1933',
    borderColor: '#3D3560',
  },
  nodeCard: {
    backgroundColor: 'rgba(22, 19, 38, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
    marginTop: 4,
    zIndex: 2,
  },
  nodeCardActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.18)',
    borderColor: colors.accent.gold,
  },
  nodeOrderText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  nodeOrderTextActive: {
    color: colors.accent.gold,
    fontWeight: '900',
  },
  playerNode: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 15,
    marginLeft: -16,
    marginTop: -16,
  },
  sonarWave: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
    top: -14,
  },
  playerRadar: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.5)',
    top: -6,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E78D6',
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerLabelPill: {
    backgroundColor: '#161326',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#2E78D6',
  },
  playerLabelText: {
    ...typography.captionBold,
    fontSize: 8,
    color: '#FFF',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B1630',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#362E52',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlText: {
    ...typography.captionBold,
    color: colors.accent.gold,
  },
  zoomGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#262040',
    borderWidth: 1,
    borderColor: '#4A4170',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: colors.text.onDark.primary,
    fontWeight: '900',
    fontSize: 14,
  },
});
