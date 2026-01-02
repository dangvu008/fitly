import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { getClipboardEnabled, setClipboardEnabled } from './SettingsDialog';

const CLIPBOARD_ENABLED_KEY = 'smart_paste_clipboard_enabled';

/**
 * Property-based tests for Settings Persistence
 * Feature: smart-paste-auto-try
 * 
 * Tests that clipboard detection settings are correctly persisted to localStorage
 */

describe('Settings Persistence Properties', () => {
  // Store original localStorage value to restore after tests
  let originalValue: string | null;

  beforeEach(() => {
    // Save original value
    originalValue = localStorage.getItem(CLIPBOARD_ENABLED_KEY);
    // Clear the setting before each test
    localStorage.removeItem(CLIPBOARD_ENABLED_KEY);
  });

  afterEach(() => {
    // Restore original value
    if (originalValue !== null) {
      localStorage.setItem(CLIPBOARD_ENABLED_KEY, originalValue);
    } else {
      localStorage.removeItem(CLIPBOARD_ENABLED_KEY);
    }
  });

  /**
   * Property 13: Clipboard Setting Is Persisted
   * For any boolean value set via setClipboardEnabled,
   * getClipboardEnabled should return the same value.
   * 
   * **Validates: REQ-13.3**
   * 
   * Feature: smart-paste-auto-try, Property 13: Clipboard Setting Is Persisted
   */
  describe('Property 13: Clipboard Setting Is Persisted', () => {
    it('should persist and retrieve clipboard enabled setting correctly', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (enabled) => {
            // Set the value
            setClipboardEnabled(enabled);
            
            // Retrieve the value
            const retrieved = getClipboardEnabled();
            
            // Should match what was set
            expect(retrieved).toBe(enabled);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist setting to localStorage with correct key', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (enabled) => {
            // Set the value
            setClipboardEnabled(enabled);
            
            // Check localStorage directly
            const storedValue = localStorage.getItem(CLIPBOARD_ENABLED_KEY);
            
            // Should be stored as string
            expect(storedValue).toBe(String(enabled));
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to true when localStorage is empty', () => {
      // Ensure localStorage is empty
      localStorage.removeItem(CLIPBOARD_ENABLED_KEY);
      
      // Should default to enabled
      const result = getClipboardEnabled();
      expect(result).toBe(true);
    });

    it('should handle multiple sequential updates correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (values) => {
            // Apply all values sequentially
            for (const value of values) {
              setClipboardEnabled(value);
            }
            
            // Final value should be the last one set
            const finalValue = values[values.length - 1];
            const retrieved = getClipboardEnabled();
            
            expect(retrieved).toBe(finalValue);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly interpret stored string values', () => {
      // Test that 'false' string is interpreted as false
      localStorage.setItem(CLIPBOARD_ENABLED_KEY, 'false');
      expect(getClipboardEnabled()).toBe(false);
      
      // Test that 'true' string is interpreted as true
      localStorage.setItem(CLIPBOARD_ENABLED_KEY, 'true');
      expect(getClipboardEnabled()).toBe(true);
      
      // Test that any other value defaults to true (not 'false')
      localStorage.setItem(CLIPBOARD_ENABLED_KEY, 'invalid');
      expect(getClipboardEnabled()).toBe(true);
    });

    it('should maintain setting across get/set cycles', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 2, maxLength: 5 }),
          (values) => {
            for (const value of values) {
              // Set value
              setClipboardEnabled(value);
              
              // Immediately verify it was persisted
              const retrieved = getClipboardEnabled();
              expect(retrieved).toBe(value);
              
              // Also verify localStorage directly
              const stored = localStorage.getItem(CLIPBOARD_ENABLED_KEY);
              expect(stored).toBe(String(value));
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
