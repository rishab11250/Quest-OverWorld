import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';

/**
 * PixelCard - 8-Bit Gilded RPG Frame Container
 * Features authentic pixelated corner rivets, gilded double borders,
 * and optional header ribbons with full dynamic theme support.
 */
export default function PixelCard({
  children,
  style,
  variant = 'gold', // 'gold' | 'dusk' | 'parchment' | 'emerald' | 'elevated'
  headerRibbon = null,
  headerIcon = null,
  glow = false,
  ...props
}) {
  const { theme, isLight } = useTheme();
  const isGold = variant === 'gold';
  const isParchment = variant === 'parchment' || isLight;
  const isEmerald = variant === 'emerald';
  const isElevated = variant === 'elevated';

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

  return (
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
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    position: 'relative',
    gap: spacing.xs,
  },
  cardGold: {
    backgroundColor: '#272044',
    borderColor: colors.accent.gold,
  },
  cardParchment: {
    backgroundColor: colors.bg.parchment,
    borderColor: '#3D3560',
  },
  cardEmerald: {
    backgroundColor: 'rgba(95, 191, 122, 0.08)',
    borderColor: colors.accent.green,
  },
  cardElevated: {
    backgroundColor: '#1E1933',
    borderColor: '#4D4275',
  },
  cardGlow: {
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  corner: {
    position: 'absolute',
    width: 4,
    height: 4,
    zIndex: 10,
  },
  cornerTL: {
    top: -1.5,
    left: -1.5,
  },
  cornerTR: {
    top: -1.5,
    right: -1.5,
  },
  cornerBL: {
    bottom: -1.5,
    left: -1.5,
  },
  cornerBR: {
    bottom: -1.5,
    right: -1.5,
  },
  ribbonWrapper: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ribbonBadge: {
    backgroundColor: '#151124',
    borderWidth: 1,
    borderColor: '#4A3E70',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ribbonGold: {
    borderColor: 'rgba(242, 200, 75, 0.4)',
    backgroundColor: 'rgba(242, 200, 75, 0.1)',
  },
  ribbonEmerald: {
    borderColor: 'rgba(95, 191, 122, 0.4)',
    backgroundColor: 'rgba(95, 191, 122, 0.1)',
  },
  ribbonText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.text.onDark.secondary,
    letterSpacing: 1,
  },
  ribbonTextGold: {
    color: colors.accent.gold,
  },
  ribbonTextEmerald: {
    color: colors.accent.green,
  },
});
