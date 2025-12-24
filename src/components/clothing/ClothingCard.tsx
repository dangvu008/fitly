import { Heart, ExternalLink, EyeOff } from 'lucide-react';
import { ClothingItem } from '@/types/clothing';
import { Button } from '@/components/ui/button';
import { ClothingItemActions } from './ClothingItemActions';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface ClothingCardProps {
  item: ClothingItem;
  onSelect?: (item: ClothingItem) => void;
  onToggleFavorite?: (id: string) => Promise<boolean>;
  onToggleHidden?: (id: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onEdit?: (item: ClothingItem) => void;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
  showActions?: boolean;
}

export const ClothingCard = forwardRef<HTMLDivElement, ClothingCardProps>(({ 
  item, 
  onSelect, 
  onToggleFavorite,
  onToggleHidden,
  onDelete,
  onEdit,
  size = 'md',
  isSelected = false,
  showActions = false,
}, ref) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-full aspect-square max-w-[160px]',
  };

  return (
    <div 
      ref={ref}
      className={cn(
        "relative group animate-scale-in",
        size === 'lg' && "w-full"
      )}
    >
      <button
        onClick={() => onSelect?.(item)}
        className={cn(
          "relative rounded-2xl overflow-hidden bg-card border shadow-soft transition-all duration-300 hover:shadow-medium hover:scale-105",
          sizeClasses[size],
          isSelected 
            ? "border-primary ring-2 ring-primary shadow-glow" 
            : "border-border hover:border-primary/50",
          item.isHidden && "opacity-50"
        )}
      >
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Hidden indicator */}
        {item.isHidden && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <EyeOff size={20} className="text-white" />
          </div>
        )}
        
        {/* Favorite indicator */}
        {item.isFavorite && (
          <div className="absolute top-1 left-1">
            <Heart size={14} className="fill-red-500 text-red-500" />
          </div>
        )}
      </button>
      
      {/* Actions menu */}
      {showActions && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ClothingItemActions
            item={item}
            onToggleFavorite={onToggleFavorite}
            onToggleHidden={onToggleHidden}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      )}
      
      {/* Item info for large size */}
      {size === 'lg' && (
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">{item.price}</span>
            {item.shopUrl && (
              <a 
                href={item.shopUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {item.shopName}
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ClothingCard.displayName = 'ClothingCard';
