import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticStrength = 'light' | 'medium' | 'selection' | 'success' | 'warning';

/**
 * Fire-and-forget haptic feedback. Web has no haptics engine, so this is a
 * no-op there rather than a rejected promise.
 */
export function tapFeedback(strength: HapticStrength = 'light') {
  if (Platform.OS === 'web') return;

  switch (strength) {
    case 'selection': {
      void Haptics.selectionAsync();
      return;
    }
    case 'medium': {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    case 'success': {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    case 'warning': {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    default: {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
}
