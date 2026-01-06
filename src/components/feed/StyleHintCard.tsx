/**
 * File: StyleHintCard.tsx
 * Purpose: Card hiển thị outfit theo style của Uniqlo StyleHint
 *
 * Input: outfit data (image, user info, size, title)
 * Output: Rendered card component với hover animation
 *
 * Flow:
 * 1. Hiển thị ảnh outfit với aspect ratio 3:4
 * 2. Hiển thị avatar + tên user + chiều cao ở dưới
 * 3. Hiển thị badge kích cỡ (S, M, L, XL)
 * 4. Xử lý click event để navigate đến detail
 */

import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface StyleHintOutfit {
  id: string;
  title: string;
  result_image_url: string;
  size?: string;
  user_profile: {
    display_name: string;
    avatar_url?: string | null;
    height?: number | null;
  };
  likes_count?: number;
}

export interface StyleHintCardProps {
  /** Outfit data to display */
  outfit: StyleHintOutfit;
  /** Click handler for navigation */
  onClick: (id: string) => void;
  /** Optional custom className */
  className?: string;
}

/**
 * StyleHintCard - Card hiển thị outfit theo style Uniqlo StyleHint
 *
 * Features:
 * - Compact card design với ảnh 3:4
 * - User avatar + tên + chiều cao
 * - Size badge
 * - Smooth hover animation
 */
export const StyleHintCard = memo(function StyleHintCard({
  outfit,
  onClick,
  className,
}: StyleHintCardProps) {
  const { user_profile } = outfit;

  // Format chiều cao display
  const heightDisplay = user_profile.height 
    ? `${user_profile.height} cm`
    : null;

  // Format size display  
  const sizeDisplay = outfit.size 
    ? `Kích cỡ: ${outfit.size}`
    : null;

  return (
    <button
      onClick={() => onClick(outfit.id)}
      className={cn(
        'flex-shrink-0 w-40 rounded-xl overflow-hidden',
        'bg-card border border-border shadow-soft',
        'transition-all duration-300 ease-out',
        'hover:shadow-medium hover:scale-[1.02] hover:-translate-y-1',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        className
      )}
    >
      {/* Outfit Image - 3:4 aspect ratio */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={outfit.result_image_url}
          alt={outfit.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Navigation arrow - subtle hint */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* User Info Footer */}
      <div className="p-2.5 space-y-1">
        {/* User row: Avatar + Name + Height */}
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 ring-1 ring-border">
            <AvatarImage
              src={user_profile.avatar_url ?? undefined}
              alt={user_profile.display_name}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-[10px] font-bold">
              {user_profile.display_name[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-foreground truncate leading-tight">
              {user_profile.display_name}
              {heightDisplay && (
                <span className="text-muted-foreground font-normal">
                  {' - '}{heightDisplay}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Size badge */}
        {sizeDisplay && (
          <div className="flex items-center">
            <span className="text-[10px] text-muted-foreground">
              {sizeDisplay}
            </span>
          </div>
        )}
      </div>
    </button>
  );
});

export default StyleHintCard;
