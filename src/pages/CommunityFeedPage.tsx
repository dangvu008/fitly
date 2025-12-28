import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Compass, Trophy } from 'lucide-react';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { FloatingCreateButton } from '@/components/feed/FloatingCreateButton';
import { OutfitFeedCard } from '@/components/feed/OutfitFeedCard';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * CommunityFeedPage - Main page for browsing community outfits
 * 
 * Features:
 * - Three tabs: Following, Explore, Ranking
 * - Infinite scroll
 * - Outfit cards with interactions
 * - Floating create button
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4
 */
const CommunityFeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    outfits,
    activeTab,
    setActiveTab,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    hideOutfit,
    saveOutfit,
    unsaveOutfit,
  } = useCommunityFeed();

  const [commentsOutfitId, setCommentsOutfitId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer - Requirements 2.1
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  const handleOpenComments = useCallback((outfitId: string) => {
    setCommentsOutfitId(outfitId);
  }, []);

  const handleShare = useCallback((outfitId: string) => {
    // Copy link to clipboard
    const url = `${window.location.origin}/outfit/${outfitId}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link outfit');
  }, []);

  const handleViewDetail = useCallback((outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  }, [navigate]);

  // Empty state messages - Requirements 2.4
  const renderEmptyState = () => {
    const emptyStates = {
      following: {
        icon: Users,
        title: 'Chưa có outfit nào',
        description: 'Follow người dùng khác để xem outfit của họ',
      },
      explore: {
        icon: Compass,
        title: 'Chưa có outfit nào',
        description: 'Hãy là người đầu tiên chia sẻ outfit!',
      },
      ranking: {
        icon: Trophy,
        title: 'Chưa có outfit nào',
        description: 'Các outfit phổ biến sẽ xuất hiện ở đây',
      },
    };

    const state = emptyStates[activeTab];
    const Icon = state.icon;

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{state.title}</h3>
        <p className="text-muted-foreground text-sm">{state.description}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <FeedHeader />
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Feed List */}
      <div className="max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : outfits.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {outfits.map((outfit) => (
              <OutfitFeedCard
                key={outfit.id}
                outfit={{
                  id: outfit.id,
                  title: outfit.title,
                  description: outfit.description || undefined,
                  result_image_url: outfit.result_image_url,
                  likes_count: outfit.likes_count,
                  comments_count: outfit.comments_count,
                  is_featured: outfit.is_featured,
                  created_at: outfit.created_at,
                  user_id: outfit.user_id,
                  clothing_items: outfit.clothing_items,
                  inspired_by_outfit_id: outfit.inspired_by_outfit_id,
                }}
                userProfile={outfit.user_profile}
                inspiredByOutfit={outfit.inspired_by_outfit}
                isLiked={outfit.isLiked}
                isSaved={outfit.isSaved}
                onOpenComments={handleOpenComments}
                onShare={handleShare}
                onViewDetail={handleViewDetail}
                onSave={saveOutfit}
                onUnsave={unsaveOutfit}
                onHide={hideOutfit}
              />
            ))}

            {/* Load more trigger - Requirements 2.1, 2.2 */}
            <div ref={loadMoreRef} className="py-4">
              {isLoadingMore && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              {!hasMore && outfits.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Bạn đã xem hết tất cả outfit 🎉
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <FloatingCreateButton />

      {/* Comments Sheet */}
      <CommentsSheet
        outfitId={commentsOutfitId}
        isOpen={!!commentsOutfitId}
        onClose={() => setCommentsOutfitId(null)}
      />
    </div>
  );
};

export default CommunityFeedPage;
