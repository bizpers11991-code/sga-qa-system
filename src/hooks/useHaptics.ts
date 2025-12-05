/**
 * Haptic feedback hook for mobile devices
 * Uses the Vibration API to provide tactile feedback
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10, 50, 10],
  warning: [50, 100, 50],
  error: [100, 50, 100, 50, 100],
  selection: 5,
};

export function useHaptics() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = (pattern: HapticPattern = 'light') => {
    if (!isSupported) return false;

    try {
      return navigator.vibrate(patterns[pattern]);
    } catch {
      return false;
    }
  };

  const vibrateCustom = (pattern: number | number[]) => {
    if (!isSupported) return false;

    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  };

  const stop = () => {
    if (!isSupported) return;
    navigator.vibrate(0);
  };

  return {
    isSupported,
    vibrate,
    vibrateCustom,
    stop,
    // Convenience methods
    light: () => vibrate('light'),
    medium: () => vibrate('medium'),
    heavy: () => vibrate('heavy'),
    success: () => vibrate('success'),
    warning: () => vibrate('warning'),
    error: () => vibrate('error'),
    selection: () => vibrate('selection'),
  };
}

export default useHaptics;
