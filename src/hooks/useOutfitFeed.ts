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
}

const PAGE_SIZE = 10;

export const useOutfitFeed = () => {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<SharedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

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

      // Check user likes if logged in
      let likedOutfitIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from('outfit_likes')
          .select('outfit_id')
          .eq('user_id', user.id)
          .in('outfit_id', outfitsData.map(o => o.id));
        
        likedOutfitIds = new Set(likes?.map(l => l.outfit_id) || []);
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

  useEffect(() => {
    fetchOutfits(true);
  }, [user]);

  return {
    outfits,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  };
};
