import { useCallback, useMemo } from 'react';
import { haptics, HapticType } from '@/services/haptics';

/**
 * Hook for haptic feedback
 * Provides easy access to haptic feedback in React components
 */
export function useHaptics() {
  const isSupported = useMemo(() => haptics.isSupported(), []);

  const trigger = useCallback((type: HapticType) => {
    haptics.trigger(type);
  }, []);

  const triggerLight = useCallback(() => {
    haptics.triggerLight();
  }, []);

  const triggerMedium = useCallback(() => {
    haptics.triggerMedium();
  }, []);

  const triggerHeavy = useCallback(() => {
    haptics.triggerHeavy();
  }, []);

  const triggerSuccess = useCallback(() => {
    haptics.triggerSuccess();
  }, []);

  const triggerWarning = useCallback(() => {
    haptics.triggerWarning();
  }, []);

  const triggerError = useCallback(() => {
    haptics.triggerError();
  }, []);

  const triggerSelection = useCallback(() => {
    haptics.triggerSelection();
  }, []);

  return {
    isSupported,
    trigger,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSuccess,
    triggerWarning,
    triggerError,
    triggerSelection,
  };
}
