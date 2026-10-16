import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../lib/haptics';

/**
 * PixelCard - 8-Bit Gilded RPG Frame Container with GPU Spring Physics
 * Features authentic pixelated corner rivets, gilded double borders,
 * 3D tilt micro-interactions, and optional header ribbons.
 */
export default function PixelCard({
  children,
  style,
  variant = 'gold', // 'gold' | 'dusk' | 'parchment' | 'emerald' | 'elevated'
  headerRibbon = null,
  headerIcon = null,
  glow = false,
  interactive = false, // Enables 3D perspective tilt & spring physics
  onPress,
  ...props
}) {
  const { theme, isLight } = useTheme();
  const isGold = variant === 'gold';
  const isParchment = variant === 'parchment' || isLight;
  const isEmerald = variant === 'emerald';
  const isElevated = variant === 'elevated';

  // 3D Tilt & Spring Scale physics
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tiltXAnim = useRef(new Animated.Value(0)).current;
  const tiltYAnim = useRef(new Animated.Value(0)).current;
  const cardLayout = useRef({ width: 0, height: 0 }).current;

  const handleLayout = (e) => {
    cardLayout.width = e.nativeEvent.layout.width;
    cardLayout.height = e.nativeEvent.layout.height;
    if (props.onLayout) props.onLayout(e);
  };

  const handlePressIn = (e) => {
    if (!interactive && !onPress) return;
    triggerHaptic('light');

    if (interactive && cardLayout.width && cardLayout.height && e.nativeEvent?.locationX != null) {
      const centerX = cardLayout.width / 2;
      const centerY = cardLayout.height / 2;
      const diffX = (e.nativeEvent.locationX - centerX) / (centerX || 1);
      const diffY = (e.nativeEvent.locationY - centerY) / (centerY || 1);

      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0.98, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.spring(tiltXAnim, { toValue: -diffY * 5, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.spring(tiltYAnim, { toValue: diffX * 5, friction: 6, tension: 50, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.spring(scaleAnim, { toValue: 0.985, friction: 6, tension: 50, useNativeDriver: true }).start();
    }
  };

  const handlePressOut = () => {
    if (!interactive && !onPress) return;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      Animated.spring(tiltXAnim, { toValue: 0, friction: 5, tension: 40, useNativeDriver: true }),
      Animated.spring(tiltYAnim, { toValue: 0, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const getBackgroundColor = () => {
    if (isEmerald) return isLight ? '#EBF7EE' : 'rgba(95, 191, 122, 0.08)';
    if (isParchment) return theme?.bg?.card || colors.bg.parchment;
    if (isElevated) return theme?.bg?.surface || '#1E1933';
    if (isGold) return theme?.bg?.card || '#272044';
    return theme?.bg?.card || colors.bg.duskRaised;
  };

  const getBorderColor = () => {
    if (isGold) return theme?.border?.highlight || colors.accent.gold;
    if (isEmerald) return theme?.accent?.green || colors.accent.green;
    if (isElevated) return theme?.border?.active || '#4D4275';
    return theme?.border?.subtle || '#3D3560';
  };

  const cornerColor = isEmerald
    ? theme?.accent?.green || colors.accent.green
    : theme?.accent?.gold || colors.accent.gold;

  const rotateX = tiltXAnim.interpolate({
    inputRange: [-20, 20],
    outputRange: ['-20deg', '20deg'],
  });

  const rotateY = tiltYAnim.interpolate({
    inputRange: [-20, 20],
    outputRange: ['-20deg', '20deg'],
  });

  const cardContent = (
    <View
      style={[
        styles.card,
        style,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        glow && {
          shadowColor: theme?.accent?.gold || colors.accent.gold,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isLight ? 0.18 : 0.35,
          shadowRadius: 10,
          elevation: 6,
        },
      ]}
      onLayout={handleLayout}
      {...props}
    >
      {/* 8-Bit Pixel Gilded Corners */}
      <View style={[styles.corner, styles.cornerTL, { backgroundColor: cornerColor }]} />
      <View style={[styles.corner, styles.cornerTR, { backgroundColor: cornerColor }]} />
      <View style={[styles.corner, styles.cornerBL, { backgroundColor: cornerColor }]} />
      <View style={[styles.corner, styles.cornerBR, { backgroundColor: cornerColor }]} />

      {/* Optional Top Header Ribbon Banner */}
      {headerRibbon ? (
        <View style={styles.ribbonWrapper}>
          <View
            style={[
              styles.ribbonBadge,
              {
                backgroundColor: theme?.bg?.surface || '#151124',
                borderColor: isGold
                  ? theme?.accent?.gold || colors.accent.gold
                  : isEmerald
                    ? theme?.accent?.green || colors.accent.green
                    : theme?.border?.subtle || '#4A3E70',
              },
            ]}
          >
            <Text
              style={[
                styles.ribbonText,
                {
                  color: isGold
                    ? theme?.accent?.gold || colors.accent.gold
                    : isEmerald
                      ? theme?.accent?.green || colors.accent.green
                      : theme?.text?.secondary || colors.text.onDark.secondary,
                },
              ]}
            >
              [ {headerRibbon.toUpperCase()} ]
            </Text>
          </View>
        </View>
      ) : null}

      {children}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.tiltWrapper,
        {
          transform: [
            { perspective: 800 },
            { scale: scaleAnim },
            { rotateX },
            { rotateY },
          ],
        },
      ]}
    >
      {interactive || onPress ? (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressableRoot}
        >
          {cardContent}
        </Pressable>
      ) : (
        cardContent
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tiltWrapper: {
    width: '100%',
  },
  pressableRoot: {
    width: '100%',
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    position: 'relative',
    marginVertical: spacing.xs,
  },
  corner: {
    position: 'absolute',
    width: 6,
    height: 6,
    zIndex: 2,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopLeftRadius: 1,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopRightRadius: 1,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomLeftRadius: 1,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomRightRadius: 1,
  },
  ribbonWrapper: {
    position: 'absolute',
    top: -10,
    left: 16,
    zIndex: 10,
  },
  ribbonBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ribbonText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
