import { useQuery } from '@tanstack/react-query';
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
 * Outfit item structure for Home page sections
 * Requirements: 2.1, 2.2 - Data structure for horizontal scroll sections
 */
export interface HomeOutfitItem {
  id: string;
  title: string;
  result_image_url: string;
  likes_count: number;
  comments_count: number;
  clothing_items: ClothingItemInfo[];
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

/**
 * Sample outfits for fallback display when no real data exists
 */
const sampleOutfits: HomeOutfitItem[] = [
  {
    id: 'sample-new-1',
    title: 'Outfit công sở thanh lịch',
    result_image_url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600',
    likes_count: 128,
    comments_count: 15,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Áo sơ mi trắng', imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300', price: '350.000đ' },
    ],
    user_profile: { display_name: 'Minh Anh', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  },
  {
    id: 'sample-new-2',
    title: 'Street style năng động',
    result_image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
    likes_count: 95,
    comments_count: 8,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Hoodie đen', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300', price: '420.000đ' },
    ],
    user_profile: { display_name: 'Đức Anh', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  },
  {
    id: 'sample-new-3',
    title: 'Váy hoa đi dạo phố',
    result_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
    likes_count: 156,
    comments_count: 22,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Váy midi hoa', imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300', price: '520.000đ' },
    ],
    user_profile: { display_name: 'Thu Hà', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
  },
  {
    id: 'sample-new-4',
    title: 'Casual Friday vibes',
    result_image_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600',
    likes_count: 87,
    comments_count: 12,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Áo polo xanh navy', imageUrl: 'https://images.unsplash.com/photo-1625910513413-5fc45e80b5b7?w=300', price: '280.000đ' },
    ],
    user_profile: { display_name: 'Hoàng Nam', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  },
  {
    id: 'sample-new-5',
    title: 'Minimalist chic',
    result_image_url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600',
    likes_count: 203,
    comments_count: 31,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Áo len beige', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300', price: '450.000đ' },
    ],
    user_profile: { display_name: 'Linh Chi', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  },
  {
    id: 'sample-new-6',
    title: 'Sporty look đi gym',
    result_image_url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600',
    likes_count: 142,
    comments_count: 19,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Áo tank top đen', imageUrl: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=300', price: '180.000đ' },
    ],
    user_profile: { display_name: 'Phương Thảo', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
  },
  {
    id: 'sample-new-7',
    title: 'Date night outfit',
    result_image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    likes_count: 278,
    comments_count: 45,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Đầm đen body', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300', price: '680.000đ' },
    ],
    user_profile: { display_name: 'Ngọc Trinh', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100' },
  },
  {
    id: 'sample-new-8',
    title: 'Summer beach day',
    result_image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
    likes_count: 189,
    comments_count: 28,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    clothing_items: [
      { name: 'Váy maxi hoa', imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=300', price: '550.000đ' },
    ],
    user_profile: { display_name: 'Hương Giang', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100' },
  },
];

/**
 * Fetch outfits from database with user profiles
 */
async function fetchOutfitsWithProfiles(
  orderBy: 'created_at' | 'likes_count',
  limit: number = 10
): Promise<HomeOutfitItem[]> {
  // Fetch outfits with specified ordering
  const { data: outfitsData, error } = await supabase
    .from('shared_outfits')
    .select('id, title, result_image_url, likes_count, comments_count, clothing_items, user_id, created_at')
    .order(orderBy, { ascending: false })
    .limit(limit);

  if (error) throw error;

  if (!outfitsData || outfitsData.length === 0) {
    return [];
  }

  // Fetch user profiles for outfit creators
  const userIds = [...new Set(outfitsData.map(o => o.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  // Format outfits with user profiles
  return outfitsData.map(outfit => ({
    id: outfit.id,
    title: outfit.title,
    result_image_url: outfit.result_image_url,
    likes_count: outfit.likes_count,
    comments_count: outfit.comments_count ?? 0,
    clothing_items: (outfit.clothing_items as unknown as ClothingItemInfo[]) || [],
    user_profile: profileMap.get(outfit.user_id),
    created_at: outfit.created_at,
  }));
}

/**
 * Hook for fetching New Arrivals outfits
 * 
 * Fetches the most recent outfits sorted by created_at descending.
 * Uses React Query for caching with 5-minute stale time.
 * 
 * Requirements: 2.1 - Display "New Arrivals" section with horizontal scrolling
 */
export function useNewArrivals(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['home-outfits', 'new-arrivals', limit],
    queryFn: async (): Promise<HomeOutfitItem[]> => {
      try {
        const outfits = await fetchOutfitsWithProfiles('created_at', limit);
        
        // Return sample outfits if no real data
        if (outfits.length === 0) {
          return sampleOutfits.slice(0, limit);
        }
        
        // Combine with samples if not enough real data
        if (outfits.length < 6) {
          const samplesToAdd = sampleOutfits
            .filter(s => !outfits.some(o => o.id === s.id))
            .slice(0, limit - outfits.length);
          return [...outfits, ...samplesToAdd];
        }
        
        return outfits;
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
        return sampleOutfits.slice(0, limit);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook for fetching Trending Outfits
 * 
 * Fetches the most popular outfits sorted by likes_count descending.
 * Uses React Query for caching with 5-minute stale time.
 * 
 * Requirements: 2.2 - Display "Trending Styles" section with horizontal scrolling
 */
export function useTrendingOutfits(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['home-outfits', 'trending', limit],
    queryFn: async (): Promise<HomeOutfitItem[]> => {
      try {
        const outfits = await fetchOutfitsWithProfiles('likes_count', limit);
        
        // Return sample outfits sorted by likes if no real data
        if (outfits.length === 0) {
          return [...sampleOutfits]
            .sort((a, b) => b.likes_count - a.likes_count)
            .slice(0, limit);
        }
        
        // Combine with samples if not enough real data
        if (outfits.length < 6) {
          const samplesToAdd = sampleOutfits
            .filter(s => !outfits.some(o => o.id === s.id))
            .sort((a, b) => b.likes_count - a.likes_count)
            .slice(0, limit - outfits.length);
          return [...outfits, ...samplesToAdd];
        }
        
        return outfits;
      } catch (error) {
        console.error('Error fetching trending outfits:', error);
        return [...sampleOutfits]
          .sort((a, b) => b.likes_count - a.likes_count)
          .slice(0, limit);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook for fetching "For You" outfits
 * 
 * Fetches a mix of outfits for the grid section, excluding items
 * already shown in New Arrivals and Trending sections.
 * 
 * Requirements: 2.3 - Display "For You" section as a vertical grid
 */
export function useForYouOutfits(
  excludeIds: string[] = [],
  limit: number = 20
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['home-outfits', 'for-you', excludeIds.join(','), limit],
    queryFn: async (): Promise<HomeOutfitItem[]> => {
      try {
        // Fetch more outfits to have enough after filtering
        const outfits = await fetchOutfitsWithProfiles('created_at', limit + excludeIds.length);
        
        // Filter out excluded IDs
        const filtered = outfits.filter(o => !excludeIds.includes(o.id));
        
        // Return sample outfits if no real data
        if (filtered.length === 0) {
          return sampleOutfits
            .filter(s => !excludeIds.includes(s.id))
            .slice(0, limit);
        }
        
        return filtered.slice(0, limit);
      } catch (error) {
        console.error('Error fetching for you outfits:', error);
        return sampleOutfits
          .filter(s => !excludeIds.includes(s.id))
          .slice(0, limit);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  });
}
