import { useState, useCallback, useMemo } from 'react';
import { useUserClothing } from './useUserClothing';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { ClothingItemInfo } from './useOutfitTryOn';

/**
 * Calculates color similarity between two color strings
 * Returns a score between 0 and 1 (1 = exact match)
 */
export function calculateColorSimilarity(color1?: string, color2?: string): number {
  if (!color1 || !color2) return 0;
  
  const normalizedColor1 = color1.toLowerCase().trim();
  const normalizedColor2 = color2.toLowerCase().trim();
  
  // Exact match
  if (normalizedColor1 === normalizedColor2) return 1;
  
  // Color family matching
  const colorFamilies: Record<string, string[]> = {
    red: ['red', 'đỏ', 'crimson', 'maroon', 'burgundy', 'scarlet', 'cherry'],
    blue: ['blue', 'xanh dương', 'navy', 'azure', 'cobalt', 'indigo', 'teal'],
    green: ['green', 'xanh lá', 'olive', 'emerald', 'lime', 'mint', 'forest'],
    yellow: ['yellow', 'vàng', 'gold', 'amber', 'mustard', 'lemon'],
    orange: ['orange', 'cam', 'coral', 'peach', 'tangerine'],
    purple: ['purple', 'tím', 'violet', 'lavender', 'plum', 'magenta'],
    pink: ['pink', 'hồng', 'rose', 'salmon', 'fuchsia'],
    brown: ['brown', 'nâu', 'tan', 'beige', 'khaki', 'chocolate', 'coffee'],
    black: ['black', 'đen', 'charcoal', 'ebony'],
    white: ['white', 'trắng', 'ivory', 'cream', 'off-white'],
    gray: ['gray', 'grey', 'xám', 'silver', 'slate'],
  };
  
  let family1: string | null = null;
  let family2: string | null = null;
  
  for (const [family, colors] of Object.entries(colorFamilies)) {
    if (colors.some(c => normalizedColor1.includes(c))) family1 = family;
    if (colors.some(c => normalizedColor2.includes(c))) family2 = family;
  }
  
  if (family1 && family2 && family1 === family2) return 0.7;
  
  return 0;
}

/**
 * Maps a category string to ClothingCategory type
 */
export function normalizeCategory(category?: string): ClothingCategory {
  if (!category) return 'unknown';
  
  const normalized = category.toLowerCase().trim();
  
  const categoryMap: Record<string, ClothingCategory> = {
    top: 'top',
    áo: 'top',
    shirt: 'top',
    blouse: 'top',
    sweater: 'top',
    jacket: 'top',
    hoodie: 'top',
    bottom: 'bottom',
    quần: 'bottom',
    pants: 'bottom',
    jeans: 'bottom',
    shorts: 'bottom',
    skirt: 'bottom',
    váy: 'dress',
    dress: 'dress',
    đầm: 'dress',
    shoes: 'shoes',
    giày: 'shoes',
    sneaker: 'shoes',
    boots: 'shoes',
    sandal: 'shoes',
    accessory: 'accessory',
    'phụ kiện': 'accessory',
    bag: 'accessory',
    túi: 'accessory',
    hat: 'accessory',
    mũ: 'accessory',
  };
  
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key)) return value;
  }
  
  return 'unknown';
}

/**
 * Calculates relevance score for a clothing item compared to source item
 * Higher score = more relevant
 */
export function calculateRelevanceScore(
  item: ClothingItem,
  sourceCategory: ClothingCategory,
  sourceColor?: string
): number {
  let score = 0;
  
  // Category match is the primary factor (weight: 100)
  if (item.category === sourceCategory) {
    score += 100;
  }
  
  // Color similarity is secondary (weight: 0-30)
  const colorScore = calculateColorSimilarity(item.color, sourceColor);
  score += colorScore * 30;
  
  return score;
}

/**
 * Finds similar items from user's wardrobe based on category and color
 * 
 * @param sourceItem - The clothing item to find similar items for
 * @param userClothing - The user's wardrobe items
 * @returns Array of similar items sorted by relevance
 */
export function findSimilarItems(
  sourceItem: ClothingItemInfo,
  userClothing: ClothingItem[]
): ClothingItem[] {
  const sourceCategory = normalizeCategory(sourceItem.category);
  
  // Filter items by category first (Requirement 3.2)
  const categoryMatches = userClothing.filter(
    item => item.category === sourceCategory
  );
  
  // Sort by relevance score (Requirement 3.3)
  const sortedItems = categoryMatches
    .map(item => ({
      item,
      score: calculateRelevanceScore(item, sourceCategory, sourceItem.color),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
  
  return sortedItems;
}

export interface UseSimilarClothingReturn {
  findSimilar: (item: ClothingItemInfo) => ClothingItem[];
  isSearching: boolean;
  similarItems: ClothingItem[];
  sourceItem: ClothingItemInfo | null;
  clearSearch: () => void;
}

/**
 * Hook for finding similar clothing items in user's wardrobe
 * 
 * Requirements: 3.2, 3.3, 3.4
 */
export const useSimilarClothing = (): UseSimilarClothingReturn => {
  const { userClothing, isLoading } = useUserClothing();
  const [sourceItem, setSourceItem] = useState<ClothingItemInfo | null>(null);
  const [similarItems, setSimilarItems] = useState<ClothingItem[]>([]);

  /**
   * Searches for similar items in user's wardrobe
   * Returns items in the same category, sorted by relevance
   * 
   * @param item - The source clothing item to find similar items for
   * @returns Array of similar items from user's wardrobe
   */
  const findSimilar = useCallback((item: ClothingItemInfo): ClothingItem[] => {
    setSourceItem(item);
    
    // Find similar items (Requirements 3.2, 3.3)
    const results = findSimilarItems(item, userClothing);
    
    setSimilarItems(results);
    
    // Return empty array if no matches (Requirement 3.4)
    return results;
  }, [userClothing]);

  const clearSearch = useCallback(() => {
    setSourceItem(null);
    setSimilarItems([]);
  }, []);

  return {
    findSimilar,
    isSearching: isLoading,
    similarItems,
    sourceItem,
    clearSearch,
  };
};
