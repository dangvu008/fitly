import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectShoppingPlatform, SUPPORTED_PLATFORMS, SupportedPlatform } from './useClipboardDetection';

/**
 * Property-based tests for Shopping Link Detection
 * Feature: smart-paste-auto-try
 * 
 * Tests that valid shopping URLs from supported platforms are correctly detected
 */

// All supported platform keys
const supportedPlatformKeys = Object.keys(SUPPORTED_PLATFORMS) as SupportedPlatform[];

// Sample domains for each platform (used to generate valid URLs)
const platformDomains: Record<SupportedPlatform, string[]> = {
  shopee: ['shopee.vn', 'shopee.co.th', 'shopee.sg', 'shopee.com.my', 'shopee.co.id'],
  lazada: ['lazada.vn', 'lazada.co.th', 'lazada.sg', 'lazada.com.my', 'lazada.co.id'],
  tiktok: ['tiktok.com/shop/product', 'tiktokshop.com'],
  zara: ['zara.com'],
  amazon: ['amazon.com', 'amazon.vn', 'amazon.co.jp', 'amzn.to'],
  hm: ['hm.com', 'www2.hm.com'],
  uniqlo: ['uniqlo.com'],
};

// Arbitrary generator for a valid shopping URL from a specific platform
function validShoppingUrlArb(platform: SupportedPlatform): fc.Arbitrary<string> {
  const domains = platformDomains[platform];
  return fc.tuple(
    fc.constantFrom(...domains),
    fc.stringMatching(/^[a-z0-9-]{0,30}$/), // path segment
    fc.option(fc.stringMatching(/^[a-z0-9]{1,20}$/), { nil: undefined }) // optional product id
  ).map(([domain, path, productId]) => {
    let url = `https://${domain}`;
    if (path) url += `/${path}`;
    if (productId) url += `/${productId}`;
    return url;
  });
}

// Arbitrary generator for any valid shopping URL
const anyValidShoppingUrlArb: fc.Arbitrary<{ url: string; expectedPlatform: SupportedPlatform }> = 
  fc.constantFrom(...supportedPlatformKeys).chain((platform) =>
    validShoppingUrlArb(platform).map((url) => ({
      url,
      expectedPlatform: platform,
    }))
  );

// Arbitrary generator for non-shopping URLs
const nonShoppingUrlArb: fc.Arbitrary<string> = fc.oneof(
  // Generic websites
  fc.constantFrom(
    'https://google.com',
    'https://facebook.com/post/123',
    'https://twitter.com/user/status/456',
    'https://youtube.com/watch?v=abc',
    'https://github.com/user/repo',
    'https://stackoverflow.com/questions/123',
    'https://medium.com/@user/article',
    'https://reddit.com/r/fashion',
    'https://instagram.com/p/abc123',
    'https://pinterest.com/pin/123'
  ),
  // Random domains
  fc.webUrl({ validSchemes: ['https'] }).filter((url) => {
    // Filter out any URL that might match our supported platforms
    return !supportedPlatformKeys.some((platform) =>
      SUPPORTED_PLATFORMS[platform].patterns.some((pattern) => pattern.test(url))
    );
  })
);

// Arbitrary generator for invalid URLs (not valid URL format)
const invalidUrlArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant('not a url'),
  fc.constant('just some text'),
  fc.constant('shopee without protocol'),
  fc.constant('http://'), // incomplete URL
  fc.constant('://missing-protocol.com'),
  fc.stringMatching(/^[a-z ]{5,50}$/), // random text
  fc.constant(''),
  fc.constant('   '),
);

describe('Shopping Link Detection Properties', () => {
  /**
   * Property 3: Valid Shopping URLs Are Detected
   * For any valid URL from a supported shopping platform,
   * the detectShoppingPlatform function should correctly identify the platform.
   * 
   * **Validates: REQ-1.2**
   * 
   * Feature: smart-paste-auto-try, Property 3: Valid Shopping URLs Are Detected
   */
  describe('Property 3: Valid Shopping URLs Are Detected', () => {
    it('should detect Shopee URLs correctly', () => {
      fc.assert(
        fc.property(
          validShoppingUrlArb('shopee'),
          (url) => {
            const result = detectShoppingPlatform(url);
            
            // Should detect the URL
            expect(result).not.toBeNull();
            // Should identify as Shopee
            expect(result?.platform).toBe('shopee');
            expect(result?.name).toBe('Shopee');
            expect(result?.icon).toBe('🛒');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect Lazada URLs correctly', () => {
      fc.assert(
        fc.property(
          validShoppingUrlArb('lazada'),
          (url) => {
            const result = detectShoppingPlatform(url);
            
            expect(result).not.toBeNull();
            expect(result?.platform).toBe('lazada');
            expect(result?.name).toBe('Lazada');
            expect(result?.icon).toBe('🛍️');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect TikTok Shop URLs correctly', () => {
      fc.assert(
        fc.property(
          validShoppingUrlArb('tiktok'),
          (url) => {
            const result = detectShoppingPlatform(url);
            
            expect(result).not.toBeNull();
            expect(result?.platform).toBe('tiktok');
            expect(result?.name).toBe('TikTok Shop');
            expect(result?.icon).toBe('🎵');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect Zara URLs correctly', () => {
      fc.assert(
        fc.property(
          validShoppingUrlArb('zara'),
          (url) => {
            const result = detectShoppingPlatform(url);
            
            expect(result).not.toBeNull();
            expect(result?.platform).toBe('zara');
            expect(result?.name).toBe('Zara');
            expect(result?.icon).toBe('👗');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect Amazon URLs correctly', () => {
      fc.assert(
        fc.property(
          validShoppingUrlArb('amazon'),
          (url) => {
            const result = detectShoppingPlatform(url);
            
            expect(result).not.toBeNull();
            expect(result?.platform).toBe('amazon');
            expect(result?.name).toBe('Amazon');
            expect(result?.icon).toBe('📦');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect H&M URLs correctly', () => {
      fc.assert(
        fc.property(
          validShoppingUrlArb('hm'),
          (url) => {
            const result = detectShoppingPlatform(url);
            
            expect(result).not.toBeNull();
            expect(result?.platform).toBe('hm');
            expect(result?.name).toBe('H&M');
            expect(result?.icon).toBe('👔');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect Uniqlo URLs correctly', () => {
      fc.assert(
        fc.property(
          validShoppingUrlArb('uniqlo'),
          (url) => {
            const result = detectShoppingPlatform(url);
            
            expect(result).not.toBeNull();
            expect(result?.platform).toBe('uniqlo');
            expect(result?.name).toBe('Uniqlo');
            expect(result?.icon).toBe('🧥');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect any valid shopping URL and return correct platform', () => {
      fc.assert(
        fc.property(
          anyValidShoppingUrlArb,
          ({ url, expectedPlatform }) => {
            const result = detectShoppingPlatform(url);
            
            // Should detect the URL
            expect(result).not.toBeNull();
            // Should identify the correct platform
            expect(result?.platform).toBe(expectedPlatform);
            // Should return platform name from config
            expect(result?.name).toBe(SUPPORTED_PLATFORMS[expectedPlatform].name);
            // Should return platform icon from config
            expect(result?.icon).toBe(SUPPORTED_PLATFORMS[expectedPlatform].icon);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for non-shopping URLs', () => {
      fc.assert(
        fc.property(
          nonShoppingUrlArb,
          (url) => {
            const result = detectShoppingPlatform(url);
            
            // Should not detect non-shopping URLs
            expect(result).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for invalid URL formats', () => {
      fc.assert(
        fc.property(
          invalidUrlArb,
          (url) => {
            const result = detectShoppingPlatform(url);
            
            // Should not detect invalid URLs
            expect(result).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive for domain matching', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...supportedPlatformKeys),
          fc.constantFrom('lowercase', 'UPPERCASE', 'MixedCase'),
          (platform, caseType) => {
            const domains = platformDomains[platform];
            const domain = domains[0];
            
            let testDomain: string;
            switch (caseType) {
              case 'UPPERCASE':
                testDomain = domain.toUpperCase();
                break;
              case 'MixedCase':
                testDomain = domain.split('').map((c, i) => 
                  i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
                ).join('');
                break;
              default:
                testDomain = domain.toLowerCase();
            }
            
            const url = `https://${testDomain}/product/123`;
            const result = detectShoppingPlatform(url);
            
            // Should detect regardless of case
            expect(result).not.toBeNull();
            expect(result?.platform).toBe(platform);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle URLs with various path structures', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...supportedPlatformKeys),
          fc.array(fc.stringMatching(/^[a-z0-9-]{1,15}$/), { minLength: 0, maxLength: 5 }),
          fc.option(fc.stringMatching(/^[a-z0-9]{1,10}=[a-z0-9]{1,10}$/), { nil: undefined }),
          (platform, pathSegments, queryParam) => {
            const domain = platformDomains[platform][0];
            let url = `https://${domain}`;
            
            if (pathSegments.length > 0) {
              url += '/' + pathSegments.join('/');
            }
            
            if (queryParam) {
              url += '?' + queryParam;
            }
            
            const result = detectShoppingPlatform(url);
            
            // Should detect regardless of path structure
            expect(result).not.toBeNull();
            expect(result?.platform).toBe(platform);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle URLs with subdomains', () => {
      // Test specific subdomain cases
      const subdomainCases = [
        { url: 'https://www.shopee.vn/product', platform: 'shopee' },
        { url: 'https://m.shopee.vn/product', platform: 'shopee' },
        { url: 'https://www.zara.com/vn/en/dress', platform: 'zara' },
        { url: 'https://www.amazon.com/dp/B123', platform: 'amazon' },
        { url: 'https://www2.hm.com/en_us/product', platform: 'hm' },
      ];
      
      for (const { url, platform } of subdomainCases) {
        const result = detectShoppingPlatform(url);
        expect(result).not.toBeNull();
        expect(result?.platform).toBe(platform);
      }
    });
  });
});
