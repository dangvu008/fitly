import { Loader2, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OutfitFeedCard } from '@/components/feed/OutfitFeedCard';
import { useLanguage } from '@/contexts/LanguageContext';

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
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

interface FeedSectionProps {
  outfits: SharedOutfit[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onOpenComments: (outfitId: string) => void;
  onShare: (outfitId: string) => void;
  onViewOutfit: (outfitId: string) => void;
  onRefresh: () => void;
  onSave: (outfitId: string) => Promise<boolean>;
  onUnsave: (outfitId: string) => Promise<boolean>;
  onHide: (outfitId: string) => Promise<boolean>;
  loadMoreRef: React.RefObject<HTMLDivElement>;
}

export const FeedSection = ({
  outfits,
  isLoading,
  isLoadingMore,
  hasMore,
  onOpenComments,
  onShare,
  onViewOutfit,
  onRefresh,
  onSave,
  onUnsave,
  onHide,
  loadMoreRef,
}: FeedSectionProps) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-4 px-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          {t('community_share')}
        </h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
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
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="px-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-primary" />
          {t('community_share')}
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center bg-card border border-border rounded-xl">
          <Share2 size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('no_outfit_yet')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('be_first_to_share')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-primary" />
        {t('community_share')}
      </h2>
      <div className="space-y-4">
        {outfits.map((outfit) => (
          <div key={outfit.id} className="rounded-xl overflow-hidden border border-border">
            <OutfitFeedCard
              outfit={outfit}
              userProfile={outfit.user_profile}
              isLiked={outfit.isLiked}
              isSaved={outfit.isSaved}
              onOpenComments={onOpenComments}
              onShare={onShare}
              onViewDetail={onViewOutfit}
              onLikeChange={onRefresh}
              onSave={onSave}
              onUnsave={onUnsave}
              onHide={onHide}
            />
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger */}
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
  );
};
