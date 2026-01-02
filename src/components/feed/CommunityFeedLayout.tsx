import { cn } from '@/lib/utils';
import { CommunityOutfitCard, OutfitWithUser } from './CommunityOutfitCard';

/**
 * Props for CommunityFeedLayout component
 * Requirements: 4.1, 4.2
 */
export interface CommunityFeedLayoutProps {
  /** Array of outfits with user information */
  outfits: OutfitWithUser[];
  /** Layout mode - 'single-column' for Instagram-style, 'masonry' for Pinterest-style */
  layout: 'single-column' | 'masonry';
  /** Callback when outfit card is clicked (navigate to detail) */
  onOutfitClick: (id: string) => void;
  /** Callback when like button is clicked */
  onLike: (id: string) => void;
  /** Callback when comment button is clicked */
  onComment: (id: string) => void;
  /** Callback when try button is clicked */
  onTry: (outfit: OutfitWithUser) => void;
  /** Custom class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * CommunityFeedLayout component
 * Manages layout switching between single-column (Instagram-style) and masonry (Pinterest-style)
 * 
 * Requirements:
 * - 4.1: Support single-column layout option (Instagram-style feed)
 * - 4.2: Support Pinterest-style masonry layout with varying heights for 2-column view
 */
export const CommunityFeedLayout = ({
  outfits,
  layout,
  onOutfitClick,
  onLike,
  onComment,
  onTry,
  className,
  'data-testid': testId,
}: CommunityFeedLayoutProps) => {
  const isSingleColumn = layout === 'single-column';

  return (
    <div
      className={cn(
        isSingleColumn
          ? 'flex flex-col gap-4' // Single-column: Full-width cards like Instagram
          : 'columns-2 gap-3 space-y-0', // Masonry: Pinterest-style varying heights
        className
      )}
      data-testid={testId}
      data-layout={layout}
    >
      {outfits.map((outfit) => (
        <CommunityOutfitCard
          key={outfit.id}
          outfit={outfit}
          layout={layout}
          onLike={() => onLike(outfit.id)}
          onComment={() => onComment(outfit.id)}
          onTry={() => onTry(outfit)}
          onClick={() => onOutfitClick(outfit.id)}
          data-testid={`outfit-card-${outfit.id}`}
        />
      ))}
    </div>
  );
};

export default CommunityFeedLayout;
