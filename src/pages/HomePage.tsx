import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClothingItem } from '@/types/clothing';
import { useNewArrivals, useTrendingOutfits, useForYouOutfits, HomeOutfitItem } from '@/hooks/useHomeOutfits';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTryOnDialog } from '@/contexts/TryOnDialogContext';
import { useOutfitActions } from '@/hooks/useOutfitActions';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { HorizontalScrollSection, OutfitItem } from '@/components/home/HorizontalScrollSection';
import { HomeOutfitCard } from '@/components/home/HomeOutfitCard';
import {
  Flame,
  Sparkles,
  Plus,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, Locale } from 'date-fns';
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
  /** Quick Try handler for Smart Paste flow */
  onQuickTry?: (garmentUrl: string, garmentId?: string, autoStart?: boolean) => void;
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

/**
 * HomePage component with redesigned layout
 * 
 * Requirements:
 * - 1.1: History Section at top
 * - 2.1: "New Arrivals" HorizontalScrollSection
 * - 2.2: "Trending Styles" HorizontalScrollSection
 * - 2.3: "For You" 2-column grid at bottom
 * - 6.1: Section headers with icons
 */
export const HomePage = ({
  onNavigateToTryOn,
  onNavigateToHistory,
  onSelectItem,
  onViewHistoryResult,
  onQuickTry,
}: HomePageProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { openDialog } = useTryOnDialog();
  const { isSaved, toggleSave, hideOutfit, hiddenOutfitIds } = useOutfitActions();

  // Use dedicated hooks for each section with React Query caching (Requirements 2.1, 2.2)
  const {
    data: newArrivals = [],
    isLoading: isLoadingNewArrivals,
    refetch: refetchNewArrivals,
  } = useNewArrivals(10);

  const {
    data: trendingStyles = [],
    isLoading: isLoadingTrending,
    refetch: refetchTrending,
  } = useTrendingOutfits(10);

  // Calculate IDs to exclude from "For You" section to avoid repetition
  const excludeIds = useMemo(() => {
    const ids = new Set<string>();
    newArrivals.slice(0, 6).forEach(o => ids.add(o.id));
    trendingStyles.slice(0, 6).forEach(o => ids.add(o.id));
    return Array.from(ids);
  }, [newArrivals, trendingStyles]);

  const {
    data: forYouOutfits = [],
    isLoading: isLoadingForYou,
    refetch: refetchForYou,
  } = useForYouOutfits(excludeIds, 20);

  // Combined loading state
  const isLoading = isLoadingNewArrivals || isLoadingTrending || isLoadingForYou;

  const [commentsOutfitId, setCommentsOutfitId] = useState<string | null>(null);
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Infinite scroll observer for "For You" section
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const dateLocale = localeMap[language] || enUS;

  // Refresh all sections
  const refresh = () => {
    refetchNewArrivals();
    refetchTrending();
    refetchForYou();
  };

  // Fetch try-on history (max 10 items per Requirements 1.5)
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

  // Convert HomeOutfitItem to OutfitItem format for HorizontalScrollSection
  const toOutfitItem = (outfit: HomeOutfitItem): OutfitItem => ({
    id: outfit.id,
    title: outfit.title,
    result_image_url: outfit.result_image_url,
    likes_count: outfit.likes_count,
    comments_count: outfit.comments_count,
    clothing_items: outfit.clothing_items,
    user_profile: outfit.user_profile,
    created_at: outfit.created_at,
  });

  // Filter out hidden outfits
  const filterHidden = (outfits: HomeOutfitItem[]) =>
    outfits.filter(o => !hiddenOutfitIds.has(o.id));

  const handleViewOutfitDetail = (outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  };

  const handleTryOutfit = (outfit: OutfitItem) => {
    if (outfit.clothing_items && outfit.clothing_items.length > 0) {
      // Convert outfit clothing items to ClothingItem format
      const clothingItems = outfit.clothing_items.map((item, index) => ({
        id: `outfit-${outfit.id}-${index}`,
        name: item.name,
        imageUrl: item.imageUrl,
        category: 'all' as const,
        shopUrl: item.shopUrl,
        price: item.price,
      }));

      // Open TryOnDialog with the clothing items
      openDialog({
        reuseClothingItems: clothingItems,
      });
    }
  };

  const handleSaveOutfit = (outfit: OutfitItem) => {
    toggleSave(outfit.id);
  };

  const handleHideOutfit = (outfit: OutfitItem) => {
    hideOutfit(outfit.id);
  };

  return (
    <div className="pb-24 pt-16 max-w-lg mx-auto bg-background min-h-screen">
      <div className="animate-fade-in">

        {/* YOUR RECENT LOOKS - History Section (Requirements 1.1, 1.2, 1.3, 1.4, 1.5) */}
        <section className="py-4">
          <div className="flex items-center justify-between px-3 sm:px-4 mb-3">
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

          <div className="px-3 sm:px-4">
            {isLoadingHistory ? (
              <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="flex-shrink-0 w-[72px] sm:w-20 h-[100px] sm:h-28 rounded-xl" />
                ))}
              </div>
            ) : !user ? (
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-sm">{t('login_to_view_history')}</p>
              </div>
            ) : (
              <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide">
                {/* New Try-On Button (Requirements 1.3) */}
                <button
                  onClick={onNavigateToTryOn}
                  className="flex-shrink-0 w-[72px] sm:w-20 h-[100px] sm:h-28 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:bg-primary/10 hover:border-primary transition-all"
                  data-testid="new-tryon-button"
                >
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Plus className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-medium text-primary">NEW</span>
                </button>

                {/* History Items (Requirements 1.4) */}
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onViewHistoryResult?.(item)}
                    className="flex-shrink-0 w-[72px] sm:w-20 rounded-xl overflow-hidden bg-card border border-border shadow-soft hover:border-primary/50 hover:shadow-medium transition-all"
                    data-testid={`history-item-${item.id}`}
                  >
                    <div className="relative h-[100px] sm:h-28">
                      <img
                        src={item.result_image_url}
                        alt="Try-on result"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-[7px] sm:text-[8px] text-muted-foreground text-center">
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

        {/* NEW ARRIVALS - Horizontal Scroll Section (Requirements 2.1, 2.5, 6.1) */}
        <HorizontalScrollSection
          title={t('new_arrivals')}
          icon={Sparkles}
          items={filterHidden(newArrivals).map(toOutfitItem)}
          onItemClick={(item) => handleViewOutfitDetail(item.id)}
          onTryItem={handleTryOutfit}
          onSaveItem={handleSaveOutfit}
          onHideItem={handleHideOutfit}
          isItemSaved={isSaved}
          showViewAll={true}
          onViewAll={() => navigate('/community')}
          isLoading={isLoading}
          data-testid="new-arrivals-section"
        />

        {/* TRENDING STYLES - Horizontal Scroll Section (Requirements 2.2, 2.5, 6.1) */}
        <HorizontalScrollSection
          title={t('trending_styles')}
          icon={Flame}
          items={filterHidden(trendingStyles).map(toOutfitItem)}
          onItemClick={(item) => handleViewOutfitDetail(item.id)}
          onTryItem={handleTryOutfit}
          onSaveItem={handleSaveOutfit}
          onHideItem={handleHideOutfit}
          isItemSaved={isSaved}
          showViewAll={true}
          onViewAll={() => navigate('/community')}
          isLoading={isLoading}
          data-testid="trending-styles-section"
        />

        {/* COMMUNITY SUGGESTIONS - Reusing HorizontalScrollSection for consistency */}
        <HorizontalScrollSection
          title={t('community_suggestions')}
          icon={Sparkles}
          items={filterHidden(trendingStyles).slice(0, 8).map(toOutfitItem)}
          onItemClick={(item) => handleViewOutfitDetail(item.id)}
          onTryItem={handleTryOutfit}
          onSaveItem={handleSaveOutfit}
          onHideItem={handleHideOutfit}
          isItemSaved={isSaved}
          showViewAll={true}
          onViewAll={() => navigate('/community')}
          isLoading={isLoading}
          data-testid="community-suggestions-section"
        />

        {/* FOR YOU - 2-Column Grid Section (Requirements 2.3) */}
        <section className="py-4 px-3 sm:px-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">{t('for_you')}</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : forYouOutfits.length === 0 ? (
            <div className="text-center py-8 bg-card border border-border rounded-xl">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('no_outfit_yet')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3" data-testid="for-you-grid">
              {filterHidden(forYouOutfits).map((outfit) => (
                <HomeOutfitCard
                  key={outfit.id}
                  outfit={toOutfitItem(outfit)}
                  onTry={() => handleTryOutfit(toOutfitItem(outfit))}
                  onClick={() => handleViewOutfitDetail(outfit.id)}
                  variant="grid"
                  isSaved={isSaved(outfit.id)}
                  onSave={() => handleSaveOutfit(toOutfitItem(outfit))}
                  onHide={() => handleHideOutfit(toOutfitItem(outfit))}
                  data-testid={`for-you-card-${outfit.id}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Load More indicator */}
        <div ref={loadMoreRef} className="py-6 text-center">
          {forYouOutfits.length > 0 ? (
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
