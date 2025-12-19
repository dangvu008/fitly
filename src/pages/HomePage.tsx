import { useState } from 'react';
import { Sparkles, TrendingUp, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { sampleClothing, sampleCollections } from '@/data/sampleClothing';
import { ClothingItem } from '@/types/clothing';

interface HomePageProps {
  onNavigateToTryOn: () => void;
  onSelectItem: (item: ClothingItem) => void;
}

export const HomePage = ({ onNavigateToTryOn, onSelectItem }: HomePageProps) => {
  const [clothing, setClothing] = useState(sampleClothing);

  const toggleFavorite = (item: ClothingItem) => {
    setClothing(prev =>
      prev.map(c =>
        c.id === item.id ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
  };

  const featuredItems = clothing.slice(0, 4);
  const trendingItems = clothing.slice(2, 6);

  return (
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">
      {/* Hero section */}
      <section className="relative rounded-3xl overflow-hidden gradient-primary p-6 shadow-glow animate-slide-up">
        <div className="relative z-10">
          <h2 className="text-xl font-display font-bold text-primary-foreground mb-2">
            Thử đồ ngay tại nhà
          </h2>
          <p className="text-sm text-primary-foreground/80 mb-4">
            Ghép ảnh quần áo với ảnh của bạn để xem trước khi mua
          </p>
          <Button
            onClick={onNavigateToTryOn}
            variant="secondary"
            className="group"
          >
            Bắt đầu thử đồ
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-20">
          <Sparkles size={120} />
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button 
          onClick={onNavigateToTryOn}
          className="bg-card rounded-2xl p-4 shadow-soft border border-border hover:border-primary/50 hover:shadow-medium transition-all duration-300 text-left group"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Phòng thử đồ</h3>
          <p className="text-xs text-muted-foreground mt-1">Thử ngay</p>
        </button>
        
        <button className="bg-card rounded-2xl p-4 shadow-soft border border-border hover:border-accent/50 hover:shadow-medium transition-all duration-300 text-left group">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Heart size={20} className="text-accent-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Bộ sưu tập</h3>
          <p className="text-xs text-muted-foreground mt-1">{sampleCollections.length} bộ</p>
        </button>
      </section>

      {/* Featured items */}
      <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Đề xuất cho bạn
          </h3>
          <Button variant="link" size="sm" className="text-primary">
            Xem thêm
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {featuredItems.map((item) => (
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

      {/* Trending */}
      <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground">
            Xu hướng
          </h3>
          <Button variant="link" size="sm" className="text-primary">
            Xem thêm
          </Button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {trendingItems.map((item) => (
            <div key={item.id} className="flex-shrink-0">
              <ClothingCard
                item={item}
                size="md"
                onSelect={() => onSelectItem(item)}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Collections preview */}
      <section className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground">
            Bộ sưu tập của bạn
          </h3>
          <Button variant="link" size="sm" className="text-primary">
            Xem tất cả
          </Button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {sampleCollections.map((collection) => (
            <div
              key={collection.id}
              className="flex-shrink-0 w-40 bg-card rounded-2xl p-3 shadow-soft border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className="grid grid-cols-2 gap-1 mb-2">
                {collection.items.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="font-medium text-sm text-foreground truncate">{collection.name}</p>
              <p className="text-xs text-muted-foreground">{collection.items.length} món</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
