import { useState, useCallback } from 'react';
import { analyzeOutfitImage, DetectedItem } from '@/utils/outfitAnalysis';
import { ClothingItemInfo } from './useOutfitTryOn';

interface UseOutfitAnalysisReturn {
  analyzeOutfit: (imageUrl: string) => Promise<ClothingItemInfo[]>;
  isAnalyzing: boolean;
  error: string | null;
  analyzedItems: ClothingItemInfo[];
}

/**
 * Hook to analyze outfit images using client-side AI (FREE - no API costs!)
 * Uses Hugging Face Transformers.js running entirely in the browser
 */
export function useOutfitAnalysis(): UseOutfitAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<ClothingItemInfo[]>([]);

  const analyzeOutfit = useCallback(async (imageUrl: string): Promise<ClothingItemInfo[]> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Use client-side analysis - completely FREE!
      const items: DetectedItem[] = await analyzeOutfitImage(imageUrl);
      
      // Convert analyzed items to ClothingItemInfo format
      const clothingItems: ClothingItemInfo[] = items.map((item) => ({
        name: item.name,
        imageUrl: imageUrl, // Use outfit image as placeholder
        category: item.category,
        color: item.color,
      }));

      setAnalyzedItems(clothingItems);
      return clothingItems;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể phân tích outfit';
      setError(message);
      console.error('Outfit analysis error:', err);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeOutfit,
    isAnalyzing,
    error,
    analyzedItems,
  };
}
