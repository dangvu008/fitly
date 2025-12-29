import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  platform: 'amazon' | 'shopee' | 'other';
  similarity: number;
}

interface VisualSearchResult {
  products: Product[];
  searchProvider: 'google' | 'bing' | 'fallback';
  searchId: string;
}

// Generate unique search ID
function generateSearchId(): string {
  return `vs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Generate image hash for caching
function generateImageHash(imageData: string): string {
  const sample = imageData.slice(0, 500) + imageData.slice(-500);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `img_${Math.abs(hash).toString(36)}`;
}

// Add affiliate tracking to URLs
function addAffiliateTracking(url: string, platform: string, userId?: string): string {
  const amazonTag = Deno.env.get('AMAZON_AFFILIATE_TAG') || 'tryon-20';
  const shopeeId = Deno.env.get('SHOPEE_AFFILIATE_ID') || '';
  
  try {
    const urlObj = new URL(url);
    
    if (platform === 'amazon' || urlObj.hostname.includes('amazon')) {
      urlObj.searchParams.set('tag', amazonTag);
      if (userId) urlObj.searchParams.set('ref', userId);
      return urlObj.toString();
    }
    
    if (platform === 'shopee' || urlObj.hostname.includes('shopee')) {
      if (shopeeId) urlObj.searchParams.set('af_id', shopeeId);
      if (userId) urlObj.searchParams.set('utm_source', `tryon_${userId}`);
      return urlObj.toString();
    }
    
    // Generic tracking
    if (userId) urlObj.searchParams.set('ref', `tryon_${userId}`);
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Google Vision Product Search
async function searchWithGoogleVision(imageBase64: string): Promise<Product[]> {
  const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
  const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
  
  if (!apiKey || !projectId) {
    console.log('Google Vision API not configured');
    return [];
  }

  try {
    // Use Google Cloud Vision API for product search
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64.replace(/^data:image\/\w+;base64,/, '') },
            features: [
              { type: 'PRODUCT_SEARCH', maxResults: 10 },
              { type: 'WEB_DETECTION', maxResults: 10 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      console.error('Google Vision API error:', response.status);
      return [];
    }

    const data = await response.json();
    const products: Product[] = [];

    // Parse web detection results
    const webDetection = data.responses?.[0]?.webDetection;
    if (webDetection?.visuallySimilarImages) {
      webDetection.visuallySimilarImages.slice(0, 5).forEach((img: any, index: number) => {
        products.push({
          id: `google_${index}`,
          name: 'Similar Item',
          price: 0,
          currency: 'USD',
          imageUrl: img.url,
          productUrl: img.url,
          platform: 'other',
          similarity: 0.9 - (index * 0.1)
        });
      });
    }

    // Parse product search results if available
    const productResults = data.responses?.[0]?.productSearchResults?.results;
    if (productResults) {
      productResults.forEach((result: any, index: number) => {
        products.push({
          id: `google_product_${index}`,
          name: result.product?.displayName || 'Product',
          price: 0,
          currency: 'USD',
          imageUrl: result.image || '',
          productUrl: result.product?.productUri || '',
          platform: 'other',
          similarity: result.score || 0.8
        });
      });
    }

    return products;
  } catch (error) {
    console.error('Google Vision search error:', error);
    return [];
  }
}

// Bing Visual Search fallback
async function searchWithBingVisual(imageBase64: string): Promise<Product[]> {
  const apiKey = Deno.env.get('BING_SEARCH_API_KEY');
  
  if (!apiKey) {
    console.log('Bing Visual Search API not configured');
    return [];
  }

  try {
    // Convert base64 to blob for Bing API
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    
    const formData = new FormData();
    formData.append('image', new Blob([binaryData], { type: 'image/jpeg' }));

    const response = await fetch(
      'https://api.bing.microsoft.com/v7.0/images/visualsearch',
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        body: formData
      }
    );

    if (!response.ok) {
      console.error('Bing Visual Search API error:', response.status);
      return [];
    }

    const data = await response.json();
    const products: Product[] = [];

    // Parse Bing visual search results
    const tags = data.tags || [];
    for (const tag of tags) {
      const actions = tag.actions || [];
      for (const action of actions) {
        if (action.actionType === 'VisualSearch' || action.actionType === 'ProductVisualSearch') {
          const items = action.data?.value || [];
          items.slice(0, 5).forEach((item: any, index: number) => {
            // Detect platform from URL
            let platform: 'amazon' | 'shopee' | 'other' = 'other';
            if (item.hostPageUrl?.includes('amazon')) platform = 'amazon';
            if (item.hostPageUrl?.includes('shopee')) platform = 'shopee';

            products.push({
              id: `bing_${index}`,
              name: item.name || 'Similar Item',
              price: item.aggregateOffer?.lowPrice || 0,
              currency: item.aggregateOffer?.priceCurrency || 'USD',
              imageUrl: item.contentUrl || item.thumbnailUrl || '',
              productUrl: item.hostPageUrl || '',
              platform,
              similarity: 0.85 - (index * 0.1)
            });
          });
        }
      }
    }

    return products;
  } catch (error) {
    console.error('Bing Visual search error:', error);
    return [];
  }
}

// Fallback sample products when APIs fail
function getFallbackProducts(): Product[] {
  return [
    {
      id: 'sample_1',
      name: 'Similar Style Top',
      price: 29.99,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
      productUrl: 'https://amazon.com/dp/example1',
      platform: 'amazon',
      similarity: 0.75
    },
    {
      id: 'sample_2', 
      name: 'Trendy Fashion Item',
      price: 459000,
      currency: 'VND',
      imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300',
      productUrl: 'https://shopee.vn/product/example2',
      platform: 'shopee',
      similarity: 0.70
    },
    {
      id: 'sample_3',
      name: 'Classic Design',
      price: 39.99,
      currency: 'USD', 
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300',
      productUrl: 'https://amazon.com/dp/example3',
      platform: 'amazon',
      similarity: 0.65
    }
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting visual search...');

    const { imageUrl, imageBase64, userId } = await req.json();
    
    // Get image data - either from URL or base64
    let imageData = imageBase64;
    if (!imageData && imageUrl) {
      try {
        const imgResponse = await fetch(imageUrl);
        const arrayBuffer = await imgResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        imageData = `data:image/jpeg;base64,${base64}`;
      } catch (err) {
        console.error('Failed to fetch image from URL:', err);
      }
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image URL or base64 data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchId = generateSearchId();
    const imageHash = generateImageHash(imageData);
    let products: Product[] = [];
    let searchProvider: 'google' | 'bing' | 'fallback' = 'fallback';

    // Try Google Vision first
    console.log('Trying Google Vision API...');
    products = await searchWithGoogleVision(imageData);
    if (products.length > 0) {
      searchProvider = 'google';
      console.log(`Google Vision found ${products.length} products`);
    }

    // Fallback to Bing if Google fails
    if (products.length === 0) {
      console.log('Trying Bing Visual Search API...');
      products = await searchWithBingVisual(imageData);
      if (products.length > 0) {
        searchProvider = 'bing';
        console.log(`Bing found ${products.length} products`);
      }
    }

    // Use fallback products if both APIs fail
    if (products.length === 0) {
      console.log('Using fallback products');
      products = getFallbackProducts();
      searchProvider = 'fallback';
    }

    // Add affiliate tracking to all product URLs
    products = products.map(product => ({
      ...product,
      productUrl: addAffiliateTracking(product.productUrl, product.platform, userId)
    }));

    // Log search to database for analytics
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error: insertError } = await supabase.from('visual_searches').insert({
          search_id: searchId,
          user_id: userId || null,
          image_hash: imageHash,
          search_provider: searchProvider,
          results_count: products.length,
          created_at: new Date().toISOString()
        });
        if (insertError) {
          console.log('Failed to log search:', insertError);
        }
      }
    } catch (err) {
      console.log('Analytics logging skipped:', err);
    }

    const result: VisualSearchResult = {
      products,
      searchProvider,
      searchId
    };

    console.log(`Visual search complete: ${products.length} products from ${searchProvider}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in visual-search:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        products: getFallbackProducts(),
        searchProvider: 'fallback',
        searchId: generateSearchId()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
