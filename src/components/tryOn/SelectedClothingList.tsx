import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { X, Sparkles, Filter, Plus, Shirt, Square, Crown, Footprints, Glasses, Upload } from 'lucide-react';
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
  onAddClothingForCategory?: (category: ClothingCategory) => void;
}

type OutfitCategory = 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory';

const outfitSlots: { category: OutfitCategory; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { category: 'top', labelKey: 'slot_top', icon: Shirt },
  { category: 'bottom', labelKey: 'slot_bottom', icon: Square },
  { category: 'dress', labelKey: 'slot_dress', icon: Crown },
  { category: 'shoes', labelKey: 'slot_shoes', icon: Footprints },
  { category: 'accessory', labelKey: 'slot_accessory', icon: Glasses },
];

// Common colors with their display names
const commonColors = [
  { id: 'all', label: 'Tất cả', color: 'bg-gradient-to-r from-primary to-accent' },
  { id: 'white', label: 'Trắng', color: 'bg-white border border-border' },
  { id: 'black', label: 'Đen', color: 'bg-gray-900' },
  { id: 'red', label: 'Đỏ', color: 'bg-red-500' },
  { id: 'blue', label: 'Xanh dương', color: 'bg-blue-500' },
  { id: 'green', label: 'Xanh lá', color: 'bg-green-500' },
  { id: 'yellow', label: 'Vàng', color: 'bg-yellow-400' },
  { id: 'pink', label: 'Hồng', color: 'bg-pink-400' },
  { id: 'purple', label: 'Tím', color: 'bg-purple-500' },
  { id: 'brown', label: 'Nâu', color: 'bg-amber-700' },
  { id: 'gray', label: 'Xám', color: 'bg-gray-400' },
];

// Common styles
const commonStyles = [
  { id: 'all', label: 'Tất cả' },
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'sporty', label: 'Sporty' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'streetwear', label: 'Streetwear' },
];

export const SelectedClothingList = forwardRef<HTMLDivElement, SelectedClothingListProps>(({ 
  items, 
  onRemove,
  savedClothing = [],
  sampleClothing = [],
  onSelectItem,
  onAddClothingForCategory
}, ref) => {
  const { t } = useLanguage();
  
  // Track newly added items for animation
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [isOutfitComplete, setIsOutfitComplete] = useState(false);
  const prevCompleteRef = useRef(false);
  const [expandedCategory, setExpandedCategory] = useState<OutfitCategory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpandedCategory(null);
        setShowFilters(false);
        setSelectedColor('all');
        setSelectedStyle('all');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get clothing items for a specific category with filters
  const getClothingForCategory = (category: OutfitCategory): ClothingItem[] => {
    const allClothing = [...savedClothing, ...sampleClothing];
    let filtered = allClothing.filter(item => item.category === category);
    
    // Apply color filter
    if (selectedColor !== 'all') {
      filtered = filtered.filter(item => {
        const itemColor = item.color?.toLowerCase() || '';
        return itemColor.includes(selectedColor);
      });
    }
    
    // Apply style filter
    if (selectedStyle !== 'all') {
      filtered = filtered.filter(item => {
        const itemStyle = item.style?.toLowerCase() || '';
        return itemStyle.includes(selectedStyle);
      });
    }
    
    return filtered;
  };

  const handleSlotClick = (category: OutfitCategory) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      setShowFilters(false);
      setSelectedColor('all');
      setSelectedStyle('all');
    } else {
      setExpandedCategory(category);
      setSelectedColor('all');
      setSelectedStyle('all');
    }
  };

  const handleSelectFromDropdown = (item: ClothingItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
    setExpandedCategory(null);
    setShowFilters(false);
    setSelectedColor('all');
    setSelectedStyle('all');
  };

  const handleUploadForCategory = (category: OutfitCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddClothingForCategory) {
      onAddClothingForCategory(category);
    }
    setExpandedCategory(null);
  };

  const activeFiltersCount = (selectedColor !== 'all' ? 1 : 0) + (selectedStyle !== 'all' ? 1 : 0);

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
      {/* Horizontal scrollable outfit slots */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4" ref={dropdownRef}>
        <div className="flex gap-2 min-w-max py-1">
          {/* Category slots */}
          {outfitSlots.map((slot) => {
            const item = itemsByCategory[slot.category];
            const isAnimating = item && animatingItems.has(item.id);
            const isRemoving = item && removingItems.has(item.id);
            const isExpanded = expandedCategory === slot.category;
            const categoryClothing = getClothingForCategory(slot.category);
            const IconComponent = slot.icon;
            
            return (
              <div key={slot.category} className="flex flex-col items-center gap-1 relative">
                {/* Slot container */}
                <div
                  className={cn(
                    "relative w-[72px] h-[72px] rounded-xl overflow-hidden transition-all duration-300",
                    item 
                      ? "ring-2 ring-primary shadow-glow" 
                      : "border-2 border-dashed border-border bg-card",
                    isAnimating && "animate-scale-in",
                    isRemoving && "animate-scale-out opacity-0",
                    isExpanded && "ring-2 ring-primary"
                  )}
                >
                  {item ? (
                    <div className={cn(
                      "w-full h-full relative group",
                      isAnimating && "animate-scale-in"
                    )}>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handleSlotClick(slot.category)}
                      />
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.id);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150 z-10 shadow-sm"
                      >
                        <X size={12} />
                      </button>
                      {/* Change button overlay */}
                      <div 
                        className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => handleSlotClick(slot.category)}
                      >
                        <span className="text-[10px] font-medium text-background">Đổi</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() => handleSlotClick(slot.category)}
                    >
                      <IconComponent size={22} className="text-muted-foreground/60 mb-1" strokeWidth={1.5} />
                      <Plus size={14} className="text-primary" />
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  item ? "text-primary" : "text-muted-foreground"
                )}>
                  {t(slot.labelKey)}
                </span>

                {/* Dropdown panel */}
                {isExpanded && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 bg-card border border-border rounded-xl shadow-medium overflow-hidden animate-scale-in">
                    {/* Header with upload button */}
                    <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
                      <p className="text-sm font-semibold text-foreground">{t(slot.labelKey)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleUploadForCategory(slot.category, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Upload size={12} />
                          Upload
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFilters(!showFilters);
                          }}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            showFilters || activeFiltersCount > 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          <Filter size={12} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Filters panel */}
                    {showFilters && (
                      <div className="p-3 border-b border-border space-y-3 bg-muted/20">
                        {/* Color filter */}
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-2">Màu sắc</p>
                          <div className="flex flex-wrap gap-1.5">
                            {commonColors.slice(0, 8).map((color) => (
                              <button
                                key={color.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedColor(color.id);
                                }}
                                className={cn(
                                  "w-6 h-6 rounded-full transition-all",
                                  color.color,
                                  selectedColor === color.id 
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110" 
                                    : "hover:scale-110"
                                )}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Style filter */}
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-2">Phong cách</p>
                          <div className="flex flex-wrap gap-1.5">
                            {commonStyles.map((style) => (
                              <button
                                key={style.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStyle(style.id);
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
                                  selectedStyle === style.id 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Clear filters */}
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColor('all');
                              setSelectedStyle('all');
                            }}
                            className="w-full text-xs text-destructive hover:underline"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Clothing grid */}
                    <div className="max-h-52 overflow-y-auto p-3">
                      {categoryClothing.length === 0 ? (
                        <div className="text-center py-6">
                          <IconComponent size={32} className="text-muted-foreground/40 mx-auto mb-2" strokeWidth={1} />
                          <p className="text-xs text-muted-foreground mb-3">
                            {activeFiltersCount > 0 
                              ? 'Không tìm thấy phù hợp' 
                              : `Chưa có ${t(slot.labelKey).toLowerCase()}`}
                          </p>
                          <button
                            onClick={(e) => handleUploadForCategory(slot.category, e)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors mx-auto"
                          >
                            <Upload size={14} />
                            Upload {t(slot.labelKey)}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {categoryClothing.map((clothingItem) => (
                            <button
                              key={clothingItem.id}
                              onClick={() => handleSelectFromDropdown(clothingItem)}
                              className={cn(
                                "aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 relative group",
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
                              {/* Color/style indicator */}
                              {(clothingItem.color || clothingItem.style) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-[8px] text-background truncate text-center">
                                    {clothingItem.color || clothingItem.style}
                                  </p>
                                </div>
                              )}
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
      </div>

      {/* Selected count indicator */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-center gap-2 py-1">
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
      )}
    </div>
  );
});

SelectedClothingList.displayName = 'SelectedClothingList';
