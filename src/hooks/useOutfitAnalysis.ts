import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClothingItemInfo } from './useOutfitTryOn';

interface AnalyzedItem {
  name: string;
  category: string;
  color?: string;
  style?: string;
  confidence: number;
}

interface UseOutfitAnalysisReturn {
  analyzeOutfit: (imageUrl: string) => Promise<ClothingItemInfo[]>;
  isAnalyzing: boolean;
  error: string | null;
  analyzedItems: ClothingItemInfo[];
}

/**
 * Hook to analyze outfit images using AI and extract clothing items
 */
export function useOutfitAnalysis(): UseOutfitAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<ClothingItemInfo[]>([]);

  const analyzeOutfit = useCallback(async (imageUrl: string): Promise<ClothingItemInfo[]> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-outfit-items', {
        body: { imageUrl },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      const items: AnalyzedItem[] = data?.items || [];
      
      // Convert analyzed items to ClothingItemInfo format
      const clothingItems: ClothingItemInfo[] = items.map((item, index) => ({
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
