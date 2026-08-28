import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function DialogueBox({ speaker = 'CURRENT QUEST CLUE', text, footnote, style }) {
  return (
    <View style={[styles.container, style]}>
      {/* Corner Pixel Accents */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {/* Speaker / Badge Header */}
      {speaker ? (
        <View style={styles.speakerBadge}>
          <Text style={styles.speakerText}>{speaker}</Text>
        </View>
      ) : null}

      {/* Main Dialogue / Clue Content */}
      <Text style={styles.bodyText}>{text}</Text>

      {/* Footnote / Coordinates / Subtext */}
      {footnote ? <Text style={styles.footnoteText}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.parchment,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 2,
    borderColor: '#3D3560',
    position: 'relative',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: colors.accent.gold,
  },
  cornerTL: {
    top: -2,
    left: -2,
  },
  cornerTR: {
    top: -2,
    right: -2,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
  },
  speakerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.dusk,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 2,
  },
  speakerText: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.accent.gold,
  },
  bodyText: {
    ...typography.bodyLg,
    color: colors.text.onLight.primary,
    lineHeight: 24,
    fontWeight: '600',
  },
  footnoteText: {
    ...typography.monoSm,
    color: colors.text.onLight.secondary,
    marginTop: spacing.xs,
    fontSize: 12,
  },
});
