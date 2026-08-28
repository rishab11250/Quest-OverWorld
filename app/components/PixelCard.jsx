import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

export default function PixelCard({
  children,
  style,
  variant = 'gold', // 'gold' | 'dusk' | 'parchment'
  glow = false,
}) {
  const isGold = variant === 'gold';
  const isParchment = variant === 'parchment';

  return (
    <View
      style={[
        styles.card,
        isGold && styles.cardGold,
        isParchment && styles.cardParchment,
        glow && styles.cardGlow,
        style,
      ]}
    >
      {/* 8-Bit Pixel Notched Corners */}
      <View style={[styles.corner, styles.cornerTL, isParchment && styles.cornerDark]} />
      <View style={[styles.corner, styles.cornerTR, isParchment && styles.cornerDark]} />
      <View style={[styles.corner, styles.cornerBL, isParchment && styles.cornerDark]} />
      <View style={[styles.corner, styles.cornerBR, isParchment && styles.cornerDark]} />

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
  cardGlow: {
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: colors.accent.gold,
    zIndex: 10,
  },
  cornerDark: {
    backgroundColor: colors.bg.dusk,
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
});
