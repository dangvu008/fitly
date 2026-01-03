import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook for managing outfit save/hide actions
 * Used by HomePage cards to save or hide outfits
 */
export function useOutfitActions() {
  const { user } = useAuth();
  const [savedOutfitIds, setSavedOutfitIds] = useState<Set<string>>(new Set());
  const [hiddenOutfitIds, setHiddenOutfitIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's saved and hidden outfits on mount
  useEffect(() => {
    const fetchUserOutfitStates = async () => {
      if (!user) {
        setSavedOutfitIds(new Set());
        setHiddenOutfitIds(new Set());
        return;
      }

      try {
        const [savedResult, hiddenResult] = await Promise.all([
          supabase
            .from('saved_outfits')
            .select('outfit_id')
            .eq('user_id', user.id),
          supabase
            .from('hidden_outfits')
            .select('outfit_id')
            .eq('user_id', user.id),
        ]);

        setSavedOutfitIds(new Set(savedResult.data?.map(s => s.outfit_id) || []));
        setHiddenOutfitIds(new Set(hiddenResult.data?.map(h => h.outfit_id) || []));
      } catch (error) {
        console.error('Error fetching outfit states:', error);
      }
    };

    fetchUserOutfitStates();
  }, [user]);

  /**
   * Check if an outfit is saved
   */
  const isSaved = useCallback((outfitId: string) => {
    return savedOutfitIds.has(outfitId);
  }, [savedOutfitIds]);

  /**
   * Check if an outfit is hidden
   */
  const isHidden = useCallback((outfitId: string) => {
    return hiddenOutfitIds.has(outfitId);
  }, [hiddenOutfitIds]);

  /**
   * Save an outfit
   */
  const saveOutfit = useCallback(async (outfitId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu outfit');
      return false;
    }

    // Handle sample outfits locally
    if (outfitId.startsWith('sample-')) {
      setSavedOutfitIds(prev => new Set([...prev, outfitId]));
      toast.success('Đã lưu outfit');
      return true;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .insert({ user_id: user.id, outfit_id: outfitId });

      if (error) throw error;
      
      setSavedOutfitIds(prev => new Set([...prev, outfitId]));
      toast.success('Đã lưu outfit');
      return true;
    } catch (error) {
      console.error('Error saving outfit:', error);
      toast.error('Không thể lưu outfit');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Unsave an outfit
   */
  const unsaveOutfit = useCallback(async (outfitId: string): Promise<boolean> => {
    if (!user) return false;

    // Handle sample outfits locally
    if (outfitId.startsWith('sample-')) {
      setSavedOutfitIds(prev => {
        const next = new Set(prev);
        next.delete(outfitId);
        return next;
      });
      toast.success('Đã bỏ lưu outfit');
      return true;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_id', outfitId);

      if (error) throw error;
      
      setSavedOutfitIds(prev => {
        const next = new Set(prev);
        next.delete(outfitId);
        return next;
      });
      toast.success('Đã bỏ lưu outfit');
      return true;
    } catch (error) {
      console.error('Error unsaving outfit:', error);
      toast.error('Không thể bỏ lưu outfit');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Toggle save state
   */
  const toggleSave = useCallback(async (outfitId: string): Promise<boolean> => {
    if (isSaved(outfitId)) {
      return unsaveOutfit(outfitId);
    } else {
      return saveOutfit(outfitId);
    }
  }, [isSaved, saveOutfit, unsaveOutfit]);

  /**
   * Hide an outfit from the feed
   */
  const hideOutfit = useCallback(async (outfitId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return false;
    }

    // Handle sample outfits locally
    if (outfitId.startsWith('sample-')) {
      setHiddenOutfitIds(prev => new Set([...prev, outfitId]));
      toast.success('Đã ẩn outfit');
      return true;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('hidden_outfits')
        .insert({ user_id: user.id, outfit_id: outfitId });

      if (error) throw error;
      
      setHiddenOutfitIds(prev => new Set([...prev, outfitId]));
      toast.success('Đã ẩn outfit');
      return true;
    } catch (error) {
      console.error('Error hiding outfit:', error);
      toast.error('Không thể ẩn outfit');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isSaved,
    isHidden,
    saveOutfit,
    unsaveOutfit,
    toggleSave,
    hideOutfit,
    isLoading,
    savedOutfitIds,
    hiddenOutfitIds,
  };
}
