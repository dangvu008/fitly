import { useState, useRef } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, Scale, Trash2, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare, SavedOutfit } from '@/contexts/CompareContext';
import { sampleClothing } from '@/data/sampleClothing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Sample saved outfits for demo
const sampleOutfits: SavedOutfit[] = [
  {
    id: '1',
    name: 'Outfit công sở',
    items: [sampleClothing[0], sampleClothing[3]],
    resultImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Cuối tuần chill',
    items: [sampleClothing[4], sampleClothing[5]],
    resultImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Dạo phố',
    items: [sampleClothing[2], sampleClothing[3]],
    resultImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Date night',
    items: [sampleClothing[1], sampleClothing[6]],
    resultImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    createdAt: new Date(),
  },
];

export const ComparePage = () => {
  const { outfitsToCompare, addToCompare, removeFromCompare, clearCompare, isInCompare } = useCompare();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const handleAddOutfit = (outfit: SavedOutfit) => {
    if (outfitsToCompare.length >= 4) {
      toast.error('Chỉ có thể so sánh tối đa 4 outfit');
      return;
    }
    addToCompare(outfit);
    toast.success(`Đã thêm "${outfit.name}" vào so sánh`);
  };

  const handleRemoveOutfit = (outfitId: string) => {
    removeFromCompare(outfitId);
    toast.success('Đã xóa khỏi so sánh');
  };

  const handleShare = () => {
    toast.success('Đã sao chép link so sánh!');
  };

  return (
    <div className="pb-24 pt-16 px-4 max-w-md mx-auto">
      {/* Header */}
      <section className="text-center mb-6 animate-slide-up">
        <div className="w-14 h-14 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-3 shadow-glow">
          <Scale size={28} className="text-primary-foreground" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-1">
          So sánh Outfit
        </h2>
        <p className="text-muted-foreground text-sm">
          {outfitsToCompare.length}/4 outfit đang so sánh
        </p>
      </section>

      {/* Comparison area */}
      {outfitsToCompare.length === 0 ? (
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
            <Scale size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium mb-2">
              Chưa có outfit nào để so sánh
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Thêm các outfit đã lưu để so sánh cạnh nhau
            </p>
            <Button onClick={() => setShowAddSheet(true)}>
              <Plus size={18} />
              Thêm outfit
            </Button>
          </div>
        </section>
      ) : (
        <>
          {/* Comparison cards with scroll */}
          <section className="relative mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Scroll buttons */}
            {outfitsToCompare.length > 2 && (
              <>
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-soft flex items-center justify-center hover:bg-card transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-soft flex items-center justify-center hover:bg-card transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Scrollable container */}
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-hide"
            >
              {outfitsToCompare.map((outfit, index) => (
                <div
                  key={outfit.id}
                  className={cn(
                    "flex-shrink-0 snap-center bg-card rounded-2xl shadow-soft border border-border overflow-hidden animate-scale-in",
                    outfitsToCompare.length === 1 && "w-full",
                    outfitsToCompare.length === 2 && "w-[calc(50%-6px)]",
                    outfitsToCompare.length >= 3 && "w-[140px]"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Outfit image */}
                  <div className="relative aspect-[3/4]">
                    {outfit.resultImageUrl ? (
                      <img
                        src={outfit.resultImageUrl}
                        alt={outfit.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">No image</span>
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleRemoveOutfit(outfit.id)}
                      className="absolute top-2 right-2 bg-card/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X size={14} />
                    </Button>

                    {/* Index badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>

                  {/* Outfit info */}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-foreground truncate mb-1">
                      {outfit.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {outfit.items.length} món đồ
                    </p>
                    
                    {/* Clothing items mini preview */}
                    <div className="flex gap-1">
                      {outfit.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {outfit.items.length > 3 && (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{outfit.items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Price info */}
                    {outfit.items.some(i => i.price) && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Tổng giá:</p>
                        <p className="text-sm font-bold text-primary">
                          {outfit.items
                            .filter(i => i.price)
                            .map(i => parseInt(i.price?.replace(/\D/g, '') || '0'))
                            .reduce((a, b) => a + b, 0)
                            .toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add more button */}
              {outfitsToCompare.length < 4 && (
                <button
                  onClick={() => setShowAddSheet(true)}
                  className={cn(
                    "flex-shrink-0 snap-center rounded-2xl border-2 border-dashed border-primary/50 flex flex-col items-center justify-center text-primary hover:bg-primary/5 transition-colors",
                    outfitsToCompare.length === 1 && "w-[calc(50%-6px)] aspect-[3/4]",
                    outfitsToCompare.length === 2 && "w-[calc(50%-6px)] aspect-[3/4]",
                    outfitsToCompare.length >= 3 && "w-[140px] aspect-[3/4]"
                  )}
                >
                  <Plus size={24} />
                  <span className="text-xs mt-1">Thêm</span>
                </button>
              )}
            </div>
          </section>

          {/* Actions */}
          <section className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCompare}
              >
                <Trash2 size={16} />
                Xóa tất cả
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 size={16} />
                Chia sẻ
              </Button>
            </div>
          </section>
        </>
      )}

      {/* Add outfit sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm animate-scale-in">
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[70vh] overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Chọn outfit để so sánh</h3>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setShowAddSheet(false)}
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)] space-y-3">
              {sampleOutfits.map((outfit) => {
                const isAdded = isInCompare(outfit.id);
                return (
                  <button
                    key={outfit.id}
                    onClick={() => {
                      if (!isAdded) {
                        handleAddOutfit(outfit);
                      }
                    }}
                    disabled={isAdded}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-xl border transition-all duration-300",
                      isAdded
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:border-primary/50"
                    )}
                  >
                    {/* Outfit preview */}
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {outfit.resultImageUrl ? (
                        <img
                          src={outfit.resultImageUrl}
                          alt={outfit.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-foreground">{outfit.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {outfit.items.length} món đồ
                      </p>
                      {outfit.items.some(i => i.price) && (
                        <p className="text-sm font-medium text-primary mt-1">
                          {outfit.items
                            .filter(i => i.price)
                            .map(i => parseInt(i.price?.replace(/\D/g, '') || '0'))
                            .reduce((a, b) => a + b, 0)
                            .toLocaleString('vi-VN')}đ
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {isAdded ? (
                        <span className="text-xs text-primary font-medium">Đã thêm</span>
                      ) : (
                        <Plus size={20} className="text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
