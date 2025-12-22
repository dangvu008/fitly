import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, History, Share2, ImageOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkeletonGrid, SkeletonStories } from '@/components/ui/skeleton-grid';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedOutfits } from '@/hooks/useSharedOutfits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClothingItemData {
  name: string;
  imageUrl: string;
}

interface TryOnHistoryItem {
  id: string;
  body_image_url: string;
  result_image_url: string;
  clothing_items: ClothingItemData[];
  created_at: string;
}

interface HomePageProps {
  onNavigateToTryOn: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToHistory?: () => void;
  onSelectItem: (item: ClothingItem) => void;
}

type FilterOption = {
  id: string;
  label: string;
  value: ClothingCategory | 'all';
};

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'Tất cả', value: 'all' },
  { id: 'top', label: 'Áo', value: 'top' },
  { id: 'bottom', label: 'Quần', value: 'bottom' },
  { id: 'dress', label: 'Váy', value: 'dress' },
  { id: 'shoes', label: 'Giày', value: 'shoes' },
  { id: 'accessory', label: 'Phụ kiện', value: 'accessory' },
];

export const HomePage = ({ onNavigateToTryOn, onNavigateToCompare, onNavigateToHistory, onSelectItem }: HomePageProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clothing, setClothing] = useState(sampleClothing);
  const [recentHistory, setRecentHistory] = useState<TryOnHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ClothingCategory | 'all'>('all');
  const { sharedOutfits, isLoading: loadingSharedOutfits, toggleLike } = useSharedOutfits();

  useEffect(() => {
    if (user) {
      fetchRecentHistory();
    } else {
      setLoadingHistory(false);
    }
  }, [user]);

  const fetchRecentHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('try_on_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4);

    if (!error && data) {
      const typedData = data.map(item => ({
        ...item,
        clothing_items: (item.clothing_items || []) as unknown as ClothingItemData[],
      }));
      setRecentHistory(typedData);
    }
    setLoadingHistory(false);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleShareOutfit = async (item: TryOnHistoryItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Outfit thử đồ AI',
          text: 'Xem outfit tôi vừa thử với AI!',
          url: item.result_image_url,
        });
        toast.success('Đã chia sẻ thành công!');
      } else {
        await navigator.clipboard.writeText(item.result_image_url);
        toast.success('Đã sao chép link ảnh!');
      }
    } catch (error) {
      // User cancelled share
    }
  };

  const toggleFavorite = (item: ClothingItem) => {
    setClothing(prev =>
      prev.map(c =>
        c.id === item.id ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
  };

  const handleViewOutfitDetail = (outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  };

  const filteredItems = selectedFilter === 'all' 
    ? clothing 
    : clothing.filter(item => item.category === selectedFilter);

  return (
    <div className="pb-24 pt-16 max-w-lg mx-auto">

      {/* Stories-style Recent History */}
      <section className="animate-fade-in border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold text-foreground">Thử đồ gần đây</h3>
          {recentHistory.length > 0 && onNavigateToHistory && (
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={onNavigateToHistory}>
              Xem tất cả
            </Button>
          )}
        </div>

        {loadingHistory ? (
          <SkeletonStories count={4} />
        ) : !user ? (
          <div className="px-4 pb-4">
            <div className="bg-secondary/50 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent mx-auto mb-3 flex items-center justify-center">
                <History size={24} className="text-primary-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Đăng nhập để xem lịch sử
              </p>
              <Button variant="instagram" size="sm" onClick={() => window.location.href = '/auth'}>
                Đăng nhập
              </Button>
            </div>
          </div>
        ) : recentHistory.length === 0 ? (
          <div className="px-4 pb-4">
            <div className="bg-secondary/50 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent mx-auto mb-3 flex items-center justify-center">
                <ImageOff size={24} className="text-primary-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Chưa có lịch sử thử đồ
              </p>
              <Button variant="instagram" size="sm" onClick={onNavigateToTryOn}>
                Thử đồ ngay
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
            {recentHistory.map((item, index) => (
              <div
                key={item.id}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Story ring */}
                <div className="relative">
                  <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-primary via-accent to-pink-500">
                    <div className="w-full h-full rounded-full bg-background p-[2px]">
                      <img
                        src={item.result_image_url}
                        alt="Try-on"
                        className="w-full h-full rounded-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleShareOutfit(item)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg"
                  >
                    <Share2 size={12} />
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground max-w-[72px] truncate text-center">
                  {formatTimeAgo(item.created_at)}
                </span>
              </div>
            ))}
            
            {/* Add new story button */}
            <div 
              className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={onNavigateToTryOn}
            >
              <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors">
                <span className="text-2xl text-muted-foreground">+</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Thử mới</span>
            </div>
          </div>
        )}
      </section>

      {/* Filter Chips */}
      <section className="px-4 py-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.value)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                selectedFilter === filter.value
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* Instagram-style Grid */}
      <section className="animate-fade-in px-4">
        {/* Shared Outfits Header */}
        <div className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <Users size={16} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-foreground">Khám phá</h3>
            <p className="text-xs text-muted-foreground">Outfit & gợi ý phong cách</p>
          </div>
        </div>

        {loadingSharedOutfits ? (
          <SkeletonGrid count={9} className="rounded-xl overflow-hidden" />
        ) : (
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
            {/* Shared Outfits */}
            {sharedOutfits.slice(0, 6).map((outfit, index) => (
              <div
                key={outfit.id}
                onClick={() => handleViewOutfitDetail(outfit.id)}
                className="aspect-square relative cursor-pointer group overflow-hidden animate-scale-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <img
                  src={outfit.result_image_url}
                  alt={outfit.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-4 text-white">
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      ❤️ {outfit.likes_count}
                    </span>
                  </div>
                </div>
                {/* Featured badge */}
                {outfit.is_featured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium">
                    Featured
                  </div>
                )}
              </div>
            ))}
            
            {/* Suggestions Grid */}
            {filteredItems.slice(0, Math.max(0, 12 - sharedOutfits.length)).map((item, index) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="aspect-square relative cursor-pointer group overflow-hidden animate-scale-in"
                style={{ animationDelay: `${(sharedOutfits.length + index) * 0.03}s` }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Category badge */}
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="inline-block px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm text-[10px] font-medium text-foreground truncate max-w-full">
                    {item.name}
                  </span>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        )}
        
        {/* Load more hint */}
        {(sharedOutfits.length > 0 || filteredItems.length > 0) && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Kéo xuống để xem thêm
            </p>
            <ChevronDown className="w-5 h-5 mx-auto mt-1 text-muted-foreground animate-bounce" />
          </div>
        )}
      </section>
    </div>
  );
};
