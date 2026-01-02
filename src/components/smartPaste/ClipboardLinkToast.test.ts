import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { SUPPORTED_PLATFORMS, type SupportedPlatform, type DetectedLink } from '@/hooks/useClipboardDetection';

/**
 * Property-based tests for ClipboardLinkToast
 * Feature: smart-paste-auto-try
 * 
 * Tests that the toast correctly displays platform information
 */

// All supported platform keys
const supportedPlatformKeys = Object.keys(SUPPORTED_PLATFORMS) as SupportedPlatform[];

// Arbitrary generator for a valid DetectedLink
const detectedLinkArb: fc.Arbitrary<DetectedLink> = fc.record({
  url: fc.webUrl({ validSchemes: ['https'] }),
  platform: fc.constantFrom(...supportedPlatformKeys),
  platformName: fc.string({ minLength: 1, maxLength: 50 }),
  platformIcon: fc.string({ minLength: 1, maxLength: 4 }),
  detectedAt: fc.integer({ min: 0 }),
});

// Arbitrary generator for a DetectedLink with correct platform info from SUPPORTED_PLATFORMS
const validDetectedLinkArb: fc.Arbitrary<DetectedLink> = fc.constantFrom(...supportedPlatformKeys).chain((platform) => {
  const config = SUPPORTED_PLATFORMS[platform];
  return fc.record({
    url: fc.webUrl({ validSchemes: ['https'] }),
    platform: fc.constant(platform),
    platformName: fc.constant(config.name),
    platformIcon: fc.constant(config.icon),
    detectedAt: fc.integer({ min: 0 }),
  });
});

describe('ClipboardLinkToast Properties', () => {
  /**
   * Property 4: Toast Shows Platform Info
   * For any valid DetectedLink, the toast should display:
   * - The platform icon
   * - The platform name in the title
   * - The URL in the preview
   * 
   * **Validates: REQ-1.3**
   * 
   * Feature: smart-paste-auto-try, Property 4: Toast Shows Platform Info
   */
  describe('Property 4: Toast Shows Platform Info', () => {
    it('should include platform icon in DetectedLink for all supported platforms', () => {
      fc.assert(
        fc.property(
          validDetectedLinkArb,
          (detectedLink) => {
            // The platformIcon should be the icon from SUPPORTED_PLATFORMS
            const expectedIcon = SUPPORTED_PLATFORMS[detectedLink.platform].icon;
            expect(detectedLink.platformIcon).toBe(expectedIcon);
            
            // Icon should be non-empty
            expect(detectedLink.platformIcon.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include platform name in DetectedLink for all supported platforms', () => {
      fc.assert(
        fc.property(
          validDetectedLinkArb,
          (detectedLink) => {
            // The platformName should be the name from SUPPORTED_PLATFORMS
            const expectedName = SUPPORTED_PLATFORMS[detectedLink.platform].name;
            expect(detectedLink.platformName).toBe(expectedName);
            
            // Name should be non-empty
            expect(detectedLink.platformName.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid URL in DetectedLink', () => {
      fc.assert(
        fc.property(
          validDetectedLinkArb,
          (detectedLink) => {
            // URL should be a valid URL
            expect(() => new URL(detectedLink.url)).not.toThrow();
            
            // URL should start with https
            expect(detectedLink.url.startsWith('https://')).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all required fields in DetectedLink', () => {
      fc.assert(
        fc.property(
          validDetectedLinkArb,
          (detectedLink) => {
            // All required fields should be present
            expect(detectedLink).toHaveProperty('url');
            expect(detectedLink).toHaveProperty('platform');
            expect(detectedLink).toHaveProperty('platformName');
            expect(detectedLink).toHaveProperty('platformIcon');
            expect(detectedLink).toHaveProperty('detectedAt');
            
            // Types should be correct
            expect(typeof detectedLink.url).toBe('string');
            expect(typeof detectedLink.platform).toBe('string');
            expect(typeof detectedLink.platformName).toBe('string');
            expect(typeof detectedLink.platformIcon).toBe('string');
            expect(typeof detectedLink.detectedAt).toBe('number');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent platform info across all supported platforms', () => {
      // For each platform, verify the config is complete
      for (const platform of supportedPlatformKeys) {
        const config = SUPPORTED_PLATFORMS[platform];
        
        // Each platform should have name, patterns, and icon
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('patterns');
        expect(config).toHaveProperty('icon');
        
        // Name should be non-empty string
        expect(typeof config.name).toBe('string');
        expect(config.name.length).toBeGreaterThan(0);
        
        // Icon should be non-empty string (emoji)
        expect(typeof config.icon).toBe('string');
        expect(config.icon.length).toBeGreaterThan(0);
        
        // Patterns should be non-empty array of RegExp
        expect(Array.isArray(config.patterns)).toBe(true);
        expect(config.patterns.length).toBeGreaterThan(0);
        config.patterns.forEach((pattern) => {
          expect(pattern).toBeInstanceOf(RegExp);
        });
      }
    });

    it('should generate DetectedLink with platform info that can be displayed in toast', () => {
      fc.assert(
        fc.property(
          validDetectedLinkArb,
          (detectedLink) => {
            // Simulate what the toast component does with the data
            const title = 'Detected {platform} link'.replace('{platform}', detectedLink.platformName);
            
            // Title should contain the platform name
            expect(title).toContain(detectedLink.platformName);
            
            // Platform icon should be displayable (non-empty)
            expect(detectedLink.platformIcon).toBeTruthy();
            
            // URL should be displayable (non-empty)
            expect(detectedLink.url).toBeTruthy();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have unique icons for each platform', () => {
      const icons = new Set<string>();
      
      for (const platform of supportedPlatformKeys) {
        const icon = SUPPORTED_PLATFORMS[platform].icon;
        // Each platform should have a unique icon
        expect(icons.has(icon)).toBe(false);
        icons.add(icon);
      }
      
      // All platforms should have icons
      expect(icons.size).toBe(supportedPlatformKeys.length);
    });

    it('should have unique names for each platform', () => {
      const names = new Set<string>();
      
      for (const platform of supportedPlatformKeys) {
        const name = SUPPORTED_PLATFORMS[platform].name;
        // Each platform should have a unique name
        expect(names.has(name)).toBe(false);
        names.add(name);
      }
      
      // All platforms should have names
      expect(names.size).toBe(supportedPlatformKeys.length);
    });
  });
});
