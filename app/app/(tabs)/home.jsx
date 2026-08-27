import { View, Text, StyleSheet, ScrollView } from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header / Brand */}
      <View style={styles.header}>
        <Text style={styles.pixelTitle}>QUEST OVERWORLD</Text>
        <Text style={styles.pixelSubtitle}>THEME & SYSTEM PREVIEW</Text>
      </View>

      {/* Points Counter Showcase */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>PARTY XP</Text>
        <Text style={styles.pointsValue}>+750 PTS</Text>
        <Text style={styles.levelBadge}>LVL 3</Text>
      </View>

      {/* Dialogue Box Showcase (DESIGN.md 5.2) */}
      <View style={styles.dialogueBox}>
        <Text style={styles.dialogueTitle}>CURRENT QUEST CLUE</Text>
        <Text style={styles.dialogueText}>
          Seek the oldest oak near the northern library tower. Behind the copper plaque lies the
          secret crest.
        </Text>
        <Text style={styles.monoCoords}>GPS: 28.5450° N, 77.1926° E</Text>
      </View>

      {/* Palette Swatches Showcase */}
      <Text style={styles.sectionHeader}>PALETTE TOKENS</Text>
      <View style={styles.paletteGrid}>
        <View style={[styles.swatch, { backgroundColor: colors.bg.duskRaised }]}>
          <Text style={styles.swatchText}>Dusk Raised</Text>
          <Text style={styles.swatchHex}>#2A2447</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: colors.accent.gold }]}>
          <Text style={[styles.swatchText, { color: colors.bg.dusk }]}>Gold</Text>
          <Text style={[styles.swatchHex, { color: colors.bg.dusk }]}>#F2C84B</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: colors.accent.green }]}>
          <Text style={[styles.swatchText, { color: colors.bg.dusk }]}>Green</Text>
          <Text style={[styles.swatchHex, { color: colors.bg.dusk }]}>#5FBF7A</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: colors.accent.coral }]}>
          <Text style={[styles.swatchText, { color: '#FFF' }]}>Coral</Text>
          <Text style={[styles.swatchHex, { color: '#FFF' }]}>#E8664B</Text>
        </View>
      </View>

      {/* Typography Scale Showcase */}
      <Text style={styles.sectionHeader}>TYPOGRAPHY SCALE</Text>
      <View style={styles.typeCard}>
        <Text style={styles.displayXlText}>Display XL (Nunito Bold 32)</Text>
        <Text style={styles.headingLgText}>Heading LG (Nunito Bold 22)</Text>
        <Text style={styles.headingMdText}>Heading MD (Nunito SemiBold 18)</Text>
        <Text style={styles.bodyLgText}>Body LG (Nunito Regular 16)</Text>
        <Text style={styles.bodyMdText}>Body MD (Nunito Regular 14)</Text>
        <Text style={styles.monoText}>Mono SM: QR_CHKP_9482_CAMPUS_NORTH</Text>
      </View>
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
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pixelTitle: {
    ...typography.displayPixel,
    fontSize: 16,
    color: colors.accent.gold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pixelSubtitle: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    letterSpacing: 2,
  },
  pointsCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.gold,
    marginBottom: spacing.xl,
  },
  pointsLabel: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    marginBottom: spacing.xs,
  },
  pointsValue: {
    ...typography.displayPixel,
    fontSize: 20,
    color: colors.accent.gold,
    marginVertical: spacing.xs,
  },
  levelBadge: {
    backgroundColor: colors.accent.gold,
    color: colors.bg.dusk,
    ...typography.displayPixel,
    fontSize: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  dialogueBox: {
    backgroundColor: colors.bg.parchment,
    borderRadius: 6,
    padding: spacing.cardPadding,
    borderWidth: 3,
    borderColor: '#D8CEA8',
    marginBottom: spacing.xl,
  },
  dialogueTitle: {
    ...typography.headingMd,
    color: colors.text.onLight.primary,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  dialogueText: {
    ...typography.bodyLg,
    color: colors.text.onLight.primary,
    marginBottom: spacing.md,
  },
  monoCoords: {
    ...typography.monoSm,
    color: colors.text.onLight.secondary,
  },
  sectionHeader: {
    ...typography.headingLg,
    color: colors.accent.gold,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  swatch: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: 6,
  },
  swatchText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  swatchHex: {
    ...typography.monoSm,
    color: colors.text.onDark.secondary,
    marginTop: spacing.xs,
  },
  typeCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  displayXlText: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
  },
  headingLgText: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  headingMdText: {
    ...typography.headingMd,
    color: colors.text.onDark.primary,
  },
  bodyLgText: {
    ...typography.bodyLg,
    color: colors.text.onDark.secondary,
  },
  bodyMdText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  monoText: {
    ...typography.monoSm,
    color: colors.accent.gold,
  },
});
