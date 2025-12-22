import { Heart, ExternalLink } from 'lucide-react';
import { ClothingItem } from '@/types/clothing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface ClothingCardProps {
  item: ClothingItem;
  onSelect?: (item: ClothingItem) => void;
  onToggleFavorite?: (item: ClothingItem) => void;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
}

export const ClothingCard = forwardRef<HTMLDivElement, ClothingCardProps>(({ 
  item, 
  onSelect, 
  onToggleFavorite,
  size = 'md',
  isSelected = false,
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
            : "border-border hover:border-primary/50"
        )}
      >
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
      
      {/* Favorite button */}
      {onToggleFavorite && (
        <Button
          variant="ghost"
          size="iconSm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          className={cn(
            "absolute top-1 right-1 bg-card/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300",
            item.isFavorite && "opacity-100"
          )}
        >
          <Heart 
            size={14} 
            className={cn(
              "transition-colors",
              item.isFavorite && "fill-accent text-accent"
            )} 
          />
        </Button>
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
