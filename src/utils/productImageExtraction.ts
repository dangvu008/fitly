/**
 * Product Image Extraction Utilities
 * 
 * Pure functions for extracting product information from HTML.
 * These mirror the logic in supabase/functions/crawl-product-image/index.ts
 * and are exported for testing purposes.
 */

export type SupportedPlatform = 'shopee' | 'lazada' | 'tiktok' | 'zara' | 'amazon' | 'hm' | 'uniqlo' | 'unknown';

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): SupportedPlatform {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('shopee')) return 'shopee';
  if (urlLower.includes('lazada')) return 'lazada';
  if (urlLower.includes('tiktok')) return 'tiktok';
  if (urlLower.includes('zara')) return 'zara';
  if (urlLower.includes('amazon') || urlLower.includes('amzn')) return 'amazon';
  if (urlLower.includes('hm.com')) return 'hm';
  if (urlLower.includes('uniqlo')) return 'uniqlo';
  
  return 'unknown';
}

/**
 * Extract product image from HTML using meta tags
 */
export function extractProductImage(html: string, platform: SupportedPlatform): string | null {
  // Try og:image first (most reliable)
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  
  if (ogImageMatch?.[1]) {
    return ogImageMatch[1];
  }

  // Try twitter:image
  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  
  if (twitterImageMatch?.[1]) {
    return twitterImageMatch[1];
  }

  // Platform-specific selectors
  if (platform === 'shopee') {
    // Shopee product image pattern
    const shopeeMatch = html.match(/["']image["']\s*:\s*["']([^"']+)["']/i);
    if (shopeeMatch?.[1]) return shopeeMatch[1];
  }

  if (platform === 'zara') {
    // Zara uses data-src or src in product images
    const zaraMatch = html.match(/class=["'][^"']*media-image[^"']*["'][^>]*src=["']([^"']+)["']/i);
    if (zaraMatch?.[1]) return zaraMatch[1];
  }

  // Generic: try to find first large image
  const imgMatch = html.match(/<img[^>]*src=["'](https?:\/\/[^"']+(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i);
  if (imgMatch?.[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Extract product name from HTML
 */
export function extractProductName(html: string): string | null {
  // Try og:title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  
  if (ogTitleMatch?.[1]) {
    return ogTitleMatch[1].trim();
  }

  // Try title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }

  return null;
}

/**
 * Extract product price from HTML
 */
export function extractProductPrice(html: string): string | null {
  // Try og:price:amount
  const priceMatch = html.match(/<meta[^>]*property=["'](?:og:price:amount|product:price:amount)["'][^>]*content=["']([^"']+)["']/i);
  
  if (priceMatch?.[1]) {
    return priceMatch[1];
  }

  // Try common price patterns
  const pricePatterns = [
    /["']price["']\s*:\s*["']?(\d+(?:[.,]\d+)?)["']?/i,
    /class=["'][^"']*price[^"']*["'][^>]*>([^<]*\d+[^<]*)</i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Validate if a URL is a valid product URL
 */
export function isValidProductUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if extracted image URL is valid
 */
export function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  
  // Check for common image extensions or data URLs
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const urlLower = url.toLowerCase();
  
  // Data URLs are valid
  if (url.startsWith('data:image/')) return true;
  
  // Check for image extensions
  if (imageExtensions.some(ext => urlLower.includes(ext))) return true;
  
  // CDN URLs often don't have extensions but are still valid
  // Check for common CDN patterns
  const cdnPatterns = [
    /cloudinary/i,
    /cloudfront/i,
    /imgix/i,
    /shopee/i,
    /lazada/i,
    /zara/i,
    /amazon/i,
    /images\./i,
    /img\./i,
    /cdn\./i,
  ];
  
  return cdnPatterns.some(pattern => pattern.test(url));
}
