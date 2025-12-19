import { useState } from 'react';
import { Sparkles, RefreshCw, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';

interface SuggestPageProps {
  onSelectItem: (item: ClothingItem) => void;
}

export const SuggestPage = ({ onSelectItem }: SuggestPageProps) => {
  const [clothing, setClothing] = useState(sampleClothing);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleFavorite = (item: ClothingItem) => {
    setClothing(prev =>
      prev.map(c =>
        c.id === item.id ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
    toast.success(item.isFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setClothing(prev => [...prev].sort(() => Math.random() - 0.5));
      setIsRefreshing(false);
      toast.success('Đã cập nhật gợi ý mới!');
    }, 500);
  };

  // Create outfit suggestions by grouping items
  const outfitSuggestions = [
    {
      id: '1',
      title: 'Outfit đi làm thanh lịch',
      description: 'Phong cách công sở chuyên nghiệp',
      items: clothing.filter(c => ['top', 'bottom'].includes(c.category)).slice(0, 2),
    },
    {
      id: '2',
      title: 'Cuối tuần năng động',
      description: 'Thoải mái cho ngày nghỉ',
      items: clothing.filter(c => ['top', 'shoes'].includes(c.category)).slice(0, 2),
    },
    {
      id: '3',
      title: 'Dạo phố chill',
      description: 'Phong cách street style',
      items: clothing.filter(c => ['dress', 'accessory'].includes(c.category)).slice(0, 2),
    },
  ];

  return (
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">
      {/* Header section */}
      <section className="text-center animate-slide-up">
        <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-4 shadow-glow">
          <Sparkles size={32} className="text-primary-foreground" />
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">
          Gợi ý cho bạn
        </h2>
        <p className="text-muted-foreground text-sm">
          Phối đồ phù hợp với phong cách của bạn
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="mt-4"
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Làm mới gợi ý
        </Button>
      </section>

      {/* Outfit suggestions */}
      <section className="space-y-4">
        {outfitSuggestions.map((outfit, index) => (
          <div
            key={outfit.id}
            className="bg-card rounded-2xl p-4 shadow-soft border border-border hover:border-primary/50 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{outfit.title}</h3>
                <p className="text-xs text-muted-foreground">{outfit.description}</p>
              </div>
              <Button variant="ghost" size="iconSm">
                <Heart size={16} />
              </Button>
            </div>

            <div className="flex gap-3 mb-4">
              {outfit.items.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  size="md"
                  onSelect={() => onSelectItem(item)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (outfit.items[0]) onSelectItem(outfit.items[0]);
                }}
              >
                Thử ngay
              </Button>
              <Button variant="outline" size="sm">
                <ShoppingBag size={14} />
                Mua sắm
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* More suggestions grid */}
      <section className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="font-display font-bold text-lg text-foreground mb-4">
          Có thể bạn thích
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {clothing.slice(0, 4).map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              size="lg"
              onSelect={() => onSelectItem(item)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
