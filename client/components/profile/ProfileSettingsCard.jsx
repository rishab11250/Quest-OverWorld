import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { useTour } from '../../context/TourContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileSettingsCard({
  highAccuracyGps,
  onToggleGps,
  autoTorch,
  onToggleTorch,
  livePolling,
  onTogglePolling,
  hapticFeedback,
  onToggleHaptic,
  soundEffects,
  onToggleSound,
  cacheCleared,
  onClearCache,
  onOpenGuide,
}) {
  const { activeTourTarget } = useTour() || {};
  const { themeId, setThemeId, palettes, theme, isLight } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.bg.card, borderColor: theme.border.subtle }]}>
      <Text style={[styles.cardHeader, { color: theme.accent.gold }]}>EXPEDITION SETTINGS</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>Interactive App Walkthrough</Text>
          <Text style={[styles.settingSub, { color: theme.text.secondary }]}>Page-by-page tour explaining each button</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.guideBtn,
            { backgroundColor: theme.accent.gold },
            activeTourTarget === 'profile_tour' && styles.tourTargetGlow,
          ]}
          onPress={onOpenGuide}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="compass-outline" size={14} color={isLight ? '#1E1A33' : theme.bg.dusk} />
          <Text style={[styles.guideBtnText, { color: isLight ? '#1E1A33' : theme.bg.dusk }]}>START TOUR</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

      {/* 8-Bit Palette Switcher (#9) */}
      <View style={{ gap: 8 }}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>8-Bit Realm Palette</Text>
          <Text style={[styles.settingSub, { color: theme.text.secondary }]}>Switch global retro theme colors</Text>
        </View>

        <View style={styles.paletteRow}>
          {Object.values(palettes).map((p) => {
            const isSelected = themeId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.paletteBtn,
                  {
                    backgroundColor: isSelected
                      ? isLight
                        ? '#FFF4D6'
                        : 'rgba(242, 200, 75, 0.12)'
                      : theme.bg.surface,
                    borderColor: isSelected ? theme.accent.gold : theme.border.subtle,
                  },
                ]}
                onPress={() => setThemeId(p.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.paletteDot, { backgroundColor: p.accent.gold }]} />
                <Text
                  style={[
                    styles.paletteBtnText,
                    { color: isSelected ? theme.accent.gold : theme.text.secondary },
                  ]}
                  numberOfLines={1}
                >
                  {p.isLight ? '☀️ Light' : p.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>High-Precision Radar</Text>
          <Text style={[styles.settingSub, { color: theme.text.secondary }]}>Sub-meter GPS accuracy for waypoints</Text>
        </View>
        <Switch
          value={highAccuracyGps}
          onValueChange={onToggleGps}
          trackColor={{ false: theme.border.subtle, true: theme.accent.gold }}
          thumbColor={highAccuracyGps ? (isLight ? '#1E1A33' : theme.bg.dusk) : theme.text.muted}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>Scanner Auto-Flashlight</Text>
          <Text style={[styles.settingSub, { color: theme.text.secondary }]}>Enable torch automatically on QR radar</Text>
        </View>
        <Switch
          value={autoTorch}
          onValueChange={onToggleTorch}
          trackColor={{ false: theme.border.subtle, true: theme.accent.gold }}
          thumbColor={autoTorch ? (isLight ? '#1E1A33' : theme.bg.dusk) : theme.text.muted}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>Live Telemetry Polling</Text>
          <Text style={[styles.settingSub, { color: theme.text.secondary }]}>Auto-sync quest discoveries</Text>
        </View>
        <Switch
          value={livePolling}
          onValueChange={onTogglePolling}
          trackColor={{ false: theme.border.subtle, true: theme.accent.gold }}
          thumbColor={livePolling ? (isLight ? '#1E1A33' : theme.bg.dusk) : theme.text.muted}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

      <View
        style={[styles.settingRow, activeTourTarget === 'profile_haptics' && styles.tourTargetGlow]}
      >
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>Haptic Feedback</Text>
          <Text style={[styles.settingSub, { color: theme.text.secondary }]}>Tactile pulse on scans and rewards</Text>
        </View>
        <Switch
          value={hapticFeedback}
          onValueChange={onToggleHaptic}
          trackColor={{ false: theme.border.subtle, true: theme.accent.gold }}
          thumbColor={hapticFeedback ? (isLight ? '#1E1A33' : theme.bg.dusk) : theme.text.muted}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>8-Bit Sound Effects</Text>
          <Text style={[styles.settingSub, { color: theme.text.secondary }]}>Chiptune audio on taps, scans & rewards</Text>
        </View>
        <Switch
          value={soundEffects}
          onValueChange={onToggleSound}
          trackColor={{ false: theme.border.subtle, true: theme.accent.gold }}
          thumbColor={soundEffects ? (isLight ? '#1E1A33' : theme.bg.dusk) : theme.text.muted}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

      <TouchableOpacity
        style={[
          styles.cacheBtn,
          {
            backgroundColor: theme.bg.surface,
            borderColor: theme.border.subtle,
          },
          activeTourTarget === 'profile_cache' && styles.tourTargetGlow,
        ]}
        onPress={onClearCache}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={cacheCleared ? 'check-circle' : 'cached'}
          size={16}
          color={cacheCleared ? theme.accent.green : theme.accent.gold}
        />
        <Text
          style={[
            styles.cacheBtnText,
            { color: cacheCleared ? theme.accent.green : theme.accent.gold },
          ]}
        >
          {cacheCleared ? 'Local Radar Cache Flushed!' : 'Flush Local Cache'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 13,
  },
  settingSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#2E274D',
  },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent.gold,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  guideBtnText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cacheBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#151126',
    borderWidth: 1,
    borderColor: '#3D3560',
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 2,
  },
  cacheBtnText: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 11,
  },
  cacheBtnTextDone: {
    color: colors.accent.green,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  paletteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#151126',
    borderWidth: 1,
    borderColor: '#362E52',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    flex: 1,
    minWidth: '45%',
  },
  paletteBtnActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
  },
  paletteDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  paletteBtnText: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
  },
  paletteBtnTextActive: {
    color: colors.accent.gold,
  },
  tourTargetGlow: {
    borderColor: colors.accent.gold,
    borderWidth: 2,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
  },
});
