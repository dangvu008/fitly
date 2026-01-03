import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ClothingItemData {
  id?: string;
  name: string;
  imageUrl: string;
  category?: string;
  purchaseUrl?: string;
}

/**
 * Represents the record structure for a shared outfit to be inserted into the database.
 * Requirements 5.2: Create shared outfit with attribution to original outfit
 */
export interface SharedOutfitRecord {
  user_id: string;
  title: string;
  description: string | null;
  result_image_url: string;
  clothing_items: ClothingItemData[];
  inspired_by_outfit_id: string | null;
}

/**
 * Prepares the shared outfit record for database insertion.
 * This is a pure function that can be tested without database dependencies.
 * 
 * Requirements 5.2: WHEN a user shares a try-on result THEN the system SHALL create
 * a new shared outfit post with attribution to the original outfit
 * 
 * @param userId - The ID of the user sharing the outfit
 * @param title - The title of the shared outfit
 * @param resultImageUrl - The URL of the try-on result image
 * @param clothingItems - Array of clothing items in the outfit
 * @param description - Optional description of the outfit
 * @param inspiredByOutfitId - Optional ID of the original outfit that inspired this one
 * @returns The prepared record for database insertion
 */
export function prepareSharedOutfitRecord(
  userId: string,
  title: string,
  resultImageUrl: string,
  clothingItems: ClothingItemData[],
  description?: string | null,
  inspiredByOutfitId?: string | null
): SharedOutfitRecord {
  return {
    user_id: userId,
    title,
    description: description || null,
    result_image_url: resultImageUrl,
    clothing_items: clothingItems,
    inspired_by_outfit_id: inspiredByOutfitId || null,
  };
}

export interface SharedOutfit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  result_image_url: string;
  clothing_items: ClothingItemData[];
  likes_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  isLiked?: boolean;
}

const PAGE_SIZE = 12;

export const useSharedOutfits = () => {
  const { user } = useAuth();
  const [sharedOutfits, setSharedOutfits] = useState<SharedOutfit[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchUserLikes = useCallback(async () => {
    if (!user) {
      setUserLikes(new Set());
      return;
    }

    const { data } = await supabase
      .from('outfit_likes')
      .select('outfit_id')
      .eq('user_id', user.id);

    if (data) {
      setUserLikes(new Set(data.map(like => like.outfit_id)));
    }
  }, [user]);

  const fetchSharedOutfits = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    
    if (reset) {
      setIsLoading(true);
      setPage(0);
    } else {
      setIsLoadingMore(true);
    }

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('shared_outfits')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      const typedData: SharedOutfit[] = data.map(item => ({
        ...item,
        clothing_items: (item.clothing_items || []) as unknown as ClothingItemData[],
        isLiked: userLikes.has(item.id),
      }));
      
      if (reset) {
        setSharedOutfits(typedData);
      } else {
        setSharedOutfits(prev => [...prev, ...typedData]);
      }
      
      setHasMore(data.length === PAGE_SIZE);
    }
    
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [userLikes, page]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoadingMore, hasMore]);

  const toggleLike = async (outfitId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích outfit');
      return false;
    }

    const isCurrentlyLiked = userLikes.has(outfitId);

    if (isCurrentlyLiked) {
      // Unlike
      const { error } = await supabase
        .from('outfit_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_id', outfitId);

      if (error) {
        toast.error('Không thể bỏ thích');
        return false;
      }

      setUserLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(outfitId);
        return newSet;
      });

      setSharedOutfits(prev =>
        prev.map(o =>
          o.id === outfitId
            ? { ...o, likes_count: Math.max(0, o.likes_count - 1), isLiked: false }
            : o
        )
      );
    } else {
      // Like
      const { error } = await supabase
        .from('outfit_likes')
        .insert({ user_id: user.id, outfit_id: outfitId });

      if (error) {
        toast.error('Không thể thích outfit');
        return false;
      }

      setUserLikes(prev => new Set(prev).add(outfitId));

      setSharedOutfits(prev =>
        prev.map(o =>
          o.id === outfitId
            ? { ...o, likes_count: o.likes_count + 1, isLiked: true }
            : o
        )
      );
    }

    return true;
  };

  const shareOutfit = async (
    title: string,
    resultImageUrl: string,
    clothingItems: ClothingItemData[],
    description?: string,
    inspiredByOutfitId?: string | null
  ) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chia sẻ outfit');
      return false;
    }

    // Prepare insert data - only include fields that exist in the table
    const insertData: {
      user_id: string;
      title: string;
      description: string | null;
      result_image_url: string;
      clothing_items: any;
    } = {
      user_id: user.id,
      title,
      description: description || null,
      result_image_url: resultImageUrl,
      clothing_items: clothingItems,
    };
    
    console.log('Sharing outfit with data:', insertData);
    
    const { data, error } = await supabase
      .from('shared_outfits')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Share outfit error:', error);
      toast.error(`Không thể chia sẻ outfit: ${error.message}`);
      return false;
    }

    console.log('Shared outfit successfully:', data);
    toast.success('Đã chia sẻ outfit thành công!');
    await fetchSharedOutfits(true);
    return true;
  };

  const deleteOutfit = async (outfitId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('shared_outfits')
      .delete()
      .eq('id', outfitId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Không thể xóa outfit');
      return false;
    }

    setSharedOutfits(prev => prev.filter(o => o.id !== outfitId));
    toast.success('Đã xóa outfit');
    return true;
  };

  useEffect(() => {
    fetchUserLikes();
  }, [fetchUserLikes]);

  useEffect(() => {
    if (page === 0) {
      fetchSharedOutfits(true);
    } else {
      fetchSharedOutfits(false);
    }
  }, [page, userLikes]);

  return {
    sharedOutfits,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    shareOutfit,
    deleteOutfit,
    toggleLike,
    userLikes,
    refetch: () => fetchSharedOutfits(true),
  };
};
