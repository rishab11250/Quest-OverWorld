import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import { formatDistance, getDistanceInMeters } from '../lib/location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  quest,
  playerLocation,
  onRecenter,
  onSelectCheckpoint,
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

  const currentClue = quest?.currentClue;
  const currentOrder = quest?.currentOrder || 1;

  // Calculate distance between player and active target
  let targetDistance = null;
  if (playerLocation && currentClue) {
    targetDistance = getDistanceInMeters(
      playerLocation.latitude,
      playerLocation.longitude,
      playerLocation.latitude + 0.0003, // sample offset relative to active checkpoint
      playerLocation.longitude + 0.0002
    );
  }

  // Define checkpoint map coordinates based on order
  const CHECKPOINT_COORDS = [
    { order: 1, x: 100, y: 90, title: 'The Whispering Oak' },
    { order: 2, x: 210, y: 180, title: 'Clocktower Steps' },
    { order: 3, x: 110, y: 280, title: 'Alumni Fountain' },
    { order: 4, x: 280, y: 300, title: 'Founders Vault' },
  ];

  // Map Player marker position
  const playerX = 140;
  const playerY = 160;

  return (
    <View style={styles.container}>
      {/* Target Distance HUD Bar */}
      <View style={styles.hudHeader}>
        <View style={styles.hudLeft}>
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.accent.gold} />
          <Text style={styles.hudTargetText}>
            {currentClue ? currentClue.title.toUpperCase() : 'ALL CLEARED'}
          </Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {targetDistance ? `📍 ${formatDistance(targetDistance)}` : '📍 IN RANGE'}
          </Text>
        </View>
      </View>

      {/* Map Board */}
      <View style={[styles.mapBoard, { transform: [{ scale: zoomLevel }] }]}>
        {/* Grid Lines */}
        <View style={styles.gridOverlay} />

        {/* Pathways */}
        <View style={[styles.pathway, { top: 95, left: 105, width: 110, transform: [{ rotate: '40deg' }] }]} />
        <View style={[styles.pathway, { top: 220, left: 115, width: 100, transform: [{ rotate: '-45deg' }] }]} />
        <View style={[styles.pathway, { top: 285, left: 130, width: 150 }]} />

        {/* Campus Landmark Zones */}
        {CAMPUS_ZONES.map((zone) => (
          <View key={zone.id} style={[styles.landmark, { left: zone.x, top: zone.y }]}>
            <MaterialCommunityIcons name={zone.icon} size={16} color="rgba(242, 200, 75, 0.4)" />
            <Text style={styles.landmarkText}>{zone.name}</Text>
          </View>
        ))}

        {/* Checkpoint Pins */}
        {CHECKPOINT_COORDS.map((cp) => {
          const isCleared = cp.order < currentOrder;
          const isActive = cp.order === currentOrder;
          const isLocked = cp.order > currentOrder;

          return (
            <View key={cp.order} style={[styles.checkpointNode, { left: cp.x, top: cp.y }]}>
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
                onPress={() => onSelectCheckpoint && onSelectCheckpoint(cp)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={
                    isCleared
                      ? 'flag-checkered'
                      : isActive
                      ? 'shield-sword'
                      : 'lock-outline'
                  }
                  size={16}
                  color={
                    isCleared
                      ? colors.accent.green
                      : isActive
                      ? colors.accent.gold
                      : '#5A527A'
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
            <MaterialCommunityIcons name="navigation" size={14} color="#FFF" style={styles.navArrow} />
          </View>
          <View style={styles.playerLabel}>
            <Text style={styles.playerLabelText}>YOU</Text>
          </View>
        </View>
      </View>

      {/* Map Floating Zoom & Recenter Controls */}
      <View style={styles.controlsOverlay}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoomLevel((z) => Math.min(z + 0.15, 1.3))}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.accent.gold} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="minus" size={20} color={colors.accent.gold} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.recenterButton]}
          onPress={onRecenter}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="crosshairs" size={20} color={colors.bg.dusk} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: spacing.xs,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1830',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3560',
    zIndex: 10,
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
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  distanceBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  distanceText: {
    ...typography.monoSm,
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  mapBoard: {
    width: '100%',
    height: MAP_SIZE,
    backgroundColor: '#161324',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  pathway: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#27203E',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#362E52',
  },
  landmark: {
    position: 'absolute',
    alignItems: 'center',
    opacity: 0.7,
  },
  landmarkText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#8E84B0',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  checkpointNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
  },
  beaconRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#251F3D',
    borderWidth: 1.5,
    borderColor: '#4A4170',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCleared: {
    borderColor: colors.accent.green,
    backgroundColor: 'rgba(95, 191, 122, 0.15)',
  },
  pinActive: {
    borderColor: colors.accent.gold,
    backgroundColor: '#382D16',
    borderWidth: 2,
  },
  pinLocked: {
    opacity: 0.5,
  },
  orderChip: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#1E1A33',
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  orderChipActive: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.accent.gold,
  },
  orderChipText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8E84B0',
  },
  orderChipTextActive: {
    color: colors.bg.dusk,
  },
  playerNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
  },
  playerRadar: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
  },
  playerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrow: {
    transform: [{ rotate: '45deg' }],
  },
  playerLabel: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  playerLabelText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FFF',
  },
  controlsOverlay: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
    zIndex: 10,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#251F3D',
    borderWidth: 1,
    borderColor: '#4A4170',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  recenterButton: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
});
