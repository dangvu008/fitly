import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Heart, ArrowRight, Scale, History, Share2, Clock, Loader2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem } from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const HomePage = ({ onNavigateToTryOn, onNavigateToCompare, onNavigateToHistory, onSelectItem }: HomePageProps) => {
  const { user } = useAuth();
  const [clothing, setClothing] = useState(sampleClothing);
  const [recentHistory, setRecentHistory] = useState<TryOnHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  const featuredItems = clothing.slice(0, 4);

  return (
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">
      {/* Hero section */}
      <section className="relative rounded-3xl overflow-hidden gradient-primary p-6 shadow-glow animate-slide-up">
        <div className="relative z-10">
          <h2 className="text-xl font-display font-bold text-primary-foreground mb-2">
            Thử đồ ngay tại nhà
          </h2>
          <p className="text-sm text-primary-foreground/80 mb-4">
            Ghép ảnh quần áo với ảnh của bạn để xem trước khi mua
          </p>
          <Button
            onClick={onNavigateToTryOn}
            variant="secondary"
            className="group"
          >
            Bắt đầu thử đồ
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-20">
          <Sparkles size={120} />
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button 
          onClick={onNavigateToTryOn}
          className="bg-card rounded-2xl p-4 shadow-soft border border-border hover:border-primary/50 hover:shadow-medium transition-all duration-300 text-left group"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Phòng thử đồ</h3>
          <p className="text-xs text-muted-foreground mt-1">Thử ngay với AI</p>
        </button>
        
        <button 
          onClick={onNavigateToCompare}
          className="bg-card rounded-2xl p-4 shadow-soft border border-border hover:border-accent/50 hover:shadow-medium transition-all duration-300 text-left group"
        >
          <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Scale size={20} className="text-accent-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">So sánh Outfit</h3>
          <p className="text-xs text-muted-foreground mt-1">Xem cạnh nhau</p>
        </button>
      </section>

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

      {/* Share Favorites Section */}
      {user && recentHistory.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-soft">
                <Heart size={20} className="text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-sm">
                  Chia sẻ outfit yêu thích
                </h3>
                <p className="text-muted-foreground text-xs">
                  Gửi cho bạn bè xem outfit của bạn
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {recentHistory.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleShareOutfit(item)}
                  className="flex-1 aspect-[3/4] rounded-lg overflow-hidden bg-secondary relative group"
                >
                  <img
                    src={item.result_image_url}
                    alt="Outfit"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Share2 size={16} className="text-primary-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Suggestions Section */}
      <section className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Gợi ý cho bạn
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {featuredItems.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              size="lg"
              onSelect={() => onSelectItem(item)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
