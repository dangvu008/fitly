import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useLanguage } from '@/contexts/LanguageContext';

interface SuggestedClothingSectionProps {
  onSelectItem: (item: ClothingItem) => void;
}

// Sample clothing data with shop links
const sampleClothingData: ClothingItem[] = [
  {
    id: 'sample-1',
    name: 'Áo sơ mi trắng basic',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300',
    category: 'top',
    price: '350.000đ',
    shopUrl: 'https://shopee.vn',
    shopName: 'Shopee'
  },
  {
    id: 'sample-2',
    name: 'Quần jean skinny xanh',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300',
    category: 'bottom',
    price: '450.000đ',
    shopUrl: 'https://lazada.vn',
    shopName: 'Lazada'
  },
  {
    id: 'sample-3',
    name: 'Váy midi hoa nhí',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300',
    category: 'dress',
    price: '520.000đ',
    shopUrl: 'https://tiki.vn',
    shopName: 'Tiki'
  },
  {
    id: 'sample-4',
    name: 'Giày sneaker trắng',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300',
    category: 'shoes',
    price: '890.000đ',
    shopUrl: 'https://shopee.vn',
    shopName: 'Shopee'
  },
  {
    id: 'sample-5',
    name: 'Túi xách da nâu',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300',
    category: 'accessory',
    price: '650.000đ',
    shopUrl: 'https://lazada.vn',
    shopName: 'Lazada'
  },
  {
    id: 'sample-6',
    name: 'Kính râm thời trang',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300',
    category: 'accessory',
    price: '280.000đ',
    shopUrl: 'https://tiki.vn',
    shopName: 'Tiki'
  },
  {
    id: 'sample-7',
    name: 'Áo hoodie đen',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300',
    category: 'top',
    price: '420.000đ',
    shopUrl: 'https://shopee.vn',
    shopName: 'Shopee'
  },
  {
    id: 'sample-8',
    name: 'Mũ bucket trắng',
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300',
    category: 'accessory',
    price: '180.000đ',
    shopUrl: 'https://lazada.vn',
    shopName: 'Lazada'
  }
];

export const SuggestedClothingSection = ({
  onSelectItem,
}: SuggestedClothingSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const [clothing, setClothing] = useState<ClothingItem[]>(sampleClothingData);
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
            shopName?: string;
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
                shopName: item.shopName,
              });
            }
          });
        });

        // Combine fetched items with sample data for fuller display
        const combinedItems = [...allItems.slice(0, 10), ...sampleClothingData];
        const uniqueItems = combinedItems.filter((item, index, self) => 
          index === self.findIndex(t => t.imageUrl === item.imageUrl)
        );
        
        setClothing(uniqueItems.slice(0, 15));
      } catch (error) {
        console.error('Error fetching suggested clothing:', error);
        // Fall back to sample data
        setClothing(sampleClothingData);
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
        <div className="flex items-center gap-2 px-4 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t('suggestions_for_you')}</h2>
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
      <div className="flex items-center gap-2 px-4 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('suggestions_for_you')}</h2>
        <span className="text-[10px] text-primary ml-auto hover:underline cursor-pointer">
          {t('view_more')}
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
        className="flex gap-2 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {clothing.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-24 rounded-lg overflow-hidden bg-card border border-border shadow-soft hover:shadow-medium transition-all group/item"
          >
            <button
              onClick={() => onSelectItem(item)}
              className="w-full"
            >
              <div className="relative aspect-square">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain bg-muted"
                />
                <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <div className="p-1 bg-card/80 backdrop-blur-sm rounded-full">
                    <Heart className="w-2.5 h-2.5 text-foreground" />
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <p className="text-[9px] font-medium text-foreground line-clamp-2 text-left leading-tight">
                  {item.name}
                </p>
                {item.price && (
                  <p className="text-[9px] text-primary font-semibold mt-0.5 text-left">
                    {item.price}
                  </p>
                )}
              </div>
            </button>
            {item.shopUrl && (
              <a
                href={item.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-1 px-1.5 bg-primary/10 hover:bg-primary/20 transition-colors text-[8px] text-primary font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-2 h-2" />
                {item.shopName || t('buy_now')}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
