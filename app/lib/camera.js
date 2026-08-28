import { Camera } from 'expo-camera';

/**
 * Request camera permissions for QR scanning.
 * @returns {Promise<{ granted: boolean, error?: string }>}
 */
export const requestCameraPermission = async () => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return {
        granted: false,
        error: 'Camera permission is required to scan checkpoint QR codes.',
      };
    }
    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      error: error.message || 'Failed to request camera permission.',
    };
  }
};
