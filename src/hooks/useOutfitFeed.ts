import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClothingItemInfo {
  name: string;
  imageUrl: string;
  shopUrl?: string;
  price?: string;
}

interface SharedOutfit {
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

const PAGE_SIZE = 10;

export const useOutfitFeed = () => {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<SharedOutfit[]>([]);
  const [hiddenOutfitIds, setHiddenOutfitIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Fetch hidden outfits for the user
  const fetchHiddenOutfits = useCallback(async () => {
    if (!user) {
      setHiddenOutfitIds(new Set());
      return;
    }
    
    const { data } = await supabase
      .from('hidden_outfits')
      .select('outfit_id')
      .eq('user_id', user.id);
    
    setHiddenOutfitIds(new Set(data?.map(h => h.outfit_id) || []));
  }, [user]);

  const fetchOutfits = useCallback(async (isInitial: boolean = false) => {
    const currentPage = isInitial ? 0 : page;
    
    if (isInitial) {
      setIsLoading(true);
      setPage(0);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: outfitsData, error } = await supabase
        .from('shared_outfits')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!outfitsData || outfitsData.length === 0) {
        setHasMore(false);
        if (isInitial) setOutfits([]);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set(outfitsData.map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Check user likes and saves if logged in
      let likedOutfitIds = new Set<string>();
      let savedOutfitIds = new Set<string>();
      
      if (user) {
        const outfitIds = outfitsData.map(o => o.id);
        
        const [likesResult, savesResult] = await Promise.all([
          supabase
            .from('outfit_likes')
            .select('outfit_id')
            .eq('user_id', user.id)
            .in('outfit_id', outfitIds),
          supabase
            .from('saved_outfits')
            .select('outfit_id')
            .eq('user_id', user.id)
            .in('outfit_id', outfitIds),
        ]);
        
        likedOutfitIds = new Set(likesResult.data?.map(l => l.outfit_id) || []);
        savedOutfitIds = new Set(savesResult.data?.map(s => s.outfit_id) || []);
      }

      const formattedOutfits: SharedOutfit[] = outfitsData.map(outfit => ({
        id: outfit.id,
        title: outfit.title,
        description: outfit.description,
        result_image_url: outfit.result_image_url,
        likes_count: outfit.likes_count,
        comments_count: (outfit as any).comments_count ?? 0,
        is_featured: outfit.is_featured,
        created_at: outfit.created_at,
        user_id: outfit.user_id,
        clothing_items: (outfit.clothing_items as unknown as ClothingItemInfo[]) || [],
        user_profile: profileMap.get(outfit.user_id),
        isLiked: likedOutfitIds.has(outfit.id),
        isSaved: savedOutfitIds.has(outfit.id),
      }));

      if (isInitial) {
        setOutfits(formattedOutfits);
      } else {
        setOutfits(prev => [...prev, ...formattedOutfits]);
      }

      setHasMore(outfitsData.length === PAGE_SIZE);
      if (!isInitial) {
        setPage(prev => prev + 1);
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error('Error fetching outfits:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [page, user]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchOutfits(false);
    }
  }, [fetchOutfits, isLoadingMore, hasMore]);

  const refresh = useCallback(() => {
    fetchOutfits(true);
  }, [fetchOutfits]);

  const hideOutfit = useCallback(async (outfitId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('hidden_outfits')
        .insert({ user_id: user.id, outfit_id: outfitId });
      
      if (error) throw error;
      
      setHiddenOutfitIds(prev => new Set([...prev, outfitId]));
      setOutfits(prev => prev.filter(o => o.id !== outfitId));
      return true;
    } catch (error) {
      console.error('Error hiding outfit:', error);
      return false;
    }
  }, [user]);

  const saveOutfit = useCallback(async (outfitId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .insert({ user_id: user.id, outfit_id: outfitId });
      
      if (error) throw error;
      
      setOutfits(prev => prev.map(o => 
        o.id === outfitId ? { ...o, isSaved: true } : o
      ));
      return true;
    } catch (error) {
      console.error('Error saving outfit:', error);
      return false;
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
      
      setOutfits(prev => prev.map(o => 
        o.id === outfitId ? { ...o, isSaved: false } : o
      ));
      return true;
    } catch (error) {
      console.error('Error unsaving outfit:', error);
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchHiddenOutfits();
    fetchOutfits(true);
  }, [user]);

  // Filter out hidden outfits
  const visibleOutfits = outfits.filter(o => !hiddenOutfitIds.has(o.id));

  return {
    outfits: visibleOutfits,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    hideOutfit,
    saveOutfit,
    unsaveOutfit,
  };
};
