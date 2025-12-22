import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClothingItemInfo {
  name: string;
  imageUrl: string;
  shopUrl?: string;
  price?: string;
}

interface SavedOutfit {
  id: string;
  title: string;
  description: string | null;
  result_image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  clothing_items: ClothingItemInfo[];
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  saved_at: string;
}

interface HiddenOutfit {
  id: string;
  title: string;
  result_image_url: string;
  hidden_at: string;
}

export const useSavedOutfits = () => {
  const { user } = useAuth();
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [hiddenOutfits, setHiddenOutfits] = useState<HiddenOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedOutfits = useCallback(async () => {
    if (!user) {
      setSavedOutfits([]);
      return;
    }

    try {
      // Fetch saved outfit IDs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_outfits')
        .select('outfit_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) {
        setSavedOutfits([]);
        return;
      }

      // Fetch the actual outfits
      const outfitIds = savedData.map(s => s.outfit_id);
      const savedAtMap = new Map(savedData.map(s => [s.outfit_id, s.created_at]));

      const { data: outfitsData, error: outfitsError } = await supabase
        .from('shared_outfits')
        .select('*')
        .in('id', outfitIds);

      if (outfitsError) throw outfitsError;

      // Fetch user profiles
      const userIds = [...new Set(outfitsData?.map(o => o.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const formattedOutfits: SavedOutfit[] = (outfitsData || []).map(outfit => ({
        id: outfit.id,
        title: outfit.title,
        description: outfit.description,
        result_image_url: outfit.result_image_url,
        likes_count: outfit.likes_count,
        comments_count: outfit.comments_count ?? 0,
        created_at: outfit.created_at,
        user_id: outfit.user_id,
        clothing_items: (outfit.clothing_items as unknown as ClothingItemInfo[]) || [],
        user_profile: profileMap.get(outfit.user_id),
        saved_at: savedAtMap.get(outfit.id) || outfit.created_at,
      }));

      // Sort by saved_at
      formattedOutfits.sort((a, b) => 
        new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
      );

      setSavedOutfits(formattedOutfits);
    } catch (error) {
      console.error('Error fetching saved outfits:', error);
    }
  }, [user]);

  const fetchHiddenOutfits = useCallback(async () => {
    if (!user) {
      setHiddenOutfits([]);
      return;
    }

    try {
      // Fetch hidden outfit IDs
      const { data: hiddenData, error: hiddenError } = await supabase
        .from('hidden_outfits')
        .select('outfit_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (hiddenError) throw hiddenError;

      if (!hiddenData || hiddenData.length === 0) {
        setHiddenOutfits([]);
        return;
      }

      // Fetch the actual outfits
      const outfitIds = hiddenData.map(h => h.outfit_id);
      const hiddenAtMap = new Map(hiddenData.map(h => [h.outfit_id, h.created_at]));

      const { data: outfitsData, error: outfitsError } = await supabase
        .from('shared_outfits')
        .select('id, title, result_image_url')
        .in('id', outfitIds);

      if (outfitsError) throw outfitsError;

      const formattedHidden: HiddenOutfit[] = (outfitsData || []).map(outfit => ({
        id: outfit.id,
        title: outfit.title,
        result_image_url: outfit.result_image_url,
        hidden_at: hiddenAtMap.get(outfit.id) || '',
      }));

      setHiddenOutfits(formattedHidden);
    } catch (error) {
      console.error('Error fetching hidden outfits:', error);
    }
  }, [user]);

  const unsaveOutfit = useCallback(async (outfitId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_id', outfitId);

      if (error) throw error;

      setSavedOutfits(prev => prev.filter(o => o.id !== outfitId));
      return true;
    } catch (error) {
      console.error('Error unsaving outfit:', error);
      return false;
    }
  }, [user]);

  const unhideOutfit = useCallback(async (outfitId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('hidden_outfits')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_id', outfitId);

      if (error) throw error;

      setHiddenOutfits(prev => prev.filter(o => o.id !== outfitId));
      return true;
    } catch (error) {
      console.error('Error unhiding outfit:', error);
      return false;
    }
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchSavedOutfits(), fetchHiddenOutfits()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchSavedOutfits, fetchHiddenOutfits]);

  return {
    savedOutfits,
    hiddenOutfits,
    isLoading,
    unsaveOutfit,
    unhideOutfit,
    refetch: () => Promise.all([fetchSavedOutfits(), fetchHiddenOutfits()]),
  };
};
