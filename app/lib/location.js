import * as Location from 'expo-location';

// Internal helper: request foreground GPS permissions
const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        granted: false,
        error:
          'Location permission is required to navigate campus checkpoints and verify discoveries.',
      };
    }
    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      error: error.message || 'Failed to request location permissions.',
    };
  }
};

// Fast fetch of last known GPS location cached by the device
export const getLastKnownLocation = async () => {
  try {
    const lastPos = await Location.getLastKnownPositionAsync();
    if (lastPos?.coords) {
      return {
        latitude: lastPos.coords.latitude,
        longitude: lastPos.coords.longitude,
        accuracy: lastPos.coords.accuracy,
      };
    }
    return null;
  } catch (err) {
    return null;
  }
};

// Get current user GPS coordinates with high accuracy
export const getCurrentLocation = async () => {
  try {
    const perm = await requestLocationPermission();
    if (!perm.granted) {
      throw new Error(perm.error);
    }

    // Fast path: instant return from device cache (< 30ms)
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown?.coords) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy,
      };
    }

    // Fallback: active GPS poll
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.warn('Location lookup error:', error.message);
    return null;
  }
};

// Subscribe to real-time live GPS location updates as the user moves
export const startLocationWatcher = async (onLocationUpdate) => {
  try {
    const perm = await requestLocationPermission();
    if (!perm.granted) return null;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      (loc) => {
        if (loc?.coords) {
          onLocationUpdate({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
          });
        }
      }
    );

    return subscription;
  } catch (err) {
    console.warn('Failed to start location watcher:', err.message);
    return null;
  }
};

// Convert GPS latitude & longitude into a readable campus/street landmark address
export const reverseGeocodeLocation = async (latitude, longitude) => {
  try {
    if (latitude == null || longitude == null) return '';
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return '';

    const parts = [place.name, place.street, place.district, place.city].filter(Boolean);
    return parts.join(', ') || 'Campus Landmark Coordinates';
  } catch (err) {
    return '';
  }
};

// Haversine formula: calculate distance between two GPS coordinates in meters
export const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

// Format meters into human-readable distance (e.g. 250m or 1.2km)
export const formatDistance = (meters) => {
  if (meters == null) return '--';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

// Calculate compass bearing angle (0-360) and cardinal direction arrow to target
export const getBearingAndDirection = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearingDegrees = ((θ * 180) / Math.PI + 360) % 360;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const fullNames = [
    'North',
    'Northeast',
    'East',
    'Southeast',
    'South',
    'Southwest',
    'West',
    'Northwest',
  ];
  const index = Math.round(bearingDegrees / 45) % 8;

  return {
    bearing: Math.round(bearingDegrees),
    direction: directions[index],
    arrow: arrows[index],
    label: fullNames[index],
  };
};
