import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { cn } from '@/lib/utils';

interface SuggestedClothingSectionProps {
  onSelectItem: (item: ClothingItem) => void;
}

export const SuggestedClothingSection = ({
  onSelectItem,
}: SuggestedClothingSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clothing, setClothing] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopularClothing = async () => {
      try {
        // Fetch some clothing items from shared outfits
        const { data: outfits, error } = await supabase
          .from('shared_outfits')
          .select('clothing_items')
          .order('likes_count', { ascending: false })
          .limit(20);

        if (error) throw error;

        // Extract unique clothing items
        const allItems: ClothingItem[] = [];
        const seenUrls = new Set<string>();

        outfits?.forEach((outfit) => {
          const items = (outfit.clothing_items as unknown as Array<{
            name: string;
            imageUrl: string;
            shopUrl?: string;
            price?: string;
            category?: string;
          }>) || [];
          
          items.forEach((item, index) => {
            if (!seenUrls.has(item.imageUrl)) {
              seenUrls.add(item.imageUrl);
              allItems.push({
                id: `${outfit}-${index}-${item.imageUrl}`,
                name: item.name,
                imageUrl: item.imageUrl,
                category: (item.category as ClothingCategory) || 'top',
                shopUrl: item.shopUrl,
                price: item.price,
              });
            }
          });
        });

        setClothing(allItems.slice(0, 15));
      } catch (error) {
        console.error('Error fetching suggested clothing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularClothing();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 160;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="flex items-center gap-2 px-4 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Gợi ý cho bạn</h2>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-28 h-36 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (clothing.length === 0) return null;

  return (
    <section className="py-4 relative group">
      <div className="flex items-center gap-2 px-4 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Gợi ý cho bạn</h2>
        <span className="text-xs text-muted-foreground ml-auto">
          Từ các outfit phổ biến
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
        {clothing.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="flex-shrink-0 w-28 rounded-xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-medium transition-all hover:scale-[1.02] active:scale-[0.98] group/item"
          >
            <div className="relative aspect-square">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-contain bg-muted"
              />
              <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <div className="p-1.5 bg-card/80 backdrop-blur-sm rounded-full">
                  <Heart className="w-3 h-3 text-foreground" />
                </div>
              </div>
            </div>
            <div className="p-2">
              <p className="text-[10px] font-medium text-foreground line-clamp-2 text-left">
                {item.name}
              </p>
              {item.price && (
                <p className="text-[10px] text-primary font-semibold mt-0.5 text-left">
                  {item.price}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
