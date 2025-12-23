import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClothingItem } from '@/types/clothing';
import { useOutfitFeed } from '@/hooks/useOutfitFeed';
import { useLanguage } from '@/contexts/LanguageContext';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { TrendingOutfitsSection } from '@/components/home/TrendingOutfitsSection';
import { TryOnHistorySection } from '@/components/home/TryOnHistorySection';
import { SuggestedClothingSection } from '@/components/home/SuggestedClothingSection';
import { FeedSection } from '@/components/home/FeedSection';
import { toast } from 'sonner';

interface HomePageProps {
  onNavigateToTryOn: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToHistory?: () => void;
  onSelectItem: (item: ClothingItem) => void;
}

export const HomePage = ({ onNavigateToTryOn, onNavigateToHistory, onSelectItem }: HomePageProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  // Get top trending outfits (sorted by likes)
  const trendingOutfits = [...outfits]
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 10);

  return (
    <div className="pb-24 pt-16 max-w-lg mx-auto">
      <div className="animate-fade-in space-y-6">
        {/* Trending Outfits Section */}
        <TrendingOutfitsSection
          outfits={trendingOutfits}
          isLoading={isLoading}
          onViewOutfit={handleViewOutfitDetail}
        />

        {/* Try-On History Section */}
        <TryOnHistorySection
          onNavigateToTryOn={onNavigateToTryOn}
          onNavigateToHistory={onNavigateToHistory}
        />

        {/* Suggested Clothing Section */}
        <SuggestedClothingSection onSelectItem={onSelectItem} />

        {/* Community Feed Section */}
        <FeedSection
          outfits={outfits}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onOpenComments={handleOpenComments}
          onShare={handleShare}
          onViewOutfit={handleViewOutfitDetail}
          onRefresh={refresh}
          onSave={saveOutfit}
          onUnsave={unsaveOutfit}
          onHide={hideOutfit}
          loadMoreRef={loadMoreRef}
        />
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
