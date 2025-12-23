import { useState, useCallback } from 'react';
import { useAITryOn, TryOnProgress } from './useAITryOn';

/**
 * ClothingItemInfo represents a clothing item from a shared outfit
 */
export interface ClothingItemInfo {
  name: string;
  imageUrl: string;
  shopUrl?: string;
  price?: string;
  category?: string;
  color?: string;
}

/**
 * SharedOutfit represents an outfit shared on the feed
 */
export interface SharedOutfit {
  id: string;
  title: string;
  description: string | null;
  result_image_url: string;
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  user_id: string;
  clothing_items: ClothingItemInfo[];
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

/**
 * TryOnFromOutfitResult represents the result of trying on an outfit
 */
export interface TryOnFromOutfitResult {
  id: string;
  resultImageUrl: string;
  sourceOutfitId: string;
  bodyImageUrl: string;
  clothingItems: ClothingItemInfo[];
  createdAt: string;
}

export interface UseOutfitTryOnReturn {
  startTryOn: (outfit: SharedOutfit) => Promise<void>;
  isProcessing: boolean;
  progress: TryOnProgress;
  result: TryOnFromOutfitResult | null;
  error: string | null;
  bodyImage: string | null;
  setBodyImage: (image: string | null) => void;
  clearResult: () => void;
  cancelProcessing: () => void;
  currentOutfit: SharedOutfit | null;
}

/**
 * Extracts clothing items from a shared outfit for the try-on processor
 * @param outfit - The shared outfit to extract items from
 * @returns Array of clothing items with imageUrl and name
 */
export function extractClothingItemsForTryOn(
  outfit: SharedOutfit
): Array<{ imageUrl: string; name: string }> {
  if (!outfit.clothing_items || !Array.isArray(outfit.clothing_items)) {
    return [];
  }
  
  return outfit.clothing_items.map(item => ({
    imageUrl: item.imageUrl,
    name: item.name,
  }));
}

/**
 * Hook for managing the try-on flow from a shared outfit
 * Wraps useAITryOn for outfit-specific functionality
 * 
 * Requirements: 1.3, 1.4, 1.5, 1.6
 */
export const useOutfitTryOn = (): UseOutfitTryOnReturn => {
  const {
    processVirtualTryOn,
    isProcessing,
    progress,
    clearResult: clearAIResult,
    cancelProcessing,
  } = useAITryOn();

  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [result, setResult] = useState<TryOnFromOutfitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentOutfit, setCurrentOutfit] = useState<SharedOutfit | null>(null);

  /**
   * Starts the try-on process with the given outfit
   * Extracts all clothing items and passes them to the AI processor
   * 
   * @param outfit - The shared outfit to try on
   */
  const startTryOn = useCallback(async (outfit: SharedOutfit) => {
    if (!bodyImage) {
      setError('Vui lòng chọn ảnh toàn thân');
      return;
    }

    setError(null);
    setResult(null);
    setCurrentOutfit(outfit);

    // Extract clothing items from outfit (Requirement 1.3)
    const clothingItems = extractClothingItemsForTryOn(outfit);

    if (clothingItems.length === 0) {
      setError('Outfit không có món đồ nào');
      return;
    }

    // Process try-on with all clothing items (Requirements 1.4, 1.5, 1.6)
    const tryOnResult = await processVirtualTryOn(bodyImage, clothingItems);

    if (tryOnResult?.success && tryOnResult.generatedImage) {
      const outfitResult: TryOnFromOutfitResult = {
        id: crypto.randomUUID(),
        resultImageUrl: tryOnResult.generatedImage,
        sourceOutfitId: outfit.id,
        bodyImageUrl: bodyImage,
        clothingItems: outfit.clothing_items,
        createdAt: new Date().toISOString(),
      };
      setResult(outfitResult);
    } else if (tryOnResult?.error) {
      setError(tryOnResult.error);
    }
  }, [bodyImage, processVirtualTryOn]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setCurrentOutfit(null);
    clearAIResult();
  }, [clearAIResult]);

  const handleSetBodyImage = useCallback((image: string | null) => {
    setBodyImage(image);
    // Clear previous results when body image changes
    if (result) {
      setResult(null);
      setError(null);
    }
  }, [result]);

  return {
    startTryOn,
    isProcessing,
    progress,
    result,
    error,
    bodyImage,
    setBodyImage: handleSetBodyImage,
    clearResult,
    cancelProcessing,
    currentOutfit,
  };
};
