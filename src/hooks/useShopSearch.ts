/**
 * useShopSearch - Hook for searching products from database and static collections
 * Combines user_clothing table data with curated collections for search
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShopProduct, ShopCategory, CuratedCollection } from '@/types/shop';
import { CURATED_COLLECTIONS, getAllShopProducts } from '@/data/curatedCollections';

interface ClothingItem {
  id: string;
  name: string;
  image_url: string;
  category: string;
  color: string | null;
  style: string | null;
  tags: string[] | null;
  purchase_url: string | null;
  user_id: string;
  created_at: string;
}

interface UseShopSearchReturn {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ShopProduct[];
  isSearching: boolean;
  
  // Category filter
  selectedCategory: ShopCategory;
  setSelectedCategory: (category: ShopCategory) => void;
  
  // Collections
  collections: CuratedCollection[];
  filteredCollections: CuratedCollection[];
  
  // Community clothing (from database)
  communityClothing: ShopProduct[];
  isLoadingCommunity: boolean;
  
  // Combined results
  allProducts: ShopProduct[];
}

/**
 * Map database category to ShopCategory
 */
function mapToShopCategory(dbCategory: string): ShopCategory {
  const categoryMap: Record<string, ShopCategory> = {
    'top': 'tops',
    'tops': 'tops',
    'bottom': 'pants',
    'pants': 'pants',
    'dress': 'dresses',
    'dresses': 'dresses',
    'outerwear': 'outerwear',
    'jacket': 'outerwear',
    'shoes': 'shoes',
    'accessory': 'accessories',
    'accessories': 'accessories',
  };
  return categoryMap[dbCategory.toLowerCase()] || 'all';
}

/**
 * Convert database clothing item to ShopProduct format
 */
function toShopProduct(item: ClothingItem): ShopProduct {
  return {
    id: item.id,
    name: item.name,
    brand: 'Community',
    imageUrl: item.image_url,
    price: 0, // Community items don't have price
    currency: 'VND',
    affiliateUrl: item.purchase_url || '',
    platform: 'other',
    category: mapToShopCategory(item.category),
  };
}

export function useShopSearch(): UseShopSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>('all');

  // Fetch community clothing from database
  const { data: communityClothingRaw = [], isLoading: isLoadingCommunity } = useQuery({
    queryKey: ['community-clothing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_clothing')
        .select('id, name, image_url, category, color, style, tags, purchase_url, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching community clothing:', error);
        return [];
      }

      return data as ClothingItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Convert community clothing to ShopProduct format
  const communityClothing = useMemo(() => 
    communityClothingRaw.map(toShopProduct),
    [communityClothingRaw]
  );

  // Get all static products
  const staticProducts = useMemo(() => getAllShopProducts(), []);

  // Combine all products
  const allProducts = useMemo(() => 
    [...staticProducts, ...communityClothing],
    [staticProducts, communityClothing]
  );

  // Filter collections by category
  const filteredCollections = useMemo(() => {
    if (selectedCategory === 'all') {
      return CURATED_COLLECTIONS;
    }

    return CURATED_COLLECTIONS.map(collection => ({
      ...collection,
      products: collection.products.filter(p => p.category === selectedCategory),
    })).filter(collection => collection.products.length > 0);
  }, [selectedCategory]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    let results = allProducts.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );

    // Apply category filter
    if (selectedCategory !== 'all') {
      results = results.filter(p => p.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory, allProducts]);

  const isSearching = searchQuery.trim().length > 0;

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedCategory,
    setSelectedCategory,
    collections: CURATED_COLLECTIONS,
    filteredCollections,
    communityClothing,
    isLoadingCommunity,
    allProducts,
  };
}
