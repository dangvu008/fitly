import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bookmark, MoreVertical, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * Outfit item data structure for Home page cards
 */
export interface OutfitItem {
  id: string;
  title: string;
  result_image_url: string;
  likes_count: number;
  comments_count?: number;
  clothing_items?: Array<{ name: string; imageUrl: string; shopUrl?: string; price?: string }>;
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  category?: 'new' | 'trending' | 'for_you';
}

export interface HomeOutfitCardProps {
  /** Outfit data to display */
  outfit: OutfitItem;
  /** Callback when "Try This" button is clicked */
  onTry: () => void;
  /** Callback when card is clicked (navigate to detail) */
  onClick: () => void;
  /** Card variant - 'horizontal' for scroll sections, 'grid' for 2-column grid */
  variant: 'horizontal' | 'grid';
  /** Whether outfit is saved */
  isSaved?: boolean;
  /** Callback when save button is clicked */
  onSave?: () => void;
  /** Callback when hide is clicked */
  onHide?: () => void;
  /** Custom class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Home page outfit card component
 * Displays outfit with 3:4 aspect ratio, small user avatar overlay (24px), and prominent gradient "Try This" button
 * 
 * Requirements: 5.1, 5.5, 2.6
 * - 5.1: Prominent gradient "Try This" button at the bottom
 * - 5.5: Focus on outfit image with minimal user info overlay
 * - 2.6: Outfit cards in horizontal sections maintain prominent "Try This" button
 */
export const HomeOutfitCard = ({
  outfit,
  onTry,
  onClick,
  variant,
  isSaved = false,
  onSave,
  onHide,
  className,
  'data-testid': testId,
}: HomeOutfitCardProps) => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHorizontal = variant === 'horizontal';

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.();
  };

  const handleHideClick = () => {
    setMenuOpen(false);
    onHide?.();
  };

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-medium transition-all',
        isHorizontal ? 'flex-shrink-0 w-40' : 'w-full',
        className
      )}
      data-testid={testId}
    >
      {/* Image with overlay */}
      <button
        onClick={onClick}
        className="relative aspect-[3/4] w-full overflow-hidden group"
        aria-label={`View ${outfit.title}`}
      >
        <img
          src={outfit.result_image_url}
          alt={outfit.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {/* Small user avatar overlay (24px) - Requirements 5.5 */}
        {outfit.user_profile && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage
                src={outfit.user_profile.avatar_url}
                alt={outfit.user_profile.display_name || ''}
              />
              <AvatarFallback className="bg-primary/20 text-[8px] font-bold text-primary">
                {(outfit.user_profile.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Action buttons overlay - top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Save button */}
          {onSave && (
            <button
              onClick={handleSaveClick}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                isSaved 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background/60 backdrop-blur-sm text-foreground hover:bg-background/80"
              )}
              aria-label={isSaved ? t('unsave') : t('save')}
            >
              <Bookmark size={12} className={isSaved ? "fill-current" : ""} />
            </button>
          )}

          {/* More menu */}
          {onHide && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={handleHideClick} className="text-xs">
                  <EyeOff size={14} className="mr-2" />
                  {t('hide_outfit')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title and stats at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-xs font-semibold text-white line-clamp-1 drop-shadow-md">
            {outfit.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-white/80">
              ❤️ {outfit.likes_count}
            </span>
            {outfit.comments_count !== undefined && outfit.comments_count > 0 && (
              <span className="text-[10px] text-white/80">
                💬 {outfit.comments_count}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Prominent gradient "Try This" button - Requirements 5.1, 2.6 */}
      <div className="p-2 border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTry();
          }}
          className="w-full h-8 text-xs font-medium rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          data-testid="try-button"
        >
          <span className="text-sm">👗</span>
          {t('try_outfit')}
        </button>
      </div>
    </div>
  );
};

export default HomeOutfitCard;
