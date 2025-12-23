import { useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

interface TrendingOutfit {
  id: string;
  title: string;
  result_image_url: string;
  likes_count: number;
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface TrendingOutfitsSectionProps {
  outfits: TrendingOutfit[];
  isLoading: boolean;
  onViewOutfit: (id: string) => void;
}

export const TrendingOutfitsSection = ({
  outfits,
  isLoading,
  onViewOutfit,
}: TrendingOutfitsSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="flex items-center gap-2 px-4 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t('trending_outfits')}</h2>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-44 h-56 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (outfits.length === 0) return null;

  return (
    <section className="py-4 relative group">
      <div className="flex items-center gap-2 px-4 mb-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('trending_outfits')}</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {outfits.length} {t('outfits_loved')}
        </span>
      </div>
      
      {/* Scroll buttons */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute left-1 top-1/2 translate-y-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-1 top-1/2 translate-y-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <div 
        ref={scrollRef}
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {outfits.map((outfit) => (
          <button
            key={outfit.id}
            onClick={() => onViewOutfit(outfit.id)}
            className="flex-shrink-0 w-44 rounded-xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative aspect-[3/4]">
              <img
                src={outfit.result_image_url}
                alt={outfit.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-xs font-medium text-foreground line-clamp-1">
                  {outfit.title}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    ❤️ {outfit.likes_count}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    • {outfit.user_profile?.display_name || t('user')}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
