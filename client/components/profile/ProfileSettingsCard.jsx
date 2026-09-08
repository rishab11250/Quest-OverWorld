import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { useTour } from '../../context/TourContext';

export default function ProfileSettingsCard({
  highAccuracyGps,
  onToggleGps,
  autoTorch,
  onToggleTorch,
  livePolling,
  onTogglePolling,
  hapticFeedback,
  onToggleHaptic,
  cacheCleared,
  onClearCache,
  onOpenGuide,
}) {
  const { activeTourTarget } = useTour() || {};

  return (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>EXPEDITION SETTINGS</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Interactive App Walkthrough</Text>
          <Text style={styles.settingSub}>Page-by-page tour explaining each button</Text>
        </View>
        <TouchableOpacity
          style={[styles.guideBtn, activeTourTarget === 'profile_tour' && styles.tourTargetGlow]}
          onPress={onOpenGuide}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="compass-outline" size={14} color={colors.bg.dusk} />
          <Text style={styles.guideBtnText}>START TOUR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>High-Precision Radar</Text>
          <Text style={styles.settingSub}>Sub-meter GPS accuracy for waypoints</Text>
        </View>
        <Switch
          value={highAccuracyGps}
          onValueChange={onToggleGps}
          trackColor={{ false: '#3D3560', true: colors.accent.gold }}
          thumbColor={highAccuracyGps ? colors.bg.dusk : '#7E75A0'}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Scanner Auto-Flashlight</Text>
          <Text style={styles.settingSub}>Enable torch automatically on QR radar</Text>
        </View>
        <Switch
          value={autoTorch}
          onValueChange={onToggleTorch}
          trackColor={{ false: '#3D3560', true: colors.accent.gold }}
          thumbColor={autoTorch ? colors.bg.dusk : '#7E75A0'}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Live Guild Polling</Text>
          <Text style={styles.settingSub}>Real-time leaderboard sync every 15s</Text>
        </View>
        <Switch
          value={livePolling}
          onValueChange={onTogglePolling}
          trackColor={{ false: '#3D3560', true: colors.accent.gold }}
          thumbColor={livePolling ? colors.bg.dusk : '#7E75A0'}
        />
      </View>

      <View style={styles.divider} />

      <View
        style={[styles.settingRow, activeTourTarget === 'profile_haptics' && styles.tourTargetGlow]}
      >
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Haptic Feedback</Text>
          <Text style={styles.settingSub}>Tactile pulse on scans and rewards</Text>
        </View>
        <Switch
          value={hapticFeedback}
          onValueChange={onToggleHaptic}
          trackColor={{ false: '#3D3560', true: colors.accent.gold }}
          thumbColor={hapticFeedback ? colors.bg.dusk : '#7E75A0'}
        />
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.cacheBtn, activeTourTarget === 'profile_cache' && styles.tourTargetGlow]}
        onPress={onClearCache}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={cacheCleared ? 'check-circle' : 'cached'}
          size={16}
          color={cacheCleared ? colors.accent.green : colors.accent.gold}
        />
        <Text style={[styles.cacheBtnText, cacheCleared && styles.cacheBtnTextDone]}>
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
