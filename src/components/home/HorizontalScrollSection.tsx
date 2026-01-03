import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronRight as ViewAllIcon, LucideIcon, Bookmark, MoreVertical, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * Outfit item data structure for horizontal scroll sections
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

export interface HorizontalScrollSectionProps {
  /** Section title displayed in header */
  title: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Array of outfit items to display (6-10 items recommended) */
  items: OutfitItem[];
  /** Callback when an item is clicked */
  onItemClick: (item: OutfitItem) => void;
  /** Callback when "Try This" button is clicked */
  onTryItem: (item: OutfitItem) => void;
  /** Callback when save button is clicked */
  onSaveItem?: (item: OutfitItem) => void;
  /** Callback when hide is clicked */
  onHideItem?: (item: OutfitItem) => void;
  /** Function to check if item is saved */
  isItemSaved?: (itemId: string) => boolean;
  /** Whether to show "View All" link */
  showViewAll?: boolean;
  /** Callback when "View All" is clicked */
  onViewAll?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Custom class name for the section */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Horizontal scroll section component for Home page
 * Displays outfit cards in a horizontally scrollable container with CSS scroll-snap
 * 
 * Requirements: 2.1, 2.2, 6.4
 */
export const HorizontalScrollSection = ({
  title,
  icon: Icon,
  items,
  onItemClick,
  onTryItem,
  onSaveItem,
  onHideItem,
  isItemSaved,
  showViewAll = true,
  onViewAll,
  isLoading = false,
  className,
  'data-testid': testId,
}: HorizontalScrollSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Limit items to 6-10 range as per Requirements 2.5
  const displayItems = items.slice(0, 10);
  const minItems = 6;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 180; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <section className={cn('py-4', className)} data-testid={testId}>
        <div className="flex items-center gap-2 px-3 sm:px-4 mb-3">
          <Icon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
        </div>
        <div className="flex gap-2.5 sm:gap-3 px-3 sm:px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-36 sm:w-44 h-52 sm:h-60 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  // Empty state - don't render if no items
  if (displayItems.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-4 relative group', className)} data-testid={testId}>
      {/* Section Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
        </div>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            {t('view_all')}
            <ViewAllIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Scroll Navigation Buttons (Desktop) */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute left-1 top-1/2 translate-y-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex h-8 w-8"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-1 top-1/2 translate-y-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex h-8 w-8"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Horizontal Scroll Container with CSS scroll-snap */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 sm:gap-3 px-3 sm:px-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
        role="list"
        aria-label={title}
      >
        {displayItems.map((item) => (
          <OutfitCard
            key={item.id}
            item={item}
            onItemClick={onItemClick}
            onTryItem={onTryItem}
            onSaveItem={onSaveItem}
            onHideItem={onHideItem}
            isSaved={isItemSaved?.(item.id) ?? false}
          />
        ))}
        
        {/* Peek indicator - shows there's more content */}
        {displayItems.length >= minItems && (
          <div 
            className="flex-shrink-0 w-6 sm:w-8 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-1 h-16 bg-gradient-to-b from-transparent via-muted-foreground/20 to-transparent rounded-full" />
          </div>
        )}
      </div>
    </section>
  );
};


/**
 * Internal outfit card component for horizontal scroll sections
 * Displays outfit with 3:4 aspect ratio, small user avatar overlay, and prominent "Try This" button
 * 
 * Requirements: 5.1, 5.5, 2.6
 */
interface OutfitCardProps {
  item: OutfitItem;
  onItemClick: (item: OutfitItem) => void;
  onTryItem: (item: OutfitItem) => void;
  onSaveItem?: (item: OutfitItem) => void;
  onHideItem?: (item: OutfitItem) => void;
  isSaved?: boolean;
}

const OutfitCard = ({ item, onItemClick, onTryItem, onSaveItem, onHideItem, isSaved = false }: OutfitCardProps) => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveItem?.(item);
  };

  const handleHideClick = () => {
    setMenuOpen(false);
    onHideItem?.(item);
  };

  return (
    <div
      className="flex-shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-medium transition-all snap-start"
      role="listitem"
      data-testid={`outfit-card-${item.id}`}
    >
      {/* Image with overlay */}
      <button
        onClick={() => onItemClick(item)}
        className="relative aspect-[3/4] w-full overflow-hidden group"
      >
        <img
          src={item.result_image_url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {/* Small user avatar overlay (24px) - Requirements 5.5 */}
        {item.user_profile && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-card border border-border overflow-hidden">
              {item.user_profile.avatar_url ? (
                <img
                  src={item.user_profile.avatar_url}
                  alt={item.user_profile.display_name || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary">
                    {(item.user_profile.display_name || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons overlay - top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Save button */}
          {onSaveItem && (
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
          {onHideItem && (
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
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-white/80">
              ❤️ {item.likes_count}
            </span>
            {item.comments_count !== undefined && item.comments_count > 0 && (
              <span className="text-[10px] text-white/80">
                💬 {item.comments_count}
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
            onTryItem(item);
          }}
          className="w-full h-8 text-xs font-medium rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          data-testid={`try-button-${item.id}`}
        >
          <span className="text-sm">⚡</span>
          {t('try_this')}
        </button>
      </div>
    </div>
  );
};

export default HorizontalScrollSection;
