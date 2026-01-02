import { useState } from 'react';
import { Heart, MessageCircle, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Outfit data with user information for Community page
 * Requirements: 3.1, 3.2, 3.3, 5.2, 5.3, 5.4
 */
export interface OutfitWithUser {
  id: string;
  title: string;
  description: string | null;
  result_image_url: string;
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  user_id: string;
  clothing_items: Array<{ name: string; imageUrl: string; shopUrl?: string; price?: string }>;
  user_profile: {
    display_name: string;
    avatar_url: string | null;
    followers_count?: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface CommunityOutfitCardProps {
  /** Outfit data with user information */
  outfit: OutfitWithUser;
  /** Callback when like button is clicked */
  onLike: () => void;
  /** Callback when comment button is clicked */
  onComment: () => void;
  /** Callback when try button is clicked */
  onTry: () => void;
  /** Callback when card is clicked (navigate to detail) */
  onClick: () => void;
  /** Layout mode - 'single-column' for Instagram-style, 'masonry' for Pinterest-style */
  layout: 'single-column' | 'masonry';
  /** Custom class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Maximum number of lines for caption text
 * Requirements: 3.2 - Caption text (2-3 lines) from the outfit creator
 */
const MAX_CAPTION_LINES = 3;

/**
 * Community page outfit card component
 * Instagram-style design with larger user avatar (32px), caption text, and subtle "Try" button
 * 
 * Requirements:
 * - 3.1: Display User_Profile_Info prominently with larger avatar (32px) and display name
 * - 3.2: Display Caption text (2-3 lines) from the outfit creator
 * - 3.3: Try_Button on Community_Page SHALL be smaller/outline style
 * - 5.2: Community_Page Outfit_Card SHALL have a subtle outline "Try" icon button
 * - 5.3: Community_Page Outfit_Card SHALL display user avatar and name at the top (larger than Home)
 * - 5.4: Community_Page Outfit_Card SHALL display caption text below the image
 */
export const CommunityOutfitCard = ({
  outfit,
  onLike,
  onComment,
  onTry,
  onClick,
  layout,
  className,
  'data-testid': testId,
}: CommunityOutfitCardProps) => {
  const [isLiked, setIsLiked] = useState(outfit.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(outfit.likes_count);

  const isSingleColumn = layout === 'single-column';

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment();
  };

  const handleTry = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTry();
  };

  const timeAgo = formatDistanceToNow(new Date(outfit.created_at), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div
      className={cn(
        'bg-card rounded-xl overflow-hidden border border-border',
        isSingleColumn ? 'w-full' : 'break-inside-avoid mb-4',
        className
      )}
      data-testid={testId}
    >
      {/* User header with larger avatar (32px) - Requirements 3.1, 5.3 */}
      <div className="flex items-center gap-3 p-3">
        <Avatar className="w-8 h-8 ring-2 ring-primary/20">
          <AvatarImage
            src={outfit.user_profile.avatar_url ?? undefined}
            alt={outfit.user_profile.display_name}
          />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold">
            {outfit.user_profile.display_name[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {outfit.user_profile.display_name}
          </p>
          <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* Outfit image with 4:5 or 1:1 aspect ratio */}
      <button
        onClick={onClick}
        className={cn(
          'relative w-full overflow-hidden bg-muted',
          isSingleColumn ? 'aspect-[4/5]' : 'aspect-square'
        )}
        aria-label={`View ${outfit.title}`}
      >
        <img
          src={outfit.result_image_url}
          alt={outfit.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Featured badge */}
        {outfit.is_featured && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            ✨ Featured
          </div>
        )}
      </button>

      {/* Likes/comments row with small outline "Try" button - Requirements 3.3, 5.2 */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={cn(
                'transition-all active:scale-90',
                isLiked ? 'text-red-500' : 'text-foreground hover:text-muted-foreground'
              )}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={22} className={isLiked ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleComment}
              className="text-foreground hover:text-muted-foreground transition-colors"
              aria-label="Comment"
            >
              <MessageCircle size={22} />
            </button>
          </div>

          {/* Small outline "Try" button - Requirements 3.3, 5.2 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTry}
            className="h-7 px-2.5 text-xs gap-1 border-primary/50 text-primary hover:bg-primary/10"
            data-testid="try-button"
          >
            <Zap size={14} />
            Try
          </Button>
        </div>

        {/* Likes and comments count - Requirements 4.3 */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{likesCount.toLocaleString()} likes</span>
          {outfit.comments_count > 0 && (
            <button
              onClick={handleComment}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {outfit.comments_count} comments
            </button>
          )}
        </div>

        {/* Caption text (2-3 lines, truncated) - Requirements 3.2, 5.4 */}
        {outfit.description && (
          <p
            className={cn(
              'text-sm text-foreground',
              `line-clamp-${MAX_CAPTION_LINES}`
            )}
            data-testid="caption"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: MAX_CAPTION_LINES,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            <span className="font-semibold">{outfit.user_profile.display_name}</span>{' '}
            {outfit.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommunityOutfitCard;
