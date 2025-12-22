import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ClothingItem } from '@/types/clothing';
import { useOutfitFeed } from '@/hooks/useOutfitFeed';
import { OutfitFeedCard } from '@/components/feed/OutfitFeedCard';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { toast } from 'sonner';

interface HomePageProps {
  onNavigateToTryOn: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToHistory?: () => void;
  onSelectItem: (item: ClothingItem) => void;
}

export const HomePage = ({ onNavigateToTryOn, onSelectItem }: HomePageProps) => {
  const navigate = useNavigate();
  const { outfits, isLoading, isLoadingMore, hasMore, loadMore, refresh, hideOutfit, saveOutfit, unsaveOutfit } = useOutfitFeed();
  
  const [commentsOutfitId, setCommentsOutfitId] = useState<string | null>(null);
  
  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
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
        await navigator.share({
          title: 'Check out this outfit!',
          url,
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success('Đã copy link!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Đã copy link!');
    }
  };

  return (
    <div className="pb-24 pt-16 max-w-lg mx-auto">
      {/* Instagram-style Feed */}
      <div className="animate-fade-in">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border-b border-border">
                <div className="flex items-center gap-3 p-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
                <Skeleton className="aspect-[4/5] w-full" />
                <div className="p-3 space-y-2">
                  <div className="flex gap-3">
                    <Skeleton className="w-6 h-6" />
                    <Skeleton className="w-6 h-6" />
                    <Skeleton className="w-6 h-6" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : outfits.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <Share2 size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có outfit nào</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Hãy là người đầu tiên chia sẻ outfit của bạn!
            </p>
          </div>
        ) : (
          // Feed
          <div className="space-y-0">
            {outfits.map((outfit) => (
              <OutfitFeedCard
                key={outfit.id}
                outfit={outfit}
                userProfile={outfit.user_profile}
                isLiked={outfit.isLiked}
                isSaved={outfit.isSaved}
                onOpenComments={handleOpenComments}
                onShare={handleShare}
                onViewDetail={handleViewOutfitDetail}
                onLikeChange={refresh}
                onSave={saveOutfit}
                onUnsave={unsaveOutfit}
                onHide={hideOutfit}
              />
            ))}
          </div>
        )}
        
        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="py-6 text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Đang tải thêm...</span>
            </div>
          ) : hasMore && outfits.length > 0 ? (
            <p className="text-sm text-muted-foreground">Cuộn để xem thêm</p>
          ) : outfits.length > 0 ? (
            <p className="text-sm text-muted-foreground">Đã hiển thị tất cả</p>
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
