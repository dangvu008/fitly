import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClothingItem } from '@/types/clothing';
import { useOutfitFeed } from '@/hooks/useOutfitFeed';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { toast } from 'sonner';
import { 
  Flame, 
  Shirt, 
  Building2, 
  Footprints, 
  Sparkles,
  Plus,
  Clock,
  ChevronRight,
  Heart,
  MessageCircle,
  Zap,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS, zhCN, ko, ja, th } from 'date-fns/locale';

interface HomePageProps {
  onNavigateToTryOn: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToHistory?: () => void;
  onSelectItem: (item: ClothingItem) => void;
  onViewHistoryResult?: (item: {
    id: string;
    result_image_url: string;
    body_image_url: string;
    created_at: string;
    clothing_items: Array<{ name: string; imageUrl: string }>;
  }) => void;
}

interface TryOnHistoryItem {
  id: string;
  result_image_url: string;
  body_image_url: string;
  created_at: string;
  clothing_items: Array<{ name: string; imageUrl: string }>;
}

const localeMap: Record<string, Locale> = {
  vi: vi,
  en: enUS,
  zh: zhCN,
  ko: ko,
  ja: ja,
  th: th,
};

// Explore categories
const exploreCategories = [
  { id: 'hot', icon: Flame, label: 'Hot', color: 'from-orange-500 to-red-500' },
  { id: 'dress', icon: Shirt, label: 'Dress', color: 'from-pink-500 to-rose-500' },
  { id: 'office', icon: Building2, label: 'Office', color: 'from-blue-500 to-indigo-500' },
  { id: 'shoes', icon: Footprints, label: 'Shoes', color: 'from-purple-500 to-violet-500' },
  { id: 'casual', icon: Sparkles, label: 'Casual', color: 'from-green-500 to-emerald-500' },
];

export const HomePage = ({ 
  onNavigateToTryOn, 
  onNavigateToHistory, 
  onSelectItem, 
  onViewHistoryResult 
}: HomePageProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { 
    outfits, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    loadMore, 
    refresh, 
    hideOutfit, 
    saveOutfit, 
    unsaveOutfit 
  } = useOutfitFeed();
  
  const [commentsOutfitId, setCommentsOutfitId] = useState<string | null>(null);
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeCategory, setActiveCategory] = useState('hot');
  
  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const dateLocale = localeMap[language] || enUS;

  // Fetch try-on history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setHistory([]);
        setIsLoadingHistory(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('try_on_history')
          .select('id, result_image_url, body_image_url, created_at, clothing_items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setHistory(
          (data || []).map((item) => ({
            id: item.id,
            result_image_url: item.result_image_url,
            body_image_url: item.body_image_url,
            created_at: item.created_at,
            clothing_items: (item.clothing_items as unknown as Array<{ name: string; imageUrl: string }>) || [],
          }))
        );
      } catch (error) {
        console.error('Error fetching try-on history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const handleViewOutfitDetail = (outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  };

  const handleOpenComments = (outfitId: string) => {
    setCommentsOutfitId(outfitId);
  };

  const handleShare = async (outfitId: string) => {
    const url = `${window.location.origin}/outfit/${outfitId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Check out this outfit!', url });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success(t('copied_link'));
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('copied_link'));
    }
  };

  // Get trending outfits (sorted by likes)
  const trendingOutfits = [...outfits]
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 10);

  return (
    <div className="pb-24 pt-16 max-w-lg mx-auto bg-background min-h-screen">
      <div className="animate-fade-in">
        
        {/* YOUR RECENT LOOKS - History Section */}
        <section className="py-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">{t('your_recent_looks')}</h2>
            </div>
            {history.length > 0 && onNavigateToHistory && (
              <button
                onClick={onNavigateToHistory}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                {t('view_all')}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="px-4">
            {isLoadingHistory ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="flex-shrink-0 w-20 h-28 rounded-xl" />
                ))}
              </div>
            ) : !user ? (
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-sm">{t('login_to_view_history')}</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {/* New Try-On Button */}
                <button
                  onClick={onNavigateToTryOn}
                  className="flex-shrink-0 w-20 h-28 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-primary">NEW</span>
                </button>

                {/* History Items */}
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onViewHistoryResult?.(item)}
                    className="flex-shrink-0 w-20 rounded-xl overflow-hidden bg-card border border-border shadow-soft hover:border-primary/50 hover:shadow-medium transition-all"
                  >
                    <div className="relative h-28">
                      <img
                        src={item.result_image_url}
                        alt="Try-on result"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-[8px] text-muted-foreground text-center">
                          {formatDistanceToNow(new Date(item.created_at), { locale: dateLocale, addSuffix: false })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {history.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-xs text-muted-foreground">{t('no_tryon_yet')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* EXPLORE Section */}
        <section className="py-3 px-4">
          <h2 className="text-sm font-bold text-foreground mb-3">{t('explore')}</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {exploreCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                      : 'bg-card border border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* TRENDING NOW - Grid 2 columns */}
        <section className="py-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-foreground">{t('trending_now')}</h2>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {trendingOutfits.length} {t('outfits_loved')}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : trendingOutfits.length === 0 ? (
            <div className="text-center py-8 bg-card border border-border rounded-xl">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('no_outfit_yet')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {trendingOutfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="rounded-xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-medium transition-all group"
                >
                  {/* Image */}
                  <button
                    onClick={() => handleViewOutfitDetail(outfit.id)}
                    className="relative aspect-[3/4] w-full overflow-hidden"
                  >
                    <img
                      src={outfit.result_image_url}
                      alt={outfit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    
                    {/* User info overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-card border border-border overflow-hidden">
                        {outfit.user_profile?.avatar_url ? (
                          <img 
                            src={outfit.user_profile.avatar_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-primary">
                              {(outfit.user_profile?.display_name || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-white drop-shadow-md">
                        {outfit.user_profile?.display_name || t('user')}
                      </span>
                    </div>

                    {/* Title and stats */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs font-semibold text-white line-clamp-1 drop-shadow-md">
                        {outfit.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/80 flex items-center gap-0.5">
                          <Heart className="w-3 h-3" fill="currentColor" />
                          {outfit.likes_count}
                        </span>
                        <span className="text-[10px] text-white/80 flex items-center gap-0.5">
                          <MessageCircle className="w-3 h-3" />
                          {outfit.comments_count || 0}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* TRY Button */}
                  <div className="p-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full h-8 text-xs gap-1.5 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      onClick={() => {
                        // Navigate to try-on with this outfit's clothing items
                        if (outfit.clothing_items && outfit.clothing_items.length > 0) {
                          const firstItem = outfit.clothing_items[0];
                          onSelectItem({
                            id: `outfit-${outfit.id}-0`,
                            name: firstItem.name,
                            imageUrl: firstItem.imageUrl,
                            category: 'top',
                          });
                        }
                        onNavigateToTryOn();
                      }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {t('try_this')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Load More */}
        <div ref={loadMoreRef} className="py-6 text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{t('loading_more')}</span>
            </div>
          ) : hasMore && outfits.length > 0 ? (
            <p className="text-sm text-muted-foreground">{t('scroll_for_more')}</p>
          ) : outfits.length > 0 ? (
            <p className="text-sm text-muted-foreground">{t('shown_all')}</p>
          ) : null}
        </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        outfitId={commentsOutfitId}
        isOpen={!!commentsOutfitId}
        onClose={() => setCommentsOutfitId(null)}
        onCommentAdded={refresh}
      />
    </div>
  );
};
