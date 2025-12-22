import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { X, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, forwardRef } from 'react';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

interface SelectedClothingListProps {
  items: ClothingItem[];
  onRemove: (id: string) => void;
  savedClothing?: ClothingItem[];
  sampleClothing?: ClothingItem[];
  onSelectItem?: (item: ClothingItem) => void;
}

type OutfitCategory = 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory';

const outfitSlots: { category: OutfitCategory; labelKey: TranslationKey; icon: string }[] = [
  { category: 'top', labelKey: 'slot_top', icon: '👕' },
  { category: 'bottom', labelKey: 'slot_bottom', icon: '👖' },
  { category: 'dress', labelKey: 'slot_dress', icon: '👗' },
  { category: 'shoes', labelKey: 'slot_shoes', icon: '👟' },
  { category: 'accessory', labelKey: 'slot_accessory', icon: '👜' },
];

export const SelectedClothingList = forwardRef<HTMLDivElement, SelectedClothingListProps>(({ 
  items, 
  onRemove,
  savedClothing = [],
  sampleClothing = [],
  onSelectItem
}, ref) => {
  const { t } = useLanguage();
  
  // Track newly added items for animation
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [isOutfitComplete, setIsOutfitComplete] = useState(false);
  const prevCompleteRef = useRef(false);
  const [expandedCategory, setExpandedCategory] = useState<OutfitCategory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpandedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get clothing items for a specific category
  const getClothingForCategory = (category: OutfitCategory): ClothingItem[] => {
    const allClothing = [...savedClothing, ...sampleClothing];
    return allClothing.filter(item => item.category === category);
  };

  const handleSlotClick = (category: OutfitCategory) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  const handleSelectFromDropdown = (item: ClothingItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
    setExpandedCategory(null);
  };

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (item.category !== 'all') {
      acc[item.category as OutfitCategory] = item;
    }
    return acc;
  }, {} as Record<OutfitCategory, ClothingItem | undefined>);

  const selectedCount = Object.values(itemsByCategory).filter(Boolean).length;
  
  // Check if outfit is complete: (top + bottom) OR dress, plus shoes
  const hasTop = !!itemsByCategory.top;
  const hasBottom = !!itemsByCategory.bottom;
  const hasDress = !!itemsByCategory.dress;
  const hasShoes = !!itemsByCategory.shoes;
  const outfitComplete = ((hasTop && hasBottom) || hasDress) && hasShoes;

  // Trigger confetti when outfit becomes complete
  useEffect(() => {
    if (outfitComplete && !prevCompleteRef.current) {
      setIsOutfitComplete(true);
      
      // Fire confetti!
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#ff6b9d', '#c44569', '#f8b500', '#7ed6df', '#686de0']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#ff6b9d', '#c44569', '#f8b500', '#7ed6df', '#686de0']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Reset after animation
      setTimeout(() => setIsOutfitComplete(false), 3000);
    }
    prevCompleteRef.current = outfitComplete;
  }, [outfitComplete]);

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
    <div ref={ref} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">
          {t('outfit_selected')}
        </p>
        <div className="flex items-center gap-1.5">
          {isOutfitComplete && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary animate-scale-in">
              <Sparkles size={12} className="animate-pulse" />
              {t('outfit_complete')}
            </span>
          )}
          <span className={cn(
            "text-xs font-bold transition-all duration-300",
            selectedCount > 0 ? "text-primary" : "text-muted-foreground",
            isOutfitComplete && "scale-110"
          )}>
            {selectedCount}/{outfitSlots.length}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-2 relative" ref={dropdownRef}>
        {outfitSlots.map((slot) => {
          const item = itemsByCategory[slot.category];
          const isAnimating = item && animatingItems.has(item.id);
          const isRemoving = item && removingItems.has(item.id);
          const isExpanded = expandedCategory === slot.category;
          const categoryClothing = getClothingForCategory(slot.category);
          
          return (
            <div key={slot.category} className="flex flex-col items-center gap-1 relative">
              {/* Slot container */}
              <button
                type="button"
                onClick={() => handleSlotClick(slot.category)}
                className={cn(
                  "relative w-full aspect-square rounded-xl overflow-hidden transition-all duration-300 cursor-pointer",
                  item 
                    ? "ring-2 ring-primary shadow-glow" 
                    : "border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
                  isAnimating && "animate-scale-in",
                  isRemoving && "animate-scale-out opacity-0",
                  isExpanded && "ring-2 ring-primary"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-125 active:scale-95 transition-transform duration-150 z-10"
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
                  <div className="w-full h-full flex flex-col items-center justify-center text-xl opacity-40 transition-all duration-200 hover:opacity-60 hover:scale-110">
                    {slot.icon}
                    <ChevronDown size={10} className="mt-0.5" />
                  </div>
                )}
              </button>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium transition-colors duration-200",
                item ? "text-primary" : "text-muted-foreground"
              )}>
                {t(slot.labelKey)}
              </span>

              {/* Dropdown panel */}
              {isExpanded && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-48 max-h-56 bg-card border border-border rounded-xl shadow-medium overflow-hidden animate-scale-in">
                  <div className="p-2 border-b border-border">
                    <p className="text-xs font-medium text-foreground text-center">{t(slot.labelKey)}</p>
                  </div>
                  <div className="max-h-44 overflow-y-auto p-2">
                    {categoryClothing.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {t('no_saved_clothing')}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {categoryClothing.map((clothingItem) => (
                          <button
                            key={clothingItem.id}
                            onClick={() => handleSelectFromDropdown(clothingItem)}
                            className={cn(
                              "aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                              items.some(i => i.id === clothingItem.id) 
                                ? "border-primary ring-1 ring-primary" 
                                : "border-transparent hover:border-primary/50"
                            )}
                          >
                            <img 
                              src={clothingItem.imageUrl} 
                              alt={clothingItem.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedCount === 0 && (
        <p className="text-center text-xs text-muted-foreground py-2 animate-fade-in">
          {t('outfit_hint')}
        </p>
      )}
    </div>
  );
});

SelectedClothingList.displayName = 'SelectedClothingList';
