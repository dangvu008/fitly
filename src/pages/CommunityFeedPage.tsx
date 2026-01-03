import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Loader2,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { CommunityFeedLayout } from '@/components/feed/CommunityFeedLayout';
import { OutfitWithUser } from '@/components/feed/CommunityOutfitCard';
import { useCommunityFeed, SharedOutfit } from '@/hooks/useCommunityFeed';
import { useTryOnDialog } from '@/contexts/TryOnDialogContext';

/**
 * Filter options for Community page
 * Requirements: 6.2 - Filter chips at the top (Trending, Latest, Following)
 */
const filterOptions = [
  { id: 'trending', icon: Flame, label: 'Trending' },
  { id: 'latest', icon: Clock, label: 'Mới nhất' },
  { id: 'following', icon: Users, label: 'Đang theo dõi' },
] as const;

type FilterId = typeof filterOptions[number]['id'];

/**
 * Convert SharedOutfit to OutfitWithUser format for CommunityOutfitCard
 */
const toOutfitWithUser = (outfit: SharedOutfit): OutfitWithUser => ({
  id: outfit.id,
  title: outfit.title,
  description: outfit.description,
  result_image_url: outfit.result_image_url,
  likes_count: outfit.likes_count,
  comments_count: outfit.comments_count,
  is_featured: outfit.is_featured,
  created_at: outfit.created_at,
  user_id: outfit.user_id,
  clothing_items: outfit.clothing_items,
  user_profile: {
    display_name: outfit.user_profile?.display_name || 'User',
    avatar_url: outfit.user_profile?.avatar_url || null,
  },
  isLiked: outfit.isLiked,
  isSaved: outfit.isSaved,
});

/**
 * CommunityFeedPage - Redesigned community page with Instagram-style layout
 * 
 * Requirements:
 * - 4.3: Prominently display likes and comments count
 * - 4.4: Navigate to outfit detail page on tap
 * - 4.5: NO History_Section (differentiating from Home)
 * - 6.2: Filter chips at the top (Trending, Latest, Following)
 * 
 * Features:
 * - Single-column Instagram-style layout (default)
 * - Filter chips for content filtering
 * - CommunityOutfitCard with larger user info and captions
 * - Infinite scroll
 */
const CommunityFeedPage = () => {
  const navigate = useNavigate();
  const { openDialog } = useTryOnDialog();
  const {
    outfits,
    setActiveTab,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    saveOutfit,
    unsaveOutfit,
    hideOutfit,
  } = useCommunityFeed();

  const [commentsOutfitId, setCommentsOutfitId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>('trending');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Map filter to tab
  useEffect(() => {
    const tabMap: Record<FilterId, 'following' | 'explore' | 'ranking'> = {
      trending: 'ranking',
      latest: 'explore',
      following: 'following',
    };
    setActiveTab(tabMap[activeFilter]);
  }, [activeFilter, setActiveTab]);

  // Infinite scroll observer
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

  // Convert outfits to OutfitWithUser format
  const outfitsWithUser = useMemo(() => 
    outfits.map(toOutfitWithUser),
    [outfits]
  );

  // Sort outfits based on filter
  const sortedOutfits = useMemo(() => {
    const sorted = [...outfitsWithUser];
    if (activeFilter === 'trending') {
      return sorted.sort((a, b) => b.likes_count - a.likes_count);
    }
    return sorted.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [outfitsWithUser, activeFilter]);

  const handleOutfitClick = useCallback((outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  }, [navigate]);

  const handleLike = useCallback((outfitId: string) => {
    // Like functionality handled by CommunityOutfitCard internally
    console.log('Like outfit:', outfitId);
  }, []);

  const handleComment = useCallback((outfitId: string) => {
    setCommentsOutfitId(outfitId);
  }, []);

  const handleTryOutfit = useCallback((outfit: OutfitWithUser) => {
    // Open TryOnDialog with outfit's clothing items
    if (outfit.clothing_items && outfit.clothing_items.length > 0) {
      const clothingItems = outfit.clothing_items.map((item, index) => ({
        id: `outfit-${outfit.id}-${index}`,
        name: item.name,
        imageUrl: item.imageUrl,
        category: 'all' as const,
        shopUrl: item.shopUrl,
        price: item.price,
      }));
      
      openDialog({
        reuseClothingItems: clothingItems,
      });
    }
  }, [openDialog]);

  return (
    <div className="min-h-screen bg-background pb-24 pt-16" data-testid="community-feed-page">
      <div className="max-w-lg mx-auto px-4">
        {/* Page Header */}
        <div className="py-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Cộng đồng</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Khám phá outfit từ cộng đồng và lấy cảm hứng
          </p>
        </div>

        {/* Filter Chips - Requirements 6.2 */}
        <div 
          className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1"
          data-testid="filter-chips"
        >
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                data-testid={`filter-${filter.id}`}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-foreground hover:border-primary/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              {sortedOutfits.length} outfit
            </span>
          </div>
        </div>

        {/* Outfit Feed - Requirements 4.5: NO History Section */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
            ))}
          </div>
        ) : sortedOutfits.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-2">Chưa có outfit nào</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeFilter === 'following' 
                ? 'Follow người dùng khác để xem outfit của họ'
                : 'Hãy là người đầu tiên chia sẻ outfit!'}
            </p>
            <Button 
              onClick={() => navigate('/try-on')}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Zap className="w-4 h-4 mr-2" />
              Tạo outfit mới
            </Button>
          </div>
        ) : (
          /* Single-column layout as default - Requirements 4.1 */
          <CommunityFeedLayout
            outfits={sortedOutfits}
            layout="single-column"
            onOutfitClick={handleOutfitClick}
            onLike={handleLike}
            onComment={handleComment}
            onTry={handleTryOutfit}
            onSave={saveOutfit}
            onUnsave={unsaveOutfit}
            onHide={hideOutfit}
            data-testid="community-feed-layout"
          />
        )}

        {/* Load More */}
        <div ref={loadMoreRef} className="py-6 text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Đang tải...</span>
            </div>
          ) : hasMore && sortedOutfits.length > 0 ? (
            <p className="text-xs text-muted-foreground">Cuộn để xem thêm</p>
          ) : sortedOutfits.length > 0 ? (
            <p className="text-xs text-muted-foreground">Bạn đã xem hết 🎉</p>
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

export default CommunityFeedPage;
