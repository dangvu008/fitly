import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  detectPlatform,
  extractProductImage,
  extractProductName,
  extractProductPrice,
  isValidProductUrl,
  isValidImageUrl,
  SupportedPlatform,
} from './productImageExtraction';

/**
 * Property-based tests for Product Image Extraction
 * Feature: smart-paste-auto-try
 * 
 * Property 5: Valid Product URL Returns Image
 * Tests that HTML containing valid og:image meta tags returns the correct image URL
 * 
 * **Validates: REQ-2.1, REQ-2.3**
 */

// Supported platforms for testing
const supportedPlatforms: SupportedPlatform[] = ['shopee', 'lazada', 'tiktok', 'zara', 'amazon', 'hm', 'uniqlo'];

// Platform domain mappings
const platformDomains: Record<SupportedPlatform, string[]> = {
  shopee: ['shopee.vn', 'shopee.co.th', 'shopee.sg'],
  lazada: ['lazada.vn', 'lazada.co.th', 'lazada.sg'],
  tiktok: ['tiktok.com', 'tiktokshop.com'],
  zara: ['zara.com'],
  amazon: ['amazon.com', 'amazon.vn', 'amzn.to'],
  hm: ['hm.com', 'www2.hm.com'],
  uniqlo: ['uniqlo.com'],
  unknown: ['example.com'],
};

// Image extensions for generating valid image URLs
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

// Arbitrary generator for valid image URLs
const validImageUrlArb: fc.Arbitrary<string> = fc.tuple(
  fc.constantFrom('https://cdn.example.com', 'https://images.shopee.vn', 'https://img.lazada.vn', 'https://static.zara.net'),
  fc.stringMatching(/^[a-z0-9-]{1,20}$/),
  fc.constantFrom(...imageExtensions)
).map(([domain, path, ext]) => `${domain}/product/${path}${ext}`);

// Arbitrary generator for product names
const productNameArb: fc.Arbitrary<string> = fc.stringMatching(/^[A-Za-z0-9 ]{5,50}$/)
  .filter(s => s.trim().length > 0);

// Arbitrary generator for product prices
const productPriceArb: fc.Arbitrary<string> = fc.oneof(
  fc.integer({ min: 1, max: 9999999 }).map(n => n.toString()),
  fc.tuple(fc.integer({ min: 1, max: 9999 }), fc.integer({ min: 0, max: 99 }))
    .map(([whole, decimal]) => `${whole}.${decimal.toString().padStart(2, '0')}`)
);

// Generate HTML with og:image meta tag
function generateHtmlWithOgImage(imageUrl: string, productName?: string, productPrice?: string): string {
  let html = '<!DOCTYPE html><html><head>';
  
  html += `<meta property="og:image" content="${imageUrl}">`;
  
  if (productName) {
    html += `<meta property="og:title" content="${productName}">`;
  }
  
  if (productPrice) {
    html += `<meta property="og:price:amount" content="${productPrice}">`;
  }
  
  html += '</head><body></body></html>';
  return html;
}

// Generate HTML with twitter:image meta tag
function generateHtmlWithTwitterImage(imageUrl: string): string {
  return `<!DOCTYPE html><html><head><meta name="twitter:image" content="${imageUrl}"></head><body></body></html>`;
}

// Generate HTML with img tag only (fallback)
function generateHtmlWithImgTag(imageUrl: string): string {
  return `<!DOCTYPE html><html><head></head><body><img src="${imageUrl}" alt="Product"></body></html>`;
}

// Generate HTML with Shopee-specific JSON pattern
function generateShopeeHtml(imageUrl: string): string {
  return `<!DOCTYPE html><html><head></head><body><script>{"image": "${imageUrl}"}</script></body></html>`;
}

// Generate HTML with Zara-specific pattern
function generateZaraHtml(imageUrl: string): string {
  return `<!DOCTYPE html><html><head></head><body><div class="media-image" src="${imageUrl}"></div></body></html>`;
}

// Generate HTML without any image
function generateHtmlWithoutImage(): string {
  return '<!DOCTYPE html><html><head><title>No Image Page</title></head><body><p>No product here</p></body></html>';
}

// Arbitrary for platform URLs
const platformUrlArb = (platform: SupportedPlatform): fc.Arbitrary<string> => {
  const domains = platformDomains[platform] || ['example.com'];
  return fc.tuple(
    fc.constantFrom(...domains),
    fc.stringMatching(/^[a-z0-9-]{1,15}$/)
  ).map(([domain, path]) => `https://${domain}/product/${path}`);
};

describe('Product Image Extraction Properties', () => {
  /**
   * Property 5: Valid Product URL Returns Image
   * For any HTML containing a valid og:image meta tag,
   * the extractProductImage function should return the image URL.
   * 
   * **Validates: REQ-2.1, REQ-2.3**
   * 
   * Feature: smart-paste-auto-try, Property 5: Valid Product URL Returns Image
   */
  describe('Property 5: Valid Product URL Returns Image', () => {
    it('should extract og:image from HTML for any valid image URL', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          fc.constantFrom<SupportedPlatform>(...supportedPlatforms, 'unknown'),
          (imageUrl, platform) => {
            const html = generateHtmlWithOgImage(imageUrl);
            const result = extractProductImage(html, platform);
            
            // Should extract the image URL
            expect(result).toBe(imageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract twitter:image when og:image is not present', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          fc.constantFrom<SupportedPlatform>(...supportedPlatforms, 'unknown'),
          (imageUrl, platform) => {
            const html = generateHtmlWithTwitterImage(imageUrl);
            const result = extractProductImage(html, platform);
            
            // Should extract the twitter:image URL
            expect(result).toBe(imageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract image from img tag as fallback', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          fc.constantFrom<SupportedPlatform>(...supportedPlatforms, 'unknown'),
          (imageUrl, platform) => {
            const html = generateHtmlWithImgTag(imageUrl);
            const result = extractProductImage(html, platform);
            
            // Should extract the img src URL
            expect(result).toBe(imageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when no image is found in HTML', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<SupportedPlatform>(...supportedPlatforms, 'unknown'),
          (platform) => {
            const html = generateHtmlWithoutImage();
            const result = extractProductImage(html, platform);
            
            // Should return null when no image found
            expect(result).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect correct platform from URL', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<SupportedPlatform>(...supportedPlatforms),
          (expectedPlatform) => {
            const domains = platformDomains[expectedPlatform];
            const domain = domains[0];
            const url = `https://${domain}/product/123`;
            
            const result = detectPlatform(url);
            
            // Should detect the correct platform
            expect(result).toBe(expectedPlatform);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract product name from og:title', () => {
      fc.assert(
        fc.property(
          productNameArb,
          (productName) => {
            const html = generateHtmlWithOgImage('https://example.com/image.jpg', productName);
            const result = extractProductName(html);
            
            // Should extract the product name (trimmed)
            expect(result).toBe(productName.trim());
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract product price from og:price:amount', () => {
      fc.assert(
        fc.property(
          productPriceArb,
          (productPrice) => {
            const html = generateHtmlWithOgImage('https://example.com/image.jpg', undefined, productPrice);
            const result = extractProductPrice(html);
            
            // Should extract the product price
            expect(result).toBe(productPrice);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Shopee-specific JSON image pattern', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          (imageUrl) => {
            const html = generateShopeeHtml(imageUrl);
            const result = extractProductImage(html, 'shopee');
            
            // Should extract the image from Shopee JSON pattern
            expect(result).toBe(imageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Zara-specific media-image pattern', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          (imageUrl) => {
            const html = generateZaraHtml(imageUrl);
            const result = extractProductImage(html, 'zara');
            
            // Should extract the image from Zara pattern
            expect(result).toBe(imageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate product URLs correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<SupportedPlatform>(...supportedPlatforms),
          (platform) => {
            const domains = platformDomains[platform];
            const domain = domains[0];
            const url = `https://${domain}/product/123`;
            
            const result = isValidProductUrl(url);
            
            // Should be a valid product URL
            expect(result).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid URLs', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('not a url'),
            fc.constant('just some text'),
            fc.constant(''),
            fc.constant('   '),
            fc.constant('ftp://invalid.com'),
            fc.stringMatching(/^[a-z ]{5,30}$/)
          ),
          (invalidUrl) => {
            const result = isValidProductUrl(invalidUrl);
            
            // Should reject invalid URLs
            expect(result).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate image URLs correctly', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          (imageUrl) => {
            const result = isValidImageUrl(imageUrl);
            
            // Should be a valid image URL
            expect(result).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle og:image with different attribute orders', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          fc.boolean(),
          (imageUrl, propertyFirst) => {
            // Test both attribute orders: property first or content first
            const html = propertyFirst
              ? `<html><head><meta property="og:image" content="${imageUrl}"></head></html>`
              : `<html><head><meta content="${imageUrl}" property="og:image"></head></html>`;
            
            const result = extractProductImage(html, 'unknown');
            
            // Should extract regardless of attribute order
            expect(result).toBe(imageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive for meta tag matching', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          fc.constantFrom('og:image', 'OG:IMAGE', 'Og:Image', 'oG:iMaGe'),
          (imageUrl, propertyCase) => {
            const html = `<html><head><meta property="${propertyCase}" content="${imageUrl}"></head></html>`;
            const result = extractProductImage(html, 'unknown');
            
            // Should extract regardless of case
            expect(result).toBe(imageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize og:image over other sources', () => {
      fc.assert(
        fc.property(
          validImageUrlArb,
          validImageUrlArb,
          (ogImageUrl, twitterImageUrl) => {
            // Ensure URLs are different
            fc.pre(ogImageUrl !== twitterImageUrl);
            
            const html = `<html><head>
              <meta property="og:image" content="${ogImageUrl}">
              <meta name="twitter:image" content="${twitterImageUrl}">
            </head></html>`;
            
            const result = extractProductImage(html, 'unknown');
            
            // Should prioritize og:image
            expect(result).toBe(ogImageUrl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
