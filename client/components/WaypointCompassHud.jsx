import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDistanceInMeters, formatDistance, getBearingAndDirection } from '../lib/location';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sound';
import { useTheme } from '../context/ThemeContext';
import colors from '../theme/colors';
import typography, { fonts } from '../theme/typography';
import spacing from '../theme/spacing';

/**
 * WaypointCompassHud - Real-Time Retro 8-Bit Compass Navigation HUD
 * Calculates relative bearing between device hardware compass heading and station GPS coordinates.
 */
export default function WaypointCompassHud({
  userLocation,
  deviceHeading = 0,
  targetLat,
  targetLng,
  targetTitle,
  onPress,
}) {
  const { theme, isLight } = useTheme();

  // Animated continuous needle angle
  const needleAnim = useRef(new Animated.Value(0)).current;
  const currentAngleRef = useRef(0);

  // Pulse animation for proximity
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Calculate Distance & Bearing
  const distance =
    userLocation?.latitude && targetLat
      ? getDistanceInMeters(
          userLocation.latitude,
          userLocation.longitude,
          targetLat,
          targetLng
        )
      : null;

  const compassInfo =
    userLocation?.latitude && targetLat
      ? getBearingAndDirection(
          userLocation.latitude,
          userLocation.longitude,
          targetLat,
          targetLng
        )
      : null;

  // Relative rotation angle (station bearing minus device heading)
  const bearing = compassInfo?.bearing ?? 0;
  const rawRelative = (bearing - (deviceHeading || 0) + 360) % 360;

  useEffect(() => {
    // Shortest-arc angle interpolation (prevents 360 wrap glitching)
    let diff = rawRelative - (currentAngleRef.current % 360);
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    const targetValue = currentAngleRef.current + diff;
    currentAngleRef.current = targetValue;

    Animated.spring(needleAnim, {
      toValue: targetValue,
      friction: 7,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [rawRelative, needleAnim]);

  // Proximity range status
  const isClose = distance != null && distance <= 25;
  const isNearby = distance != null && distance <= 80;

  useEffect(() => {
    if (isClose) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isClose, pulseAnim]);

  const handlePress = () => {
    playSound('radar');
    triggerHaptic('light');
    if (onPress) onPress();
  };

  const needleRotation = needleAnim.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ['-36000deg', '36000deg'],
  });

  const accentColor = isClose
    ? theme?.accent?.green || colors.accent.green
    : isNearby
      ? theme?.accent?.cyan || '#48CAE4'
      : theme?.accent?.gold || colors.accent.gold;

  return (
    <TouchableOpacity
      style={[
        styles.hudContainer,
        {
          backgroundColor: isLight ? '#FFFDF8' : theme?.bg?.surface || '#1C1630',
          borderColor: accentColor,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Left Column: Rotating Retro Compass Dial */}
      <View style={styles.dialWrapper}>
        <Animated.View
          style={[
            styles.dialBorder,
            {
              borderColor: accentColor,
              backgroundColor: isLight ? '#F2ECDF' : '#140F24',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {/* Cardinal direction indicators */}
          <Text style={[styles.cardinalN, { color: accentColor }]}>N</Text>
          <Text style={[styles.cardinalE, { color: theme?.text?.muted || '#7A729A' }]}>E</Text>
          <Text style={[styles.cardinalS, { color: theme?.text?.muted || '#7A729A' }]}>S</Text>
          <Text style={[styles.cardinalW, { color: theme?.text?.muted || '#7A729A' }]}>W</Text>

          {/* Compass Needle pointing toward waypoint */}
          <Animated.View
            style={[
              styles.needleContainer,
              {
                transform: [{ rotate: needleRotation }],
              },
            ]}
          >
            {/* North/Target pointing arrow */}
            <View style={[styles.needleArrow, { borderBottomColor: accentColor }]} />
            {/* South balance needle */}
            <View
              style={[
                styles.needleTail,
                { borderTopColor: isLight ? '#A09CAE' : '#4E456A' },
              ]}
            />
          </Animated.View>

          {/* Center Pivot Gem */}
          <View style={[styles.centerPivot, { backgroundColor: accentColor }]} />
        </Animated.View>
      </View>

      {/* Right Column: Distance, Heading & Proximity Telemetry */}
      <View style={styles.telemetryContent}>
        <View style={styles.headerRow}>
          <View style={styles.statusTagRow}>
            <View style={[styles.radarLed, { backgroundColor: accentColor }]} />
            <Text style={[styles.statusTagText, { color: accentColor }]}>
              {isClose
                ? 'TARGET IN SCAN RANGE'
                : isNearby
                  ? 'APPROACHING WAYPOINT'
                  : 'RADAR GUIDANCE HUD'}
            </Text>
          </View>

          <MaterialCommunityIcons name="open-in-new" size={12} color={theme?.text?.muted || '#7A729A'} />
        </View>

        {/* Real-time distance and cardinal angle */}
        <View style={styles.metricsRow}>
          <Text style={[styles.distanceValue, { color: theme?.text?.primary || '#FFFFFF' }]}>
            {distance != null ? formatDistance(distance) : '--'}
          </Text>
          <Text style={[styles.bearingMeta, { color: theme?.text?.secondary || '#A39BBF' }]}>
            {compassInfo ? `${compassInfo.direction} (${compassInfo.bearing}°)` : 'ACQUIRING GPS'}
          </Text>
        </View>

        {/* Target station hint */}
        <Text
          style={[styles.targetLabel, { color: theme?.text?.secondary || '#8A82A8' }]}
          numberOfLines={1}
        >
          {targetTitle ? `📍 ${targetTitle}` : 'Follow needle to waypoint'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1.5,
    marginVertical: spacing.xs,
    gap: spacing.md,
  },
  dialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardinalN: {
    position: 'absolute',
    top: 2,
    fontSize: 7,
    fontFamily: fonts.mono,
    fontWeight: '900',
  },
  cardinalE: {
    position: 'absolute',
    right: 3,
    fontSize: 6,
    fontFamily: fonts.mono,
    fontWeight: '700',
  },
  cardinalS: {
    position: 'absolute',
    bottom: 2,
    fontSize: 6,
    fontFamily: fonts.mono,
    fontWeight: '700',
  },
  cardinalW: {
    position: 'absolute',
    left: 3,
    fontSize: 6,
    fontFamily: fonts.mono,
    fontWeight: '700',
  },
  needleContainer: {
    width: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  needleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: 2,
  },
  centerPivot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  telemetryContent: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radarLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTagText: {
    fontSize: 7.5,
    fontFamily: fonts.pixel,
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  distanceValue: {
    ...typography.displayPixelSm,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  bearingMeta: {
    fontSize: 12,
    fontFamily: fonts.mono,
    fontWeight: '700',
  },
  targetLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    fontWeight: '600',
  },
});
