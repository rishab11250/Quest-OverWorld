import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import typography from '../../../theme/typography';
import { triggerHaptic } from '../../../lib/haptics';

export default function MapStationPin({ station, x, y, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.pinWrapper, { left: x - 14, top: y - 28 }]}
      onPress={() => {
        triggerHaptic('light');
        if (onPress) onPress(station);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.stationBadge}>
        <Text style={styles.stationBadgeText}>#{station.order || '?'}</Text>
      </View>
      <MaterialCommunityIcons name="map-marker" size={28} color={colors.accent.coral} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  stationBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: -4,
    zIndex: 11,
  },
  stationBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.bg.dusk,
    fontWeight: '900',
  },
});
