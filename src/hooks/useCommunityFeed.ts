import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Clothing item information for outfit display
 */
interface ClothingItemInfo {
  name: string;
  imageUrl: string;
  shopUrl?: string;
  price?: string;
}

/**
 * Shared outfit data structure
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
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
  inspired_by_outfit_id?: string | null;
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  inspired_by_outfit?: {
    id: string;
    title: string;
    user_profile?: {
      display_name?: string;
    };
  } | null;
  isLiked?: boolean;
  isSaved?: boolean;
}

/**
 * Feed tab types
 * Requirements: 1.2 - Three sub-tabs: Following, Explore, and Ranking
 */
export type FeedTab = 'following' | 'explore' | 'ranking';

/**
 * Return type for useCommunityFeed hook
 * Requirements: 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3
 */
interface UseCommunityFeedReturn {
  // Data - outfits filtered by active tab
  outfits: SharedOutfit[];
  
  // Tab management - Requirements 1.2
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
  
  // Loading states - Requirements 2.2
  isLoading: boolean;
  isLoadingMore: boolean;
  
  // Pagination - Requirements 2.1, 2.3
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  
  // Interactions
  hideOutfit: (id: string) => Promise<boolean>;
  saveOutfit: (id: string) => Promise<boolean>;
  unsaveOutfit: (id: string) => Promise<boolean>;
}

/**
 * Pagination page size
 * Requirements: 2.1 - Infinite scroll pagination
 */
const PAGE_SIZE = 10;

/**
 * Sample community outfits for display when no real data exists
 * Used for demo/fallback purposes
 */
const sampleCommunityOutfits: SharedOutfit[] = [
  {
    id: 'sample-outfit-1',
    title: 'Outfit công sở thanh lịch',
    description: 'Phối đồ công sở với áo sơ mi trắng và quần tây đen 💼',
    result_image_url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600',
    likes_count: 128,
    comments_count: 15,
    is_featured: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-1',
    clothing_items: [
      { name: 'Áo sơ mi trắng', imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300', price: '350.000đ' },
      { name: 'Quần tây đen', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300', price: '480.000đ' }
    ],
    user_profile: { display_name: 'Minh Anh', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-2',
    title: 'Street style năng động',
    description: 'Phong cách đường phố với hoodie và sneaker 🔥',
    result_image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
    likes_count: 95,
    comments_count: 8,
    is_featured: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-2',
    clothing_items: [
      { name: 'Hoodie đen', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300', price: '420.000đ' },
      { name: 'Giày sneaker', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300', price: '890.000đ' }
    ],
    user_profile: { display_name: 'Đức Anh', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-3',
    title: 'Váy hoa đi dạo phố',
    description: 'Nữ tính và dịu dàng với váy hoa nhí 🌸',
    result_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
    likes_count: 156,
    comments_count: 22,
    is_featured: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-3',
    clothing_items: [
      { name: 'Váy midi hoa', imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300', price: '520.000đ' },
      { name: 'Túi xách', imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300', price: '650.000đ' }
    ],
    user_profile: { display_name: 'Thu Hà', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-4',
    title: 'Minimalist chic',
    description: 'Phong cách tối giản với tông màu trung tính ✨',
    result_image_url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600',
    likes_count: 203,
    comments_count: 31,
    is_featured: true,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-5',
    clothing_items: [
      { name: 'Áo len beige', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300', price: '450.000đ' },
      { name: 'Quần culottes trắng', imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300', price: '380.000đ' }
    ],
    user_profile: { display_name: 'Linh Chi', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-5',
    title: 'Date night outfit',
    description: 'Đầm đen quyến rũ cho buổi tối hẹn hò 🖤',
    result_image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    likes_count: 278,
    comments_count: 45,
    is_featured: true,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-7',
    clothing_items: [
      { name: 'Đầm đen body', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300', price: '680.000đ' },
      { name: 'Giày cao gót', imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300', price: '750.000đ' }
    ],
    user_profile: { display_name: 'Ngọc Trinh', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100' },
    isLiked: false,
    isSaved: false,
  },
];


/**
 * Community Feed Hook
 * 
 * Manages the community feed with three tabs: Following, Explore, and Ranking.
 * Provides infinite scroll pagination and outfit interactions.
 * 
 * Requirements:
 * - 1.2: Display three sub-tabs (Following, Explore, Ranking)
 * - 1.3: Following tab shows outfits from followed users only
 * - 1.4: Explore tab shows recommended/popular outfits
 * - 1.5: Ranking tab shows outfits sorted by likes_count descending
 * - 2.1, 2.2, 2.3: Infinite scroll with loading states
 */
export const useCommunityFeed = (): UseCommunityFeedReturn => {
  const { user } = useAuth();
  
  // Tab state - Requirements 1.2
  const [activeTab, setActiveTab] = useState<FeedTab>('explore');
  
  // Data state
  const [allOutfits, setAllOutfits] = useState<SharedOutfit[]>([]);
  const [followingUserIds, setFollowingUserIds] = useState<Set<string>>(new Set());
  const [hiddenOutfitIds, setHiddenOutfitIds] = useState<Set<string>>(new Set());
  
  // Loading states - Requirements 2.2
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Pagination state - Requirements 2.1, 2.3
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  /**
   * Fetch users that current user is following
   * Requirements 1.3: Following tab filters by followed users
   */
  const fetchFollowingUsers = useCallback(async () => {
    if (!user) {
      setFollowingUserIds(new Set());
      return;
    }
    
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    
    setFollowingUserIds(new Set(data?.map(f => f.following_id) || []));
  }, [user]);

  /**
   * Fetch hidden outfits for the user
   */
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

  /**
   * Fetch outfits from database with pagination
   * Requirements 2.1: Load more posts automatically
   */
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

      // Fetch outfits sorted by created_at (Explore tab default)
      const { data: outfitsData, error } = await supabase
        .from('shared_outfits')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!outfitsData || outfitsData.length === 0) {
        setHasMore(false);
        if (isInitial) {
          setAllOutfits(sampleCommunityOutfits);
        }
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Fetch user profiles for outfit creators
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

      // Format outfits with user profiles and interaction states
      const formattedOutfits: SharedOutfit[] = outfitsData.map(outfit => ({
        id: outfit.id,
        title: outfit.title,
        description: outfit.description,
        result_image_url: outfit.result_image_url,
        likes_count: outfit.likes_count,
        comments_count: outfit.comments_count ?? 0,
        is_featured: outfit.is_featured,
        created_at: outfit.created_at,
        user_id: outfit.user_id,
        clothing_items: (outfit.clothing_items as unknown as ClothingItemInfo[]) || [],
        inspired_by_outfit_id: (outfit as any).inspired_by_outfit_id || null,
        user_profile: profileMap.get(outfit.user_id),
        isLiked: likedOutfitIds.has(outfit.id),
        isSaved: savedOutfitIds.has(outfit.id),
      }));

      if (isInitial) {
        // Combine real outfits with sample outfits for richer content
        const realOutfitIds = new Set(formattedOutfits.map(o => o.id));
        const samplesToAdd = sampleCommunityOutfits.filter(s => !realOutfitIds.has(s.id));
        setAllOutfits([...formattedOutfits, ...samplesToAdd]);
      } else {
        setAllOutfits(prev => [...prev, ...formattedOutfits]);
      }

      // Requirements 2.3: Check if more data available
      setHasMore(outfitsData.length === PAGE_SIZE);
      setPage(isInitial ? 1 : prev => prev + 1);
    } catch (error) {
      console.error('Error fetching outfits:', error);
      if (isInitial) {
        setAllOutfits(sampleCommunityOutfits);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [page, user]);

  /**
   * Load more outfits for infinite scroll
   * Requirements 2.1: Load more posts automatically when approaching bottom
   */
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchOutfits(false);
    }
  }, [fetchOutfits, isLoadingMore, hasMore]);

  /**
   * Refresh the feed
   */
  const refresh = useCallback(() => {
    fetchOutfits(true);
  }, [fetchOutfits]);

  /**
   * Hide an outfit from the feed
   */
  const hideOutfit = useCallback(async (outfitId: string) => {
    // For sample outfits, just hide locally
    if (outfitId.startsWith('sample-')) {
      setHiddenOutfitIds(prev => new Set([...prev, outfitId]));
      return true;
    }
    
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('hidden_outfits')
        .insert({ user_id: user.id, outfit_id: outfitId });
      
      if (error) throw error;
      setHiddenOutfitIds(prev => new Set([...prev, outfitId]));
      return true;
    } catch (error) {
      console.error('Error hiding outfit:', error);
      return false;
    }
  }, [user]);

  /**
   * Save an outfit
   */
  const saveOutfit = useCallback(async (outfitId: string) => {
    if (outfitId.startsWith('sample-')) {
      setAllOutfits(prev => prev.map(o => 
        o.id === outfitId ? { ...o, isSaved: true } : o
      ));
      return true;
    }
    
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .insert({ user_id: user.id, outfit_id: outfitId });
      
      if (error) throw error;
      setAllOutfits(prev => prev.map(o => 
        o.id === outfitId ? { ...o, isSaved: true } : o
      ));
      return true;
    } catch (error) {
      console.error('Error saving outfit:', error);
      return false;
    }
  }, [user]);

  /**
   * Unsave an outfit
   */
  const unsaveOutfit = useCallback(async (outfitId: string) => {
    if (outfitId.startsWith('sample-')) {
      setAllOutfits(prev => prev.map(o => 
        o.id === outfitId ? { ...o, isSaved: false } : o
      ));
      return true;
    }
    
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_id', outfitId);
      
      if (error) throw error;
      setAllOutfits(prev => prev.map(o => 
        o.id === outfitId ? { ...o, isSaved: false } : o
      ));
      return true;
    } catch (error) {
      console.error('Error unsaving outfit:', error);
      return false;
    }
  }, [user]);

  // Initialize data on mount and user change
  useEffect(() => {
    fetchFollowingUsers();
    fetchHiddenOutfits();
    fetchOutfits(true);
  }, [user]);

  /**
   * Filter outfits based on active tab and hidden status
   * 
   * Requirements:
   * - 1.3: Following tab shows only outfits from followed users
   * - 1.4: Explore tab shows all outfits sorted by created_at
   * - 1.5: Ranking tab shows outfits sorted by likes_count descending
   */
  const filteredOutfits = useMemo(() => {
    // First filter out hidden outfits
    const visible = allOutfits.filter(o => !hiddenOutfitIds.has(o.id));
    
    switch (activeTab) {
      case 'following':
        // Requirements 1.3: Only show outfits from followed users
        return visible.filter(o => followingUserIds.has(o.user_id));
      
      case 'ranking':
        // Requirements 1.5: Sort by likes_count descending
        return [...visible].sort((a, b) => b.likes_count - a.likes_count);
      
      case 'explore':
      default:
        // Requirements 1.4: Show all outfits (already sorted by created_at from fetch)
        return visible;
    }
  }, [allOutfits, activeTab, followingUserIds, hiddenOutfitIds]);

  return {
    outfits: filteredOutfits,
    activeTab,
    setActiveTab,
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
