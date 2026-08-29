import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { triggerHaptic } from '../../lib/haptics';

// Campus coordinate bounding box for map translation
const CAMPUS_BOUNDS = {
  minLat: 28.5430,
  maxLat: 28.5485,
  minLon: 77.1900,
  maxLon: 77.1955,
  width: 320,
  height: 320,
};

// Preset Campus Landmarks for quick navigation
export const CAMPUS_LANDMARKS = [
  { id: 'quad', name: 'North Quad Oak', lat: 28.5458, lon: 77.1926, icon: 'tree' },
  { id: 'clock', name: 'Clocktower Plaza', lat: 28.5465, lon: 77.1932, icon: 'clock-outline' },
  { id: 'fountain', name: 'Alumni Waters', lat: 28.5450, lon: 77.1920, icon: 'water' },
  { id: 'arch', name: 'Founders Vault Arch', lat: 28.5472, lon: 77.1940, icon: 'pillar' },
  { id: 'lib', name: 'Grand Archive Library', lat: 28.5460, lon: 77.1915, icon: 'book-open-variant' },
  { id: 'hall', name: 'Adventurers Union Hall', lat: 28.5442, lon: 77.1935, icon: 'shield-account' },
];

export const gpsToMapCoords = (lat, lon, width = 320, height = 320) => {
  const normX = (lon - CAMPUS_BOUNDS.minLon) / (CAMPUS_BOUNDS.maxLon - CAMPUS_BOUNDS.minLon);
  const normY = 1 - (lat - CAMPUS_BOUNDS.minLat) / (CAMPUS_BOUNDS.maxLat - CAMPUS_BOUNDS.minLat);

  return {
    x: Math.max(16, Math.min(width - 16, normX * width)),
    y: Math.max(16, Math.min(height - 16, normY * height)),
  };
};

export const mapCoordsToGps = (x, y, width = 320, height = 320) => {
  const normX = Math.max(0, Math.min(1, x / width));
  const normY = Math.max(0, Math.min(1, y / height));

  const lon = CAMPUS_BOUNDS.minLon + normX * (CAMPUS_BOUNDS.maxLon - CAMPUS_BOUNDS.minLon);
  const lat = CAMPUS_BOUNDS.maxLat - normY * (CAMPUS_BOUNDS.maxLat - CAMPUS_BOUNDS.minLat);

  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
  };
};

export default function AdminLocationPickerMap({
  selectedLocation,
  onLocationChange,
  existingCheckpoints = [],
  existingQuests = [],
  radius = 50,
  onRadiusChange,
  readOnly = false,
}) {
  const [selectedStationInfo, setSelectedStationInfo] = useState(null);
  const [activeLandmark, setActiveLandmark] = useState(null);

  const mapWidth = 320;
  const mapHeight = 320;

  // Selected Pin coordinates
  const currentPinMapCoords = selectedLocation?.latitude
    ? gpsToMapCoords(selectedLocation.latitude, selectedLocation.longitude, mapWidth, mapHeight)
    : { x: mapWidth / 2, y: mapHeight / 2 };

  // Handle map tap to drop pin
  const handleMapPress = (evt) => {
    if (readOnly) return;
    const { locationX, locationY } = evt.nativeEvent;
    const gps = mapCoordsToGps(locationX, locationY, mapWidth, mapHeight);

    triggerHaptic('medium');
    setSelectedStationInfo(null);
    setActiveLandmark(null);
    if (onLocationChange) {
      onLocationChange(gps);
    }
  };

  // Quick landmark jump
  const handleSelectLandmark = (lm) => {
    triggerHaptic('light');
    setActiveLandmark(lm.id);
    setSelectedStationInfo(null);
    if (onLocationChange) {
      onLocationChange({ latitude: lm.lat, longitude: lm.lon, landmarkName: lm.name });
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Header Telemetry */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryLeft}>
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.accent.gold} />
          <View>
            <Text style={styles.telemetryCoords}>
              {selectedLocation?.latitude
                ? `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                : 'TAP MAP TO DROP PIN'}
            </Text>
            <Text style={styles.telemetrySub}>
              {selectedLocation?.landmarkName || 'Campus Coordinate Anchor'}
            </Text>
          </View>
        </View>

        {onRadiusChange && !readOnly ? (
          <View style={styles.radiusSelector}>
            {[25, 50, 100].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                onPress={() => {
                  triggerHaptic('light');
                  onRadiusChange(r);
                }}
              >
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                  {r}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {/* Preset Landmark Chips */}
      {!readOnly ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.landmarkScroll}
        >
          {CAMPUS_LANDMARKS.map((lm) => (
            <TouchableOpacity
              key={lm.id}
              style={[
                styles.landmarkChip,
                activeLandmark === lm.id && styles.landmarkChipActive,
              ]}
              onPress={() => handleSelectLandmark(lm)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={lm.icon}
                size={13}
                color={activeLandmark === lm.id ? colors.accent.gold : colors.text.onDark.secondary}
              />
              <Text
                style={[
                  styles.landmarkChipText,
                  activeLandmark === lm.id && styles.landmarkChipTextActive,
                ]}
              >
                {lm.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {/* Interactive Map Board Canvas */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleMapPress}
        style={[styles.mapCanvas, { width: '100%', height: mapHeight }]}
      >
        {/* Topographic Coordinate Grid Lines */}
        <View style={styles.gridOverlay} />

        {/* Existing Checkpoint Station Markers */}
        {existingCheckpoints.map((cp) => {
          const coords = gpsToMapCoords(
            cp.latitude || 28.5458,
            cp.longitude || 77.1926,
            mapWidth,
            mapHeight
          );

          const isSelected = selectedStationInfo?._id === cp._id;

          return (
            <View key={cp._id} style={[styles.existingMarker, { left: coords.x - 14, top: coords.y - 14 }]}>
              {/* Detection Zone Halo */}
              <View
                style={[
                  styles.existingRadiusHalo,
                  {
                    width: (cp.radius || 50) * 0.8,
                    height: (cp.radius || 50) * 0.8,
                    borderRadius: (cp.radius || 50) * 0.4,
                    left: 14 - (cp.radius || 50) * 0.4,
                    top: 14 - (cp.radius || 50) * 0.4,
                  },
                ]}
              />

              <TouchableOpacity
                style={[styles.existingPin, isSelected && styles.existingPinActive]}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedStationInfo(cp);
                }}
              >
                <Text style={styles.existingPinOrder}>#{cp.order}</Text>
              </TouchableOpacity>

              <View style={styles.existingPinTag}>
                <Text style={styles.existingPinTagText} numberOfLines={1}>
                  {cp.title}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Candidate Target Location Pin (Dropped by Admin) */}
        {selectedLocation?.latitude ? (
          <View
            style={[
              styles.targetPinContainer,
              { left: currentPinMapCoords.x - 20, top: currentPinMapCoords.y - 20 },
            ]}
          >
            {/* Pulsing Active Radius Circle */}
            <View
              style={[
                styles.targetRadiusCircle,
                {
                  width: radius * 0.9,
                  height: radius * 0.9,
                  borderRadius: radius * 0.45,
                  left: 20 - radius * 0.45,
                  top: 20 - radius * 0.45,
                },
              ]}
            />

            {/* Target Crosshairs Reticle */}
            <View style={styles.targetReticle}>
              <View style={styles.reticleCrossH} />
              <View style={styles.reticleCrossV} />
              <View style={styles.reticleCenter} />
            </View>

            <View style={styles.targetLabelPill}>
              <Text style={styles.targetLabelText}>NEW PIN</Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Selected Existing Marker Details Popup */}
      {selectedStationInfo ? (
        <View style={styles.stationInspectionCard}>
          <View style={styles.inspectionTop}>
            <View style={styles.inspectionOrderBadge}>
              <Text style={styles.inspectionOrderText}>STATION #{selectedStationInfo.order}</Text>
            </View>
            <Text style={styles.inspectionPoints}>+{selectedStationInfo.points} PTS</Text>
          </View>
          <Text style={styles.inspectionTitle}>{selectedStationInfo.title}</Text>
          <Text style={styles.inspectionClue}>{selectedStationInfo.clue}</Text>
          <Text style={styles.inspectionGps}>
            📍 GPS: {selectedStationInfo.latitude?.toFixed(4)}, {selectedStationInfo.longitude?.toFixed(4)} (±{selectedStationInfo.radius || 50}m)
          </Text>

          {!readOnly ? (
            <TouchableOpacity
              style={styles.useCoordsBtn}
              onPress={() => {
                triggerHaptic('medium');
                if (onLocationChange) {
                  onLocationChange({
                    latitude: selectedStationInfo.latitude,
                    longitude: selectedStationInfo.longitude,
                    landmarkName: selectedStationInfo.title,
                  });
                }
                setSelectedStationInfo(null);
              }}
            >
              <Text style={styles.useCoordsBtnText}>Use These Coordinates</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    width: '100%',
  },
  telemetryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  telemetryCoords: {
    ...typography.displayPixelXs,
    fontSize: 8.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  telemetrySub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
  },
  radiusSelector: {
    flexDirection: 'row',
    backgroundColor: '#171326',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
    padding: 2,
    gap: 2,
  },
  radiusBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  radiusBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  radiusBtnText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.text.onDark.secondary,
  },
  radiusBtnTextActive: {
    color: colors.bg.dusk,
    fontWeight: '900',
  },
  landmarkScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#362E52',
  },
  landmarkChipActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
  },
  landmarkChipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.onDark.secondary,
  },
  landmarkChipTextActive: {
    color: colors.accent.gold,
    fontWeight: '700',
  },
  mapCanvas: {
    backgroundColor: '#151126',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(74, 65, 112, 0.15)',
  },
  existingMarker: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  existingRadiusHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(62, 207, 142, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(62, 207, 142, 0.25)',
  },
  existingPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#272044',
    borderWidth: 1.5,
    borderColor: colors.accent.green,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  existingPinActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
  },
  existingPinOrder: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.green,
  },
  existingPinTag: {
    backgroundColor: 'rgba(15, 12, 28, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#362E52',
    maxWidth: 90,
  },
  existingPinTagText: {
    ...typography.caption,
    fontSize: 8,
    color: colors.text.onDark.secondary,
  },
  targetPinContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  targetRadiusCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    borderStyle: 'dashed',
  },
  targetReticle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  reticleCrossH: {
    position: 'absolute',
    width: 38,
    height: 1.5,
    backgroundColor: colors.accent.gold,
  },
  reticleCrossV: {
    position: 'absolute',
    width: 1.5,
    height: 38,
    backgroundColor: colors.accent.gold,
  },
  reticleCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  targetLabelPill: {
    position: 'absolute',
    bottom: -16,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    zIndex: 3,
  },
  targetLabelText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.bg.dusk,
    fontWeight: '900',
  },
  stationInspectionCard: {
    backgroundColor: '#201A38',
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: 4,
    marginTop: spacing.xs,
  },
  inspectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectionOrderBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  inspectionOrderText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
  },
  inspectionPoints: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.accent.gold,
  },
  inspectionTitle: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 13,
  },
  inspectionClue: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    lineHeight: 16,
  },
  inspectionGps: {
    ...typography.caption,
    fontSize: 10,
    color: colors.accent.green,
    marginTop: 2,
  },
  useCoordsBtn: {
    backgroundColor: colors.accent.gold,
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 4,
  },
  useCoordsBtnText: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.bg.dusk,
    fontWeight: '900',
  },
});
