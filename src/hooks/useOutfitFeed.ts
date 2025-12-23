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
  inspired_by_outfit_id?: string | null;
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  /** Data about the outfit that inspired this one (Requirements 5.3) */
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

const PAGE_SIZE = 10;

// Sample community outfits for display when no real data exists
const sampleCommunityOutfits: SharedOutfit[] = [
  {
    id: 'sample-outfit-1',
    title: 'Outfit công sở thanh lịch',
    description: 'Phối đồ công sở với áo sơ mi trắng và quần tây đen, phù hợp cho các buổi họp quan trọng 💼',
    result_image_url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600',
    likes_count: 128,
    comments_count: 15,
    is_featured: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-1',
    clothing_items: [
      { name: 'Áo sơ mi trắng', imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300', price: '350.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Quần tây đen', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300', price: '480.000đ', shopUrl: 'https://lazada.vn' }
    ],
    user_profile: { display_name: 'Minh Anh', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-2',
    title: 'Street style năng động',
    description: 'Phong cách đường phố với hoodie và sneaker, cực kỳ thoải mái cho ngày cuối tuần 🔥',
    result_image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
    likes_count: 95,
    comments_count: 8,
    is_featured: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-2',
    clothing_items: [
      { name: 'Hoodie đen', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300', price: '420.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Giày sneaker', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300', price: '890.000đ', shopUrl: 'https://tiki.vn' }
    ],
    user_profile: { display_name: 'Đức Anh', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-3',
    title: 'Váy hoa đi dạo phố',
    description: 'Nữ tính và dịu dàng với váy hoa nhí, hoàn hảo cho buổi hẹn hò cuối tuần 🌸',
    result_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
    likes_count: 156,
    comments_count: 22,
    is_featured: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-3',
    clothing_items: [
      { name: 'Váy midi hoa', imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300', price: '520.000đ', shopUrl: 'https://lazada.vn' },
      { name: 'Túi xách', imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300', price: '650.000đ', shopUrl: 'https://shopee.vn' }
    ],
    user_profile: { display_name: 'Thu Hà', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-4',
    title: 'Casual Friday vibes',
    description: 'Áo polo kết hợp quần kaki, đơn giản nhưng vẫn lịch sự cho ngày thứ 6 thoải mái 👔',
    result_image_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600',
    likes_count: 87,
    comments_count: 12,
    is_featured: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-4',
    clothing_items: [
      { name: 'Áo polo xanh navy', imageUrl: 'https://images.unsplash.com/photo-1625910513413-5fc45e80b5b7?w=300', price: '280.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Quần kaki be', imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300', price: '390.000đ', shopUrl: 'https://lazada.vn' }
    ],
    user_profile: { display_name: 'Hoàng Nam', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-5',
    title: 'Minimalist chic',
    description: 'Phong cách tối giản với tông màu trung tính, less is more ✨',
    result_image_url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600',
    likes_count: 203,
    comments_count: 31,
    is_featured: true,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-5',
    clothing_items: [
      { name: 'Áo len beige', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300', price: '450.000đ', shopUrl: 'https://tiki.vn' },
      { name: 'Quần culottes trắng', imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300', price: '380.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Túi tote canvas', imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300', price: '220.000đ', shopUrl: 'https://lazada.vn' }
    ],
    user_profile: { display_name: 'Linh Chi', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-6',
    title: 'Sporty look đi gym',
    description: 'Set đồ tập gym năng động, thoáng mát và co giãn tốt 💪',
    result_image_url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600',
    likes_count: 142,
    comments_count: 19,
    is_featured: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-6',
    clothing_items: [
      { name: 'Áo tank top đen', imageUrl: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=300', price: '180.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Quần legging', imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=300', price: '320.000đ', shopUrl: 'https://tiki.vn' },
      { name: 'Giày running', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', price: '1.200.000đ', shopUrl: 'https://lazada.vn' }
    ],
    user_profile: { display_name: 'Phương Thảo', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-7',
    title: 'Date night outfit',
    description: 'Đầm đen quyến rũ cho buổi tối hẹn hò lãng mạn 🖤',
    result_image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    likes_count: 278,
    comments_count: 45,
    is_featured: true,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-7',
    clothing_items: [
      { name: 'Đầm đen body', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300', price: '680.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Giày cao gót', imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300', price: '750.000đ', shopUrl: 'https://lazada.vn' },
      { name: 'Clutch nhỏ', imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=300', price: '420.000đ', shopUrl: 'https://tiki.vn' }
    ],
    user_profile: { display_name: 'Ngọc Trinh', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-8',
    title: 'Summer beach day',
    description: 'Outfit đi biển mùa hè với váy maxi và sandal, sẵn sàng cho kỳ nghỉ 🏖️',
    result_image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
    likes_count: 189,
    comments_count: 28,
    is_featured: false,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-8',
    clothing_items: [
      { name: 'Váy maxi hoa', imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=300', price: '550.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Sandal đế bệt', imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300', price: '290.000đ', shopUrl: 'https://lazada.vn' },
      { name: 'Mũ cói', imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=300', price: '180.000đ', shopUrl: 'https://tiki.vn' }
    ],
    user_profile: { display_name: 'Hương Giang', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-9',
    title: 'Denim on denim',
    description: 'Phối đồ denim cực chất, xu hướng không bao giờ lỗi mốt 👖',
    result_image_url: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=600',
    likes_count: 167,
    comments_count: 24,
    is_featured: false,
    created_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-9',
    clothing_items: [
      { name: 'Áo khoác jean', imageUrl: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=300', price: '620.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Quần jean skinny', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300', price: '450.000đ', shopUrl: 'https://lazada.vn' },
      { name: 'Áo thun trắng', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300', price: '150.000đ', shopUrl: 'https://tiki.vn' }
    ],
    user_profile: { display_name: 'Quang Huy', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'sample-outfit-10',
    title: 'Cozy winter look',
    description: 'Outfit mùa đông ấm áp với áo len oversize và boots, chuẩn bị cho những ngày lạnh ❄️',
    result_image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600',
    likes_count: 234,
    comments_count: 37,
    is_featured: true,
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    user_id: 'sample-user-10',
    clothing_items: [
      { name: 'Áo len oversize', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300', price: '580.000đ', shopUrl: 'https://shopee.vn' },
      { name: 'Chân váy len', imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj9a?w=300', price: '420.000đ', shopUrl: 'https://lazada.vn' },
      { name: 'Boots da', imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=300', price: '980.000đ', shopUrl: 'https://tiki.vn' }
    ],
    user_profile: { display_name: 'Thanh Tâm', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
    isLiked: false,
    isSaved: false,
  },
];

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
        // Show sample outfits when no real data
        if (isInitial) {
          setOutfits(sampleCommunityOutfits);
        }
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set(outfitsData.map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch inspired_by outfits data (Requirements 5.3)
      const inspiredByIds = outfitsData
        .map(o => (o as any).inspired_by_outfit_id)
        .filter((id): id is string => !!id);
      
      let inspiredByMap = new Map<string, { id: string; title: string; user_id: string }>();
      if (inspiredByIds.length > 0) {
        const { data: inspiredOutfits } = await supabase
          .from('shared_outfits')
          .select('id, title, user_id')
          .in('id', inspiredByIds);
        
        if (inspiredOutfits) {
          // Fetch profiles for inspired outfit authors
          const inspiredUserIds = [...new Set(inspiredOutfits.map(o => o.user_id))];
          const { data: inspiredProfiles } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', inspiredUserIds);
          
          const inspiredProfileMap = new Map(inspiredProfiles?.map(p => [p.user_id, p]) || []);
          
          inspiredOutfits.forEach(outfit => {
            inspiredByMap.set(outfit.id, {
              ...outfit,
              user_profile: inspiredProfileMap.get(outfit.user_id),
            } as any);
          });
        }
      }

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

      const formattedOutfits: SharedOutfit[] = outfitsData.map(outfit => {
        const inspiredByOutfitId = (outfit as any).inspired_by_outfit_id;
        const inspiredByOutfitData = inspiredByOutfitId ? inspiredByMap.get(inspiredByOutfitId) : null;
        
        return {
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
          inspired_by_outfit_id: inspiredByOutfitId || null,
          user_profile: profileMap.get(outfit.user_id),
          // Requirements 5.3: Include inspired_by_outfit data for display
          inspired_by_outfit: inspiredByOutfitData ? {
            id: inspiredByOutfitData.id,
            title: inspiredByOutfitData.title,
            user_profile: (inspiredByOutfitData as any).user_profile,
          } : null,
          isLiked: likedOutfitIds.has(outfit.id),
          isSaved: savedOutfitIds.has(outfit.id),
        };
      });

      // Add sample outfits if no real data or for initial display
      if (isInitial && formattedOutfits.length === 0) {
        setOutfits(sampleCommunityOutfits);
      } else if (isInitial) {
        // Always combine real outfits with sample outfits for richer content
        const realOutfitIds = new Set(formattedOutfits.map(o => o.id));
        const samplesToAdd = sampleCommunityOutfits.filter(s => !realOutfitIds.has(s.id));
        const combinedOutfits = [...formattedOutfits, ...samplesToAdd];
        setOutfits(combinedOutfits);
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
      // On error, show sample outfits
      if (isInitial) {
        setOutfits(sampleCommunityOutfits);
      }
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
