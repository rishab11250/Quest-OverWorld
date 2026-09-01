import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { triggerHaptic } from '../../lib/haptics';
import { getCurrentLocation, getLastKnownLocation, startLocationWatcher } from '../../lib/location';
import {
  TILE_PROVIDERS,
  DEFAULT_CENTER,
  latLonToWorldPixels,
  worldPixelsToLatLon,
  CAMPUS_LANDMARKS,
} from './map/mapProjections';

export { CAMPUS_LANDMARKS };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminLocationPickerMap({
  selectedLocation,
  onLocationChange,
  existingCheckpoints = [],
  radius = 50,
  onRadiusChange,
  readOnly = false,
}) {
  const [zoom, setZoom] = useState(16);
  const [mapProvider, setMapProvider] = useState('street');
  const [locating, setLocating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStationInfo, setSelectedStationInfo] = useState(null);

  const [userLocation, setUserLocation] = useState(null);

  const mapWidth = Math.min(360, SCREEN_WIDTH - 32);
  const mapHeight = isExpanded ? 500 : 310;

  const [center, setCenter] = useState({
    latitude: selectedLocation?.latitude || DEFAULT_CENTER.latitude,
    longitude: selectedLocation?.longitude || DEFAULT_CENTER.longitude,
  });

  const centerRef = useRef(center);
  centerRef.current = center;

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const panStartPosRef = useRef(null);
  const centerStartRef = useRef({ ...center });

  useEffect(() => {
    getLastKnownLocation().then((loc) => {
      if (loc) {
        setUserLocation(loc);
        if (!selectedLocation?.latitude) {
          setCenter({ latitude: loc.latitude, longitude: loc.longitude });
          if (onLocationChange && !readOnly) {
            onLocationChange({ latitude: loc.latitude, longitude: loc.longitude });
          }
        }
      }
    });

    let sub = null;
    startLocationWatcher((loc) => {
      if (loc) {
        setUserLocation(loc);
      }
    }).then((s) => {
      sub = s;
    });

    return () => {
      if (sub?.remove) sub.remove();
    };
  }, []);

  const handleCurrentLocation = async () => {
    try {
      setLocating(true);
      triggerHaptic('medium');
      const loc = await getCurrentLocation();
      if (loc) {
        setUserLocation(loc);
        setCenter({ latitude: loc.latitude, longitude: loc.longitude });
        if (onLocationChange && !readOnly) {
          onLocationChange({
            latitude: Number(loc.latitude.toFixed(6)),
            longitude: Number(loc.longitude.toFixed(6)),
          });
        }
      }
    } catch (err) {
      console.log('Error getting location:', err);
    } finally {
      setLocating(false);
    }
  };

  const handleTouchStart = (e) => {
    const touches = e.nativeEvent.touches;
    if (touches && touches.length >= 1) {
      panStartPosRef.current = { x: touches[0].pageX, y: touches[0].pageY };
      centerStartRef.current = { ...centerRef.current };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    const touches = e.nativeEvent.touches;
    if (touches && touches.length >= 1 && panStartPosRef.current) {
      const dx = touches[0].pageX - panStartPosRef.current.x;
      const dy = touches[0].pageY - panStartPosRef.current.y;

      const { worldX, worldY } = latLonToWorldPixels(
        centerStartRef.current.latitude,
        centerStartRef.current.longitude,
        zoomRef.current
      );
      const newWorldX = worldX - dx;
      const newWorldY = worldY - dy;
      const newLatLon = worldPixelsToLatLon(newWorldX, newWorldY, zoomRef.current);
      setCenter(newLatLon);
    }
  };

  const handleTouchEnd = () => {
    panStartPosRef.current = null;
    setIsDragging(false);

    if (!readOnly && onLocationChange) {
      onLocationChange(centerRef.current);
    }
  };

  const { worldX: centerWorldX, worldY: centerWorldY } = latLonToWorldPixels(
    center.latitude,
    center.longitude,
    zoom
  );

  const centerTileX = Math.floor(centerWorldX / 256);
  const centerTileY = Math.floor(centerWorldY / 256);
  const maxTile = Math.pow(2, zoom);

  const tiles = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const tileX = centerTileX + dx;
      const tileY = centerTileY + dy;
      if (tileX >= 0 && tileX < maxTile && tileY >= 0 && tileY < maxTile) {
        const tileLeft = tileX * 256 - centerWorldX + mapWidth / 2;
        const tileTop = tileY * 256 - centerWorldY + mapHeight / 2;
        tiles.push({
          key: `${zoom}-${tileX}-${tileY}`,
          url: TILE_PROVIDERS[mapProvider].url(zoom, tileX, tileY),
          left: tileLeft,
          top: tileTop,
        });
      }
    }
  }

  const latRad = (center.latitude * Math.PI) / 180;
  const metersPerPixel = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
  const radiusInPixels = Math.max(16, radius / metersPerPixel);

  let userScreenX = null;
  let userScreenY = null;
  if (userLocation?.latitude && userLocation?.longitude) {
    const userPx = latLonToWorldPixels(userLocation.latitude, userLocation.longitude, zoom);
    userScreenX = mapWidth / 2 + (userPx.worldX - centerWorldX);
    userScreenY = mapHeight / 2 + (userPx.worldY - centerWorldY);
  }

  return (
    <View style={styles.container}>
      {/* Map Header Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.providerRow}>
          {Object.entries(TILE_PROVIDERS).map(([key, prov]) => (
            <TouchableOpacity
              key={key}
              style={[styles.providerPill, mapProvider === key && styles.providerPillActive]}
              onPress={() => {
                triggerHaptic('selection');
                setMapProvider(key);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.providerPillText,
                  mapProvider === key && styles.providerPillTextActive,
                ]}
              >
                {prov.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.zoomButtonsRow}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => {
              triggerHaptic('light');
              setZoom((z) => Math.min(18, z + 1));
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.zoomText}>z{zoom}</Text>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => {
              triggerHaptic('light');
              setZoom((z) => Math.max(13, z - 1));
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="minus" size={16} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.expandBtn, isExpanded && styles.expandBtnActive]}
            onPress={() => {
              triggerHaptic('medium');
              setIsExpanded(!isExpanded);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isExpanded ? 'arrow-collapse' : 'arrow-expand'}
              size={15}
              color={isExpanded ? colors.bg.dusk : colors.accent.gold}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slippy Map Viewport */}
      <View
        style={[styles.mapViewport, { width: mapWidth, height: mapHeight }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url, headers: { 'User-Agent': 'QuestOverworld/1.0' } }}
            style={[styles.mapTile, { left: tile.left, top: tile.top }]}
          />
        ))}

        {/* Existing Checkpoints Layer */}
        {existingCheckpoints.map((cp) => {
          if (!cp.latitude || !cp.longitude) return null;
          const { worldX, worldY } = latLonToWorldPixels(cp.latitude, cp.longitude, zoom);
          const cpX = mapWidth / 2 + (worldX - centerWorldX);
          const cpY = mapHeight / 2 + (worldY - centerWorldY);

          if (cpX < -30 || cpX > mapWidth + 30 || cpY < -30 || cpY > mapHeight + 30) return null;

          return (
            <TouchableOpacity
              key={cp._id || cp.order}
              style={[styles.existingStationMarker, { left: cpX - 12, top: cpY - 12 }]}
              onPress={() => {
                triggerHaptic('light');
                setSelectedStationInfo(cp);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.existingStationNumber}>#{cp.order}</Text>
            </TouchableOpacity>
          );
        })}

        {/* User GPS Location Beacon */}
        {userScreenX !== null &&
          userScreenY !== null &&
          userScreenX >= -40 &&
          userScreenX <= mapWidth + 40 &&
          userScreenY >= -40 &&
          userScreenY <= mapHeight + 40 && (
            <View
              style={[styles.userLocationMarker, { left: userScreenX - 14, top: userScreenY - 14 }]}
              pointerEvents="none"
            >
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationCore} />
              <View style={styles.userLocationBadge}>
                <Text style={styles.userLocationBadgeText}>YOU</Text>
              </View>
            </View>
          )}

        {/* Geofence Detection Halo */}
        {!readOnly && (
          <View
            style={[
              styles.radiusHalo,
              {
                left: mapWidth / 2 - radiusInPixels,
                top: mapHeight / 2 - radiusInPixels,
                width: radiusInPixels * 2,
                height: radiusInPixels * 2,
                borderRadius: radiusInPixels,
              },
            ]}
          />
        )}

        {/* Center Reticle */}
        <View style={[styles.targetLockContainer, isDragging && styles.targetLockDragging]}>
          {!readOnly && (
            <View style={styles.targetBadge}>
              <MaterialCommunityIcons name="target" size={12} color={colors.accent.gold} />
              <Text style={styles.targetBadgeText}>TARGET LOCK</Text>
            </View>
          )}

          <View style={styles.reticleRing}>
            <View style={styles.reticleCornerTL} />
            <View style={styles.reticleCornerTR} />
            <View style={styles.reticleCornerBL} />
            <View style={styles.reticleCornerBR} />
            <View style={styles.reticleLineH} />
            <View style={styles.reticleLineV} />
            <View style={styles.reticleBullseye} />
            <View style={styles.reticleDot} />
          </View>
        </View>

        {/* Recenter GPS FAB */}
        <TouchableOpacity
          style={styles.gpsFab}
          onPress={handleCurrentLocation}
          disabled={locating}
          activeOpacity={0.8}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.accent.gold} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.accent.gold} />
          )}
        </TouchableOpacity>

        <View style={styles.gestureHintBadge}>
          <MaterialCommunityIcons name="gesture-swipe" size={11} color={colors.accent.gold} />
          <Text style={styles.gestureHintText}>Drag map to target · Tap + / - to zoom</Text>
        </View>
      </View>

      {/* Target Point Coordinates & Geofence Selector */}
      <View style={styles.coordBar}>
        <View style={styles.coordHeaderRow}>
          <View style={styles.coordLabelGroup}>
            <MaterialCommunityIcons name="crosshairs" size={13} color={colors.accent.gold} />
            <Text style={styles.coordLabel}>TARGET POINT GPS</Text>
          </View>
          <Text style={styles.coordValue}>
            {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
          </Text>
        </View>

        {!readOnly && onRadiusChange ? (
          <View style={styles.geofenceRow}>
            <View style={styles.geofenceLabelGroup}>
              <MaterialCommunityIcons
                name="radius-outline"
                size={13}
                color={colors.text.onDark.secondary}
              />
              <Text style={styles.radiusLabel}>GEOFENCE RADIUS:</Text>
            </View>
            <View style={styles.radiusButtonGroup}>
              {[25, 50, 100].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusPill, radius === r && styles.radiusPillActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    onRadiusChange(r);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.radiusPillText, radius === r && styles.radiusPillTextActive]}
                  >
                    ±{r}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Station Popover */}
      {selectedStationInfo ? (
        <View style={styles.stationInfoCard}>
          <View style={styles.stationInfoHeader}>
            <Text style={styles.stationInfoTitle}>
              Station #{selectedStationInfo.order} · {selectedStationInfo.title}
            </Text>
            <TouchableOpacity onPress={() => setSelectedStationInfo(null)}>
              <MaterialCommunityIcons name="close" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.stationInfoClue} numberOfLines={2}>
            "{selectedStationInfo.clue}"
          </Text>
          <Text style={styles.stationInfoPoints}>
            +{selectedStationInfo.points || 100} XP · Radius: ±{selectedStationInfo.radius || 50}m
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 4,
  },
  providerPill: {
    backgroundColor: '#1E1A33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  providerPillActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  providerPillText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
  providerPillTextActive: {
    color: colors.bg.dusk,
  },
  zoomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
    paddingHorizontal: 4,
    gap: 5,
  },
  zoomBtn: {
    padding: 2,
  },
  zoomText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  expandBtn: {
    padding: 3,
    borderRadius: 3,
    backgroundColor: '#2A2347',
    marginLeft: 2,
  },
  expandBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  mapViewport: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#120E22',
    borderWidth: 1.5,
    borderColor: '#3D3560',
    position: 'relative',
    alignSelf: 'center',
  },
  mapTile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  existingStationMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.gold,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  existingStationNumber: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.bg.dusk,
    fontWeight: '900',
  },
  userLocationMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  userLocationCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userLocationBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 3,
    borderRadius: 2,
  },
  userLocationBadgeText: {
    fontSize: 6,
    color: '#FFF',
    fontWeight: '900',
  },
  radiusHalo: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 75, 0.5)',
    backgroundColor: 'rgba(242, 200, 75, 0.08)',
    borderStyle: 'dashed',
    zIndex: 4,
    pointerEvents: 'none',
  },
  targetLockContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  targetLockDragging: {
    transform: [{ scale: 1.15 }],
  },
  targetBadge: {
    position: 'absolute',
    top: -18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1E1933',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  targetBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 6,
    color: colors.accent.gold,
  },
  reticleRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reticleCornerTL: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleCornerTR: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleLineH: {
    position: 'absolute',
    width: 44,
    height: 1,
    backgroundColor: 'rgba(242, 200, 75, 0.4)',
  },
  reticleLineV: {
    position: 'absolute',
    height: 44,
    width: 1,
    backgroundColor: 'rgba(242, 200, 75, 0.4)',
  },
  reticleBullseye: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  reticleDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent.coral,
  },
  gpsFab: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1933',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  gestureHintBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 14, 34, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  gestureHintText: {
    ...typography.caption,
    fontSize: 8.5,
    color: colors.text.onDark.secondary,
  },
  coordBar: {
    backgroundColor: '#1E1933',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: 8,
  },
  coordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coordLabel: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  coordValue: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.onDark.primary,
  },
  geofenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2C2548',
    paddingTop: 6,
  },
  geofenceLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  radiusLabel: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
  },
  radiusButtonGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  radiusPill: {
    backgroundColor: '#151126',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  radiusPillActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderColor: colors.accent.gold,
  },
  radiusPillText: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
  },
  radiusPillTextActive: {
    color: colors.accent.gold,
  },
  stationInfoCard: {
    backgroundColor: '#1E1933',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    gap: 4,
  },
  stationInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationInfoTitle: {
    ...typography.bodyMdBold,
    color: colors.accent.gold,
    fontSize: 12,
  },
  stationInfoClue: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontStyle: 'italic',
    fontSize: 11,
  },
  stationInfoPoints: {
    ...typography.captionBold,
    color: colors.accent.green,
    fontSize: 10,
  },
});
