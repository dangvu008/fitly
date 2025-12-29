import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { translations, Language } from './translations';

type SupportedLanguage = Language;

/**
 * Property 4: Translation Completeness
 * For any supported language, all navigation label keys SHALL have 
 * a non-empty translation value.
 * 
 * Feature: navigation-restructure
 * **Validates: Requirements 10.1, 10.2**
 */

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['vi', 'en', 'zh', 'ko', 'ja', 'th'];

// Navigation keys that must be present in all languages
const REQUIRED_NAV_KEYS = [
  'nav_home',
  'nav_search', 
  'nav_studio',
  'nav_community',
  'nav_wardrobe',
];

// Monetization keys that must be present
const REQUIRED_MONETIZATION_KEYS = [
  'gems_balance',
  'gems_buy_title',
  'gems_watch_ad',
  'pro_title',
  'pro_subscribe',
  'affiliate_find_similar',
  'affiliate_shop_now',
];

describe('Translation Properties', () => {
  /**
   * Property 4: Translation Completeness
   */
  describe('Property 4: Translation Completeness', () => {
    it('should have all navigation keys in all supported languages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SUPPORTED_LANGUAGES),
          fc.constantFrom(...REQUIRED_NAV_KEYS),
          (language, key) => {
            const langTranslations = translations[language];
            expect(langTranslations).toBeDefined();
            
            const value = langTranslations[key as keyof typeof langTranslations];
            expect(value).toBeDefined();
            expect(typeof value).toBe('string');
            expect((value as string).length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: SUPPORTED_LANGUAGES.length * REQUIRED_NAV_KEYS.length }
      );
    });

    it('should have all monetization keys in all supported languages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SUPPORTED_LANGUAGES),
          fc.constantFrom(...REQUIRED_MONETIZATION_KEYS),
          (language, key) => {
            const langTranslations = translations[language];
            expect(langTranslations).toBeDefined();
            
            const value = langTranslations[key as keyof typeof langTranslations];
            expect(value).toBeDefined();
            expect(typeof value).toBe('string');
            expect((value as string).length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: SUPPORTED_LANGUAGES.length * REQUIRED_MONETIZATION_KEYS.length }
      );
    });

    it('should have consistent key sets across all languages for required keys', () => {
      const allRequiredKeys = [...REQUIRED_NAV_KEYS, ...REQUIRED_MONETIZATION_KEYS];
      
      for (const lang of SUPPORTED_LANGUAGES) {
        const langKeys = Object.keys(translations[lang]);
        
        // All languages should have the required keys
        for (const key of allRequiredKeys) {
          expect(langKeys).toContain(key);
        }
      }
    });
  });
});
