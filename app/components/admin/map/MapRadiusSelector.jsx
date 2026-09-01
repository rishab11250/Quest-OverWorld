import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../../../theme/colors';
import typography from '../../../theme/typography';
import { triggerHaptic } from '../../../lib/haptics';

const RADIUS_OPTIONS = [25, 50, 100, 200];

export default function MapRadiusSelector({ radius, onRadiusChange }) {
  return (
    <View style={styles.radiusRow}>
      <Text style={styles.radiusLabel}>GEOFENCE RADIUS:</Text>
      <View style={styles.radiusOptions}>
        {RADIUS_OPTIONS.map((r) => {
          const isSelected = radius === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.radiusChip, isSelected && styles.radiusChipActive]}
              onPress={() => {
                triggerHaptic('selection');
                if (onRadiusChange) onRadiusChange(r);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.radiusChipText, isSelected && styles.radiusChipTextActive]}>
                {r}m
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1933',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  radiusLabel: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#161326',
    borderWidth: 1,
    borderColor: '#4A3E70',
  },
  radiusChipActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderColor: colors.accent.gold,
  },
  radiusChipText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.text.onDark.secondary,
  },
  radiusChipTextActive: {
    color: colors.accent.gold,
    fontWeight: '800',
  },
});
