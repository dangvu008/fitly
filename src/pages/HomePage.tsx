import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { SkeletonGrid } from '@/components/ui/skeleton-grid';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem } from '@/types/clothing';
import { useSharedOutfits } from '@/hooks/useSharedOutfits';

interface HomePageProps {
  onNavigateToTryOn: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToHistory?: () => void;
  onSelectItem: (item: ClothingItem) => void;
}

export const HomePage = ({ onNavigateToTryOn, onSelectItem }: HomePageProps) => {
  const navigate = useNavigate();
  const [clothing] = useState(sampleClothing);
  const { sharedOutfits, isLoading: loadingSharedOutfits, isLoadingMore, hasMore, loadMore } = useSharedOutfits();
  
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

  return (
    <div className="pb-24 pt-16 max-w-lg mx-auto">
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
            {clothing.slice(0, Math.max(0, 12 - sharedOutfits.length)).map((item, index) => (
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
        
        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="py-6 text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Đang tải thêm...</span>
            </div>
          ) : hasMore ? (
            <p className="text-sm text-muted-foreground">Cuộn để xem thêm</p>
          ) : sharedOutfits.length > 0 ? (
            <p className="text-sm text-muted-foreground">Đã hiển thị tất cả</p>
          ) : null}
        </div>
      </section>
    </div>
  );
};
