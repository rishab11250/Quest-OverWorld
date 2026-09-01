import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { getSetting } from './secureStore';

let hapticsEnabledCache = true;

// Pre-load from store
getSetting('haptic_feedback', true).then((val) => {
  hapticsEnabledCache = val !== false;
});

export const setHapticGlobalState = (enabled) => {
  hapticsEnabledCache = Boolean(enabled);
};

export const triggerHaptic = (type = 'light') => {
  if (Platform.OS === 'web' || !hapticsEnabledCache) return;

  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        Haptics.selectionAsync();
        break;
    }
  } catch (err) {
    // Graceful fallback for devices without vibration engine
  }
};

export default triggerHaptic;
