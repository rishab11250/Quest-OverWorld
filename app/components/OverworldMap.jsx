import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import { formatDistance, getDistanceInMeters, getBearingAndDirection } from '../lib/location';
import { triggerHaptic } from '../lib/haptics';
import { getTimeOfDayAtmosphere } from '../theme/atmosphere';

const MAP_WIDTH = 320;
const MAP_HEIGHT = 340;
const MAP_CENTER_X = MAP_WIDTH / 2;
const MAP_CENTER_Y = MAP_HEIGHT / 2;

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
        duration: 2800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    sonarLoop.start();
    return () => sonarLoop.stop();
  }, [sonarAnim]);

  const hasCheckpoints = Array.isArray(checkpoints) && checkpoints.length > 0;

  // Active target checkpoint
  const activeCheckpoint =
    currentClue ||
    (hasCheckpoints ? checkpoints.find((c) => c.order === currentOrder) || checkpoints[0] : null);

  // Calculate distance & bearing between user and active target
  let targetDistance = null;
  let compassInfo = null;

  if (userLocation?.latitude && activeCheckpoint?.latitude) {
    targetDistance = getDistanceInMeters(
      userLocation.latitude,
      userLocation.longitude,
      activeCheckpoint.latitude,
      activeCheckpoint.longitude
    );

    compassInfo = getBearingAndDirection(
      userLocation.latitude,
      userLocation.longitude,
      activeCheckpoint.latitude,
      activeCheckpoint.longitude
    );
  }

  // Dynamic GPS Projection: Project real lat/lng coordinates onto canvas
  const nodesToRender = [];
  let playerCanvasX = MAP_CENTER_X;
  let playerCanvasY = MAP_CENTER_Y;

  if (hasCheckpoints) {
    const validPoints = checkpoints.filter((cp) => cp.latitude && cp.longitude);
    const allLats = validPoints.map((p) => p.latitude);
    const allLngs = validPoints.map((p) => p.longitude);

    if (userLocation?.latitude) {
      allLats.push(userLocation.latitude);
      allLngs.push(userLocation.longitude);
    }

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const latSpan = Math.max(maxLat - minLat, 0.001);
    const lngSpan = Math.max(maxLng - minLng, 0.001);

    const PADDING_X = 50;
    const PADDING_Y = 50;
    const USABLE_W = MAP_WIDTH - PADDING_X * 2;
    const USABLE_H = MAP_HEIGHT - PADDING_Y * 2;

    checkpoints.forEach((cp, idx) => {
      let x = MAP_CENTER_X;
      let y = MAP_CENTER_Y;

      if (cp.latitude && cp.longitude) {
        x = PADDING_X + ((cp.longitude - minLng) / lngSpan) * USABLE_W;
        y = MAP_HEIGHT - PADDING_Y - ((cp.latitude - minLat) / latSpan) * USABLE_H;
      } else {
        // Fallback evenly distributed if coordinates are pending
        x = PADDING_X + (idx / Math.max(checkpoints.length - 1, 1)) * USABLE_W;
        y = PADDING_Y + (idx / Math.max(checkpoints.length - 1, 1)) * USABLE_H;
      }

      nodesToRender.push({
        ...cp,
        _id: cp._id || `station-${cp.order || idx + 1}`,
        title: cp.title || `Station ${cp.order || idx + 1}`,
        order: cp.order || idx + 1,
        points: cp.points || 100,
        x: Math.round(x),
        y: Math.round(y),
      });
    });

    if (userLocation?.latitude) {
      playerCanvasX = Math.round(
        PADDING_X + ((userLocation.longitude - minLng) / lngSpan) * USABLE_W
      );
      playerCanvasY = Math.round(
        MAP_HEIGHT - PADDING_Y - ((userLocation.latitude - minLat) / latSpan) * USABLE_H
      );
    }
  }

  const sonarScale = sonarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.4],
  });
  const sonarOpacity = sonarAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.85, 0.5, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: atmosphere.bgTint }]}>
      {/* Target Distance & Bearing HUD Bar */}
      <View style={styles.hudHeader}>
        <View style={styles.hudLeft}>
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
                : 'OVERWORLD EXPLORATION RADAR'}
            </Text>
            <Text style={styles.hudTargetSub}>
              {hasCheckpoints
                ? `Step ${currentOrder} of ${checkpoints.length} Waypoints`
                : userLocation
                  ? `${userLocation.latitude.toFixed(4)}° N, ${userLocation.longitude.toFixed(4)}° E`
                  : 'Acquiring GPS Telemetry...'}
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
              {targetDistance != null ? formatDistance(targetDistance) : 'RADAR ACTIVE'}
            </Text>
          </View>
        </View>
      </View>

      {/* Map Board */}
      <View style={[styles.mapBoard, { transform: [{ scale: zoomLevel }] }]}>
        {/* Topographic Coordinate Grid Lines */}
        <View style={styles.gridOverlay} />

        {/* Concentric Radar Rings in Free Exploration Mode */}
        {!hasCheckpoints ? (
          <View style={styles.radarRingWrapper} pointerEvents="none">
            <View style={[styles.staticRadarRing, { width: 90, height: 90, borderRadius: 45 }]} />
            <View style={[styles.staticRadarRing, { width: 180, height: 180, borderRadius: 90 }]} />
            <View
              style={[styles.staticRadarRing, { width: 270, height: 270, borderRadius: 135 }]}
            />
            <View style={styles.radarCrosshairH} />
            <View style={styles.radarCrosshairV} />
          </View>
        ) : null}

        {/* Real Station Nodes Rendered from GPS Data */}
        {nodesToRender.map((node) => {
          const isCleared = node.order < currentOrder;
          const isActive = node.order === currentOrder;
          const isLocked = node.order > currentOrder;

          return (
            <View key={node._id} style={[styles.nodeContainer, { left: node.x, top: node.y }]}>
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
                  name={isCleared ? 'check-bold' : isActive ? 'map-marker-radius' : 'lock'}
                  size={16}
                  color={
                    isCleared ? colors.accent.green : isActive ? colors.accent.gold : '#5A527A'
                  }
                />
              </TouchableOpacity>

              <View style={[styles.nodeCard, isActive && styles.nodeCardActive]}>
                <Text style={[styles.nodeOrderText, isActive && styles.nodeOrderTextActive]}>
                  #{node.order} · {node.title}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Live Player Adventurer Beacon */}
        <View style={[styles.playerNode, { left: playerCanvasX, top: playerCanvasY }]}>
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
          <Text style={styles.controlText}>Recenter GPS</Text>
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
    borderColor: '#4A4070',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  distanceText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.text.onDark.primary,
    letterSpacing: 0.5,
  },
  mapBoard: {
    height: MAP_HEIGHT,
    backgroundColor: '#110D20',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(90, 82, 122, 0.12)',
  },
  radarRingWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticRadarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.12)',
    borderStyle: 'dashed',
  },
  radarCrosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(90, 82, 122, 0.15)',
  },
  radarCrosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(90, 82, 122, 0.15)',
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
    marginLeft: -40,
    marginTop: -20,
  },
  pinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2345',
    borderWidth: 2,
    borderColor: '#4E4473',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  pinActive: {
    backgroundColor: '#3D3014',
    borderColor: colors.accent.gold,
    borderWidth: 2.5,
  },
  pinCleared: {
    backgroundColor: '#163322',
    borderColor: colors.accent.green,
  },
  pinLocked: {
    backgroundColor: '#1E1933',
    borderColor: '#3D3560',
    opacity: 0.7,
  },
  beaconRing: {
    position: 'absolute',
    top: -6,
    left: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(242, 200, 75, 0.5)',
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    zIndex: 2,
  },
  nodeCard: {
    backgroundColor: 'rgba(21, 17, 38, 0.92)',
    borderWidth: 1,
    borderColor: '#3D3560',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    maxWidth: 90,
  },
  nodeCardActive: {
    borderColor: colors.accent.gold,
    backgroundColor: '#251E0E',
  },
  nodeOrderText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  nodeOrderTextActive: {
    color: colors.accent.gold,
    fontWeight: '700',
  },
  playerNode: {
    position: 'absolute',
    alignItems: 'center',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 10,
  },
  playerRadar: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(74, 144, 226, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.4)',
  },
  sonarWave: {
    position: 'absolute',
    top: -15,
    left: -15,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 144, 226, 0.8)',
    zIndex: 1,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#357ABD',
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playerLabelPill: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 3,
    zIndex: 11,
  },
  playerLabelText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1935',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#362E52',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A2347',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A3E70',
  },
  controlText: {
    ...typography.captionBold,
    fontSize: 11,
    color: colors.accent.gold,
  },
  zoomGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#2A2347',
    borderWidth: 1,
    borderColor: '#4A3E70',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.accent.gold,
    lineHeight: 18,
  },
});
