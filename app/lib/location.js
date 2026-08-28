import * as Location from 'expo-location';

/**
 * Request foreground GPS location permissions.
 * @returns {Promise<{ granted: boolean, error?: string }>}
 */
export const requestLocationPermission = async () => {
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

/**
 * Get current user GPS coordinates.
 * @returns {Promise<{ latitude: number, longitude: number, accuracy?: number } | null>}
 */
export const getCurrentLocation = async () => {
  try {
    const perm = await requestLocationPermission();
    if (!perm.granted) {
      throw new Error(perm.error);
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    // If device GPS is not ready/mocked, fallback to default campus anchor
    console.warn('Location lookup fallback:', error.message);
    return {
      latitude: 28.5458,
      longitude: 77.1926,
      fallback: true,
    };
  }
};

/**
 * Calculate distance between two GPS coordinates in meters using the Haversine formula.
 */
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

/**
 * Check if a player is within the radius of a checkpoint.
 */
export const isWithinRadius = (userLat, userLon, checkLat, checkLon, radius = 50) => {
  const distance = getDistanceInMeters(userLat, userLon, checkLat, checkLon);
  if (distance == null) return false;
  return distance <= radius;
};

/**
 * Format meters to human readable distance string.
 */
export const formatDistance = (meters) => {
  if (meters == null) return '--';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};
