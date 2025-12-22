import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, History, Share2, Clock, Loader2, ImageOff, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { SharedOutfitCard } from '@/components/outfit/SharedOutfitCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
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
  const [showFilters, setShowFilters] = useState(false);
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
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">

      {/* Recent History Section */}
      <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Thử đồ gần đây
          </h3>
          {recentHistory.length > 0 && onNavigateToHistory && (
            <Button variant="link" size="sm" className="text-primary" onClick={onNavigateToHistory}>
              Xem tất cả
            </Button>
          )}
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="bg-card rounded-2xl p-6 text-center border border-border">
            <History size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-3">
              Đăng nhập để xem lịch sử thử đồ
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
              Đăng nhập
            </Button>
          </div>
        ) : recentHistory.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 text-center border border-border">
            <ImageOff size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-3">
              Chưa có lịch sử thử đồ
            </p>
            <Button variant="outline" size="sm" onClick={onNavigateToTryOn}>
              Thử đồ ngay
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-32 group relative bg-card rounded-xl overflow-hidden shadow-soft border border-border"
              >
                <div className="aspect-[3/4] bg-secondary">
                  <img
                    src={item.result_image_url}
                    alt="Try-on result"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Time badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-card/90 backdrop-blur-sm text-[9px] font-medium text-foreground">
                  {formatTimeAgo(item.created_at)}
                </div>

                {/* Share button */}
                <button
                  onClick={() => handleShareOutfit(item)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Share2 size={12} />
                </button>

                {/* Bottom info */}
                <div className="p-2">
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.clothing_items?.length || 0} món đồ
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shared Outfits Section */}
      <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Outfit được chia sẻ
          </h3>
        </div>

        {loadingSharedOutfits ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sharedOutfits.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 text-center border border-border">
            <Users size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              Chưa có outfit nào được chia sẻ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sharedOutfits.slice(0, 4).map((outfit) => (
              <SharedOutfitCard
                key={outfit.id}
                outfit={outfit}
                onClick={() => handleViewOutfitDetail(outfit.id)}
                onToggleLike={toggleLike}
              />
            ))}
          </div>
        )}
      </section>

      {/* Suggestions Section with Carousel */}
      <section className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Gợi ý cho bạn
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-1.5 text-xs",
              showFilters && "bg-primary/10 text-primary"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            Lọc
          </Button>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide animate-fade-in">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.value)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  selectedFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {/* Active filter indicator */}
        {selectedFilter !== 'all' && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">
              Đang lọc: {filterOptions.find(f => f.value === selectedFilter)?.label}
            </span>
            <button
              onClick={() => setSelectedFilter('all')}
              className="p-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X size={12} className="text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Carousel */}
        {filteredItems.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 text-center border border-border">
            <ImageOff size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              Không tìm thấy sản phẩm phù hợp
            </p>
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {filteredItems.map((item) => (
                <CarouselItem key={item.id} className="pl-3 basis-[45%]">
                  <ClothingCard
                    item={item}
                    size="lg"
                    onSelect={() => onSelectItem(item)}
                    onToggleFavorite={toggleFavorite}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

        {/* Swipe hint */}
        {filteredItems.length > 2 && (
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            ← Kéo để xem thêm →
          </p>
        )}
      </section>
    </div>
  );
};
