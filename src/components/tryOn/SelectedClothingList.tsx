import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SelectedClothingListProps {
  items: ClothingItem[];
  onRemove: (id: string) => void;
}

type OutfitCategory = 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory';

const outfitSlots: { category: OutfitCategory; label: string; icon: string }[] = [
  { category: 'top', label: 'Áo', icon: '👕' },
  { category: 'bottom', label: 'Quần', icon: '👖' },
  { category: 'dress', label: 'Đầm', icon: '👗' },
  { category: 'shoes', label: 'Giày', icon: '👟' },
  { category: 'accessory', label: 'Phụ kiện', icon: '👜' },
];

export const SelectedClothingList = ({ items, onRemove }: SelectedClothingListProps) => {
  // Track newly added items for animation
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (item.category !== 'all') {
      acc[item.category as OutfitCategory] = item;
    }
    return acc;
  }, {} as Record<OutfitCategory, ClothingItem | undefined>);

  const selectedCount = Object.values(itemsByCategory).filter(Boolean).length;

  // Trigger animation when new item is added
  useEffect(() => {
    const currentIds = new Set(items.map(i => i.id));
    const newItems = items.filter(item => !animatingItems.has(item.id));
    
    if (newItems.length > 0) {
      const newIds = new Set(newItems.map(i => i.id));
      setAnimatingItems(prev => new Set([...prev, ...newIds]));
      
      // Remove from animating set after animation completes
      setTimeout(() => {
        setAnimatingItems(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.delete(id));
          return next;
        });
      }, 400);
    }
  }, [items]);

  const handleRemove = (id: string) => {
    setRemovingItems(prev => new Set([...prev, id]));
    setTimeout(() => {
      onRemove(id);
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">
          Outfit đã chọn
        </p>
        <span className={cn(
          "text-xs font-bold transition-all duration-300",
          selectedCount > 0 ? "text-primary scale-110" : "text-muted-foreground"
        )}>
          {selectedCount}/{outfitSlots.length} items
        </span>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {outfitSlots.map((slot) => {
          const item = itemsByCategory[slot.category];
          const isAnimating = item && animatingItems.has(item.id);
          const isRemoving = item && removingItems.has(item.id);
          
          return (
            <div key={slot.category} className="flex flex-col items-center gap-1">
              {/* Slot container */}
              <div
                className={cn(
                  "relative w-full aspect-square rounded-xl overflow-hidden transition-all duration-300",
                  item 
                    ? "ring-2 ring-primary shadow-glow" 
                    : "border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
                  isAnimating && "animate-scale-in",
                  isRemoving && "animate-scale-out opacity-0"
                )}
              >
                {item ? (
                  <div className={cn(
                    "w-full h-full",
                    isAnimating && "animate-scale-in"
                  )}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-125 active:scale-95 transition-transform duration-150"
                    >
                      <X size={10} />
                    </button>
                    {/* Overlay with name */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-1">
                      <p className="text-[8px] text-background truncate font-medium text-center">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl opacity-40 transition-all duration-200 hover:opacity-60 hover:scale-110">
                    {slot.icon}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium transition-colors duration-200",
                item ? "text-primary" : "text-muted-foreground"
              )}>
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>

      {selectedCount === 0 && (
        <p className="text-center text-xs text-muted-foreground py-2 animate-fade-in">
          Chọn quần áo để tạo outfit thử đồ với AI
        </p>
      )}
    </div>
  );
};
