import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AffiliateProduct {
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
  products: AffiliateProduct[];
  searchProvider: 'google' | 'bing' | 'fallback';
  searchId: string;
}

interface UseVisualSearchReturn {
  search: (imageUrl: string) => Promise<AffiliateProduct[]>;
  searchWithBase64: (imageBase64: string) => Promise<AffiliateProduct[]>;
  products: AffiliateProduct[];
  isLoading: boolean;
  error: string | null;
  searchProvider: string | null;
  trackClick: (productId: string, productUrl: string) => Promise<void>;
}

// Cache for search results
const searchCache = new Map<string, { products: AffiliateProduct[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useVisualSearch(): UseVisualSearchReturn {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchProvider, setSearchProvider] = useState<string | null>(null);
  const { user } = useAuth();

  const generateCacheKey = (imageData: string): string => {
    const sample = imageData.slice(0, 100) + imageData.slice(-100);
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      hash = ((hash << 5) - hash) + sample.charCodeAt(i);
      hash = hash & hash;
    }
    return `search_${Math.abs(hash).toString(36)}`;
  };

  const performSearch = useCallback(async (
    imageUrl?: string,
    imageBase64?: string
  ): Promise<AffiliateProduct[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache
      const cacheKey = generateCacheKey(imageUrl || imageBase64 || '');
      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setProducts(cached.products);
        setIsLoading(false);
        return cached.products;
      }

      const { data, error: fnError } = await supabase.functions.invoke('visual-search', {
        body: {
          imageUrl,
          imageBase64,
          userId: user?.id
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Search failed');
      }

      const result = data as VisualSearchResult;
      const searchProducts = result.products || [];
      
      setProducts(searchProducts);
      setSearchProvider(result.searchProvider);

      // Cache results
      searchCache.set(cacheKey, {
        products: searchProducts,
        timestamp: Date.now()
      });

      return searchProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Visual search error:', err);
      
      // Return fallback products on error
      const fallbackProducts = getFallbackProducts();
      setProducts(fallbackProducts);
      return fallbackProducts;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const search = useCallback(async (imageUrl: string): Promise<AffiliateProduct[]> => {
    return performSearch(imageUrl, undefined);
  }, [performSearch]);

  const searchWithBase64 = useCallback(async (imageBase64: string): Promise<AffiliateProduct[]> => {
    return performSearch(undefined, imageBase64);
  }, [performSearch]);

  const trackClick = useCallback(async (productId: string, productUrl: string) => {
    // Stub: Track click locally for now (affiliate_clicks table not yet created)
    console.log('Affiliate click tracked:', { productId, productUrl, userId: user?.id });
    // TODO: Implement when affiliate_clicks table is created
  }, [user?.id]);

  return {
    search,
    searchWithBase64,
    products,
    isLoading,
    error,
    searchProvider,
    trackClick
  };
}

// Fallback products when API fails
function getFallbackProducts(): AffiliateProduct[] {
  return [
    {
      id: 'fallback_1',
      name: 'Similar Style Top',
      price: 29.99,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
      productUrl: 'https://amazon.com/s?k=fashion+top',
      platform: 'amazon',
      similarity: 0.75
    },
    {
      id: 'fallback_2',
      name: 'Trendy Fashion Item',
      price: 459000,
      currency: 'VND',
      imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300',
      productUrl: 'https://shopee.vn/search?keyword=fashion',
      platform: 'shopee',
      similarity: 0.70
    },
    {
      id: 'fallback_3',
      name: 'Classic Design',
      price: 39.99,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300',
      productUrl: 'https://amazon.com/s?k=classic+fashion',
      platform: 'amazon',
      similarity: 0.65
    }
  ];
}
