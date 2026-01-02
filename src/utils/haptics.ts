/**
 * Haptics Service
 * Provides tactile feedback for user interactions
 * 
 * Supports:
 * - Web Vibration API (navigator.vibrate)
 * - iOS/Android native haptics via Capacitor (future)
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Vibration patterns in milliseconds
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30], // Short-pause-medium
  warning: [30, 50, 30], // Medium-pause-medium
  error: [50, 100, 50, 100, 50], // Long pattern for error
  selection: 5,
};

class HapticsService {
  private supported: boolean;

  constructor() {
    this.supported = this.checkSupport();
  }

  /**
   * Check if haptics are supported on this device
   */
  private checkSupport(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for Vibration API
    if ('vibrate' in navigator) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if haptics are supported
   */
  isSupported(): boolean {
    return this.supported;
  }

  /**
   * Trigger haptic feedback
   */
  trigger(type: HapticType): void {
    if (!this.supported) return;


    try {
      const pattern = HAPTIC_PATTERNS[type];
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger light impact feedback
   */
  triggerLight(): void {
    this.trigger('light');
  }

  /**
   * Trigger medium impact feedback
   */
  triggerMedium(): void {
    this.trigger('medium');
  }

  /**
   * Trigger heavy impact feedback
   */
  triggerHeavy(): void {
    this.trigger('heavy');
  }

  /**
   * Trigger success notification feedback
   */
  triggerSuccess(): void {
    this.trigger('success');
  }

  /**
   * Trigger warning notification feedback
   */
  triggerWarning(): void {
    this.trigger('warning');
  }

  /**
   * Trigger error notification feedback
   */
  triggerError(): void {
    this.trigger('error');
  }

  /**
   * Trigger selection feedback (very light)
   */
  triggerSelection(): void {
    this.trigger('selection');
  }

  /**
   * Trigger impact feedback with custom style
   */
  triggerImpact(style: 'light' | 'medium' | 'heavy'): void {
    this.trigger(style);
  }

  /**
   * Trigger notification feedback with custom type
   */
  triggerNotification(type: 'success' | 'warning' | 'error'): void {
    this.trigger(type);
  }
}

// Export singleton instance
export const haptics = new HapticsService();

// Export class for testing
export { HapticsService };
