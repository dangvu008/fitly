import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FavoriteOutfit {
  id: string;
  outfit_id: string;
  created_at: string;
  outfit?: {
    id: string;
    title: string;
    result_image_url: string;
    likes_count: number;
  };
}

export const useFavoriteOutfits = () => {
  const { user } = useAuth();
  const [favoriteOutfits, setFavoriteOutfits] = useState<FavoriteOutfit[]>([]);
  const [favoriteOutfitIds, setFavoriteOutfitIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavoriteOutfits = useCallback(async () => {
    if (!user) {
      setFavoriteOutfits([]);
      setFavoriteOutfitIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorite_outfits')
        .select(`
          id,
          outfit_id,
          created_at,
          outfit:shared_outfits(id, title, result_image_url, likes_count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFavoriteOutfits(data || []);
      setFavoriteOutfitIds(new Set(data?.map(f => f.outfit_id) || []));
    } catch (error) {
      console.error('Error fetching favorite outfits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavoriteOutfits();
  }, [fetchFavoriteOutfits]);

  const addFavorite = useCallback(async (outfitId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return false;
    }

    // Handle sample outfits locally
    if (outfitId.startsWith('sample-')) {
      setFavoriteOutfitIds(prev => new Set([...prev, outfitId]));
      toast.success('Đã thêm vào outfit yêu thích');
      return true;
    }

    try {
      const { error } = await supabase
        .from('favorite_outfits')
        .insert({ user_id: user.id, outfit_id: outfitId });

      if (error) throw error;

      setFavoriteOutfitIds(prev => new Set([...prev, outfitId]));
      toast.success('Đã thêm vào outfit yêu thích');
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error('Không thể thêm vào yêu thích');
      return false;
    }
  }, [user]);

  const removeFavorite = useCallback(async (outfitId: string): Promise<boolean> => {
    if (!user) return false;

    // Handle sample outfits locally
    if (outfitId.startsWith('sample-')) {
      setFavoriteOutfitIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(outfitId);
        return newSet;
      });
      toast.success('Đã bỏ khỏi outfit yêu thích');
      return true;
    }

    try {
      const { error } = await supabase
        .from('favorite_outfits')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_id', outfitId);

      if (error) throw error;

      setFavoriteOutfitIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(outfitId);
        return newSet;
      });
      setFavoriteOutfits(prev => prev.filter(f => f.outfit_id !== outfitId));
      toast.success('Đã bỏ khỏi outfit yêu thích');
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Không thể bỏ khỏi yêu thích');
      return false;
    }
  }, [user]);

  const toggleFavorite = useCallback(async (outfitId: string): Promise<boolean> => {
    if (favoriteOutfitIds.has(outfitId)) {
      return removeFavorite(outfitId);
    } else {
      return addFavorite(outfitId);
    }
  }, [favoriteOutfitIds, addFavorite, removeFavorite]);

  const isFavorite = useCallback((outfitId: string): boolean => {
    return favoriteOutfitIds.has(outfitId);
  }, [favoriteOutfitIds]);

  return {
    favoriteOutfits,
    favoriteOutfitIds,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavoriteOutfits,
  };
};
