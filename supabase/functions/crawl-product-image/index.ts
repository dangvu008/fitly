import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawlRequest {
  url: string;
  platform?: string;
  removeBackground?: boolean;
}

interface CrawlResponse {
  success: boolean;
  productImage?: string;
  backgroundRemovedImage?: string;
  productName?: string;
  productPrice?: string;
  platform: string;
  error?: string;
}

/**
 * Remove background from image using Hugging Face Inference API
 * Uses the RMBG-1.4 model for high-quality background removal
 */
async function removeImageBackground(imageUrl: string): Promise<string | null> {
  const huggingFaceApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
  
  if (!huggingFaceApiKey) {
    console.warn('[crawl-product-image] HUGGINGFACE_API_KEY not set, skipping background removal');
    return null;
  }

  try {
    console.log('[crawl-product-image] Fetching image for background removal...');
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    if (!imageResponse.ok) {
      console.error(`[crawl-product-image] Failed to fetch image: ${imageResponse.status}`);
      return null;
    }

    const imageBlob = await imageResponse.blob();
    
    console.log('[crawl-product-image] Calling Hugging Face RMBG API...');
    
    // Call Hugging Face Inference API with RMBG-1.4 model
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceApiKey}`,
        },
        body: imageBlob,
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error(`[crawl-product-image] HF API error: ${hfResponse.status} - ${errorText}`);
      
      // If model is loading, we could retry but for now just return null
      if (hfResponse.status === 503) {
        console.warn('[crawl-product-image] Model is loading, skipping background removal');
      }
      return null;
    }

    // Get the result as blob and convert to base64
    const resultBlob = await hfResponse.blob();
    const arrayBuffer = await resultBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const mimeType = resultBlob.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    console.log('[crawl-product-image] Background removal successful');
    return dataUrl;
    
  } catch (error) {
    console.error('[crawl-product-image] Background removal error:', error);
    return null;
  }
}

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): string {
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
function extractProductImage(html: string, platform: string): string | null {
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
function extractProductName(html: string): string | null {
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
function extractProductPrice(html: string): string | null {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform: providedPlatform, removeBackground: shouldRemoveBackground }: CrawlRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required', platform: 'unknown' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL', platform: 'unknown' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const platform = providedPlatform || detectPlatform(url);

    console.log(`[crawl-product-image] Crawling ${platform}: ${url}`);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`[crawl-product-image] Fetch failed: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch page: ${response.status}`,
          platform 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract product info
    const productImage = extractProductImage(html, platform);
    const productName = extractProductName(html);
    const productPrice = extractProductPrice(html);

    if (!productImage) {
      console.error('[crawl-product-image] No product image found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No product image found',
          platform 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[crawl-product-image] Found image: ${productImage.substring(0, 100)}...`);

    // Optionally remove background from the product image
    let backgroundRemovedImage: string | undefined;
    if (shouldRemoveBackground) {
      console.log('[crawl-product-image] Attempting background removal...');
      const removedBgResult = await removeImageBackground(productImage);
      if (removedBgResult) {
        backgroundRemovedImage = removedBgResult;
      }
    }

    const result: CrawlResponse = {
      success: true,
      productImage,
      backgroundRemovedImage,
      productName: productName || undefined,
      productPrice: productPrice || undefined,
      platform,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[crawl-product-image] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
