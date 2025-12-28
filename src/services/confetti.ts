/**
 * Confetti Service
 * Provides celebratory animations for success events
 * 
 * Uses canvas-confetti library
 */

import confetti from 'canvas-confetti';

export interface ConfettiConfig {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  duration?: number;
}

// Default colors for different events
const COLORS = {
  success: ['#8E2DE2', '#4A00E0', '#FFD700', '#ff6b9d', '#7ed6df'],
  upgrade: ['#FFD700', '#FFA500', '#8E2DE2', '#4A00E0', '#ffffff'],
  celebration: ['#ff6b9d', '#c44569', '#f8b500', '#7ed6df', '#686de0'],
};

class ConfettiService {
  /**
   * Fire confetti with custom configuration
   */
  fire(config?: ConfettiConfig): void {
    const duration = config?.duration || 2000;
    const end = Date.now() + duration;
    const particleCount = config?.particleCount || 3;
    const spread = config?.spread || 55;
    const colors = config?.colors || COLORS.success;
    const origin = config?.origin || { x: 0.5, y: 0.7 };

    const frame = () => {
      // Left side
      confetti({
        particleCount,
        angle: 60,
        spread,
        origin: { x: 0, y: origin.y },
        colors,
      });
      
      // Right side
      confetti({
        particleCount,
        angle: 120,
        spread,
        origin: { x: 1, y: origin.y },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }

  /**
   * Fire confetti for payment success
   * Duration: ~2 seconds
   */
  fireSuccess(): void {
    this.fire({
      particleCount: 3,
      spread: 55,
      colors: COLORS.success,
      duration: 2000,
      origin: { x: 0.5, y: 0.7 },
    });
  }

  /**
   * Fire confetti for Pro upgrade
   * Duration: ~3 seconds, more particles
   */
  fireUpgrade(): void {
    this.fire({
      particleCount: 5,
      spread: 70,
      colors: COLORS.upgrade,
      duration: 3000,
      origin: { x: 0.5, y: 0.6 },
    });
  }

  /**
   * Fire confetti for general celebration
   * Duration: ~2 seconds
   */
  fireCelebration(): void {
    this.fire({
      particleCount: 4,
      spread: 60,
      colors: COLORS.celebration,
      duration: 2000,
      origin: { x: 0.5, y: 0.7 },
    });
  }

  /**
   * Fire a single burst of confetti from center
   */
  fireBurst(): void {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors: COLORS.success,
    });
  }
}

// Export singleton instance
export const confettiService = new ConfettiService();

// Export class for testing
export { ConfettiService };
