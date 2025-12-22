import { Heart } from 'lucide-react';
import { SharedOutfit } from '@/hooks/useSharedOutfits';
import { cn } from '@/lib/utils';

interface SharedOutfitCardProps {
  outfit: SharedOutfit;
  onClick?: () => void;
  onToggleLike?: (outfitId: string) => void;
}

export const SharedOutfitCard = ({ outfit, onClick, onToggleLike }: SharedOutfitCardProps) => {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLike?.(outfit.id);
  };

  return (
    <div
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl overflow-hidden shadow-soft border border-border hover:border-primary/50 transition-all group cursor-pointer"
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        <img
          src={outfit.result_image_url}
          alt={outfit.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Featured badge */}
        {outfit.is_featured && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
            Nổi bật
          </div>
        )}

        {/* Like button */}
        <button
          onClick={handleLikeClick}
          className={cn(
            "absolute top-2 right-2 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 text-xs transition-all",
            outfit.isLiked 
              ? "bg-destructive/90 text-destructive-foreground" 
              : "bg-card/90 text-foreground hover:bg-destructive/80 hover:text-destructive-foreground"
          )}
        >
          <Heart 
            size={12} 
            className={cn(outfit.isLiked && "fill-current")} 
          />
          <span>{outfit.likes_count}</span>
        </button>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/60 to-transparent" />
        
        {/* Title */}
        <div className="absolute bottom-2 left-2 right-2">
          <h4 className="text-primary-foreground font-medium text-sm truncate">
            {outfit.title}
          </h4>
          <p className="text-primary-foreground/80 text-xs">
            {outfit.clothing_items?.length || 0} món đồ
          </p>
        </div>
      </div>
    </div>
  );
};
