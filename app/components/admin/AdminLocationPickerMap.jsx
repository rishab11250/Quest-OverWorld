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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TILE_PROVIDERS = {
  street: {
    name: 'Street',
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
  },
  topo: {
    name: 'Topo',
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
  },
  satellite: {
    name: 'Satellite',
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
};

const DEFAULT_CENTER = {
  latitude: 21.1796,
  longitude: 72.8662,
};

// Math helpers for Spherical Mercator tile projections
const latLonToWorldPixels = (lat, lon, zoom) => {
  const n = Math.pow(2, zoom);
  const worldX = ((lon + 180) / 360) * 256 * n;
  const latRad = (lat * Math.PI) / 180;
  const worldY =
    ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * 256 * n;
  return { worldX, worldY };
};

const worldPixelsToLatLon = (worldX, worldY, zoom) => {
  const n = Math.pow(2, zoom);
  const lon = (worldX / (256 * n)) * 360 - 180;
  const latRad = Math.atan(
    Math.sinh(Math.PI * (1 - (2 * worldY) / (256 * n)))
  );
  const lat = (latRad * 180) / Math.PI;
  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
  };
};

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

  // Live user device GPS location
  const [userLocation, setUserLocation] = useState(null);

  // Viewport dimensions
  const mapWidth = Math.min(360, SCREEN_WIDTH - 32);
  const mapHeight = isExpanded ? 500 : 310;

  // Center coordinate state (where the crosshair is pointing)
  const [center, setCenter] = useState({
    latitude: selectedLocation?.latitude || DEFAULT_CENTER.latitude,
    longitude: selectedLocation?.longitude || DEFAULT_CENTER.longitude,
  });

  // Keep refs synchronized with live state
  const centerRef = useRef(center);
  centerRef.current = center;

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Pan references
  const panStartPosRef = useRef(null);
  const centerStartRef = useRef({ ...center });

  // Initial user location auto-detection on mount
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

  // Handle GPS Auto-Center (Pans center crosshair to user's live position)
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

  // Direct smooth pan handlers
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

    // Commit target coordinates to form on gesture end
    if (!readOnly && onLocationChange) {
      onLocationChange(centerRef.current);
    }
  };

  // Compute Active Tile Grid (3x3 grid centered on viewport)
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

  // Radius Halo Pixel scale (centered right at center crosshair!)
  const latRad = (center.latitude * Math.PI) / 180;
  const metersPerPixel = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
  const radiusInPixels = Math.max(16, radius / metersPerPixel);

  // User Location Screen Position (for blue GPS dot)
  let userScreenX = null;
  let userScreenY = null;
  if (userLocation?.latitude && userLocation?.longitude) {
    const userPx = latLonToWorldPixels(userLocation.latitude, userLocation.longitude, zoom);
    userScreenX = mapWidth / 2 + (userPx.worldX - centerWorldX);
    userScreenY = mapHeight / 2 + (userPx.worldY - centerWorldY);
  }

  return (
    <View style={styles.container}>
      {/* Map Header Toolbar: Style Switcher & Zoom */}
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

          {/* Expand / Collapse Button */}
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

      {/* Interactive Slippy Map Canvas with Direct Pan Detection */}
      <View
        style={[styles.mapViewport, { width: mapWidth, height: mapHeight }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Real-World Map Tiles */}
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

          // Hide if off-canvas
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

        {/* Live User GPS Location Beacon (Blue Dot) */}
        {userScreenX !== null &&
          userScreenY !== null &&
          userScreenX >= -40 &&
          userScreenX <= mapWidth + 40 &&
          userScreenY >= -40 &&
          userScreenY <= mapHeight + 40 && (
            <View
              style={[
                styles.userLocationMarker,
                { left: userScreenX - 14, top: userScreenY - 14 },
              ]}
              pointerEvents="none"
            >
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationCore} />
              <View style={styles.userLocationBadge}>
                <Text style={styles.userLocationBadgeText}>YOU</Text>
              </View>
            </View>
          )}

        {/* Geofence Detection Halo Ring centered around Target Reticle */}
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

        {/* TACTICAL CENTER TARGET CROSSHAIR RETICLE (Selection Point) */}
        <View style={[styles.targetLockContainer, isDragging && styles.targetLockDragging]}>
          {/* Target Lock Badge */}
          {!readOnly && (
            <View style={styles.targetBadge}>
              <MaterialCommunityIcons name="target" size={12} color={colors.accent.gold} />
              <Text style={styles.targetBadgeText}>TARGET LOCK</Text>
            </View>
          )}

          {/* Reticle Circle & Brackets */}
          <View style={styles.reticleRing}>
            <View style={styles.reticleCornerTL} />
            <View style={styles.reticleCornerTR} />
            <View style={styles.reticleCornerBL} />
            <View style={styles.reticleCornerBR} />

            {/* Hairline Crosshair Lines */}
            <View style={styles.reticleLineH} />
            <View style={styles.reticleLineV} />

            {/* Center Bullseye Pinpoint */}
            <View style={styles.reticleBullseye} />
            <View style={styles.reticleDot} />
          </View>
        </View>

        {/* Floating Quick Action: My GPS Location */}
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

        {/* Floating Gesture Hint */}
        <View style={styles.gestureHintBadge}>
          <MaterialCommunityIcons name="gesture-swipe" size={11} color={colors.accent.gold} />
          <Text style={styles.gestureHintText}>Drag map to target · Tap + / - to zoom</Text>
        </View>
      </View>

      {/* Selected Coordinates & Perimeter Radius Selector */}
      <View style={styles.coordBar}>
        {/* Row 1: Target Point GPS Coordinates */}
        <View style={styles.coordHeaderRow}>
          <View style={styles.coordLabelGroup}>
            <MaterialCommunityIcons name="crosshairs" size={13} color={colors.accent.gold} />
            <Text style={styles.coordLabel}>TARGET POINT GPS</Text>
          </View>
          <Text style={styles.coordValue}>
            {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
          </Text>
        </View>

        {/* Row 2: Geofence Detection Radius Options */}
        {!readOnly && onRadiusChange ? (
          <View style={styles.geofenceRow}>
            <View style={styles.geofenceLabelGroup}>
              <MaterialCommunityIcons name="radius-outline" size={13} color={colors.text.onDark.secondary} />
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
                    style={[
                      styles.radiusPillText,
                      radius === r && styles.radiusPillTextActive,
                    ]}
                  >
                    ±{r}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Selected Station Popover Inspector */}
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
    marginLeft: 2,
    borderRadius: 3,
    backgroundColor: '#262040',
  },
  expandBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  mapViewport: {
    backgroundColor: '#141220',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#4A4170',
    alignSelf: 'center',
  },
  mapTile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  radiusHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(232, 102, 75, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.accent.coral,
    borderStyle: 'dashed',
    pointerEvents: 'none',
  },
  targetLockContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -50,
    marginTop: -42,
    width: 100,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  targetLockDragging: {
    transform: [{ scale: 1.12 }],
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 18, 32, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    marginBottom: 4,
    alignSelf: 'center',
  },
  targetBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  reticleRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 75, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reticleCornerTL: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleCornerTR: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    width: 7,
    height: 7,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 7,
    height: 7,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.accent.gold,
  },
  reticleLineH: {
    position: 'absolute',
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  reticleLineV: {
    position: 'absolute',
    height: 24,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  reticleBullseye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.accent.coral,
  },
  reticleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFF',
    position: 'absolute',
  },
  userLocationMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(64, 196, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: '#40C4FF',
  },
  userLocationCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B0FF',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
  },
  userLocationBadge: {
    position: 'absolute',
    top: -14,
    backgroundColor: '#00B0FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  userLocationBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 6,
    color: '#FFF',
    fontWeight: '900',
  },
  existingStationMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.gold,
    borderWidth: 2,
    borderColor: colors.bg.dusk,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  existingStationNumber: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  gpsFab: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#1E1A33',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    elevation: 3,
  },
  gestureHintBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 18, 32, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  gestureHintText: {
    ...typography.caption,
    fontSize: 8,
    color: colors.accent.gold,
    fontWeight: '700',
  },
  coordBar: {
    backgroundColor: '#1E1A33',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: 8,
    marginTop: 4,
  },
  coordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 53, 96, 0.6)',
  },
  coordLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordLabel: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.5,
  },
  coordValue: {
    ...typography.bodySmBold,
    fontSize: 11,
    color: '#FFF',
  },
  geofenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  geofenceLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radiusLabel: {
    ...typography.caption,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
    fontWeight: '700',
  },
  radiusButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radiusPill: {
    backgroundColor: '#171326',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  radiusPillActive: {
    backgroundColor: colors.accent.coral,
    borderColor: colors.accent.coral,
  },
  radiusPillText: {
    ...typography.caption,
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
  radiusPillTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  stationInfoCard: {
    backgroundColor: '#171326',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    gap: 3,
  },
  stationInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationInfoTitle: {
    ...typography.bodyMdBold,
    fontSize: 11,
    color: colors.accent.gold,
  },
  stationInfoClue: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.primary,
    fontStyle: 'italic',
  },
  stationInfoPoints: {
    ...typography.caption,
    fontSize: 9,
    color: colors.accent.green,
    fontWeight: '800',
  },
});
