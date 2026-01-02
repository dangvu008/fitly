import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClothingItem } from '@/types/clothing';
import { forwardRef } from 'react';

export interface QuickTryButtonProps {
  /** Outfit ID for trying an outfit from feed */
  outfitId?: string;
  /** Single clothing item for trying from closet/shop */
  clothingItem?: ClothingItem;
  /** Callback when try-on starts */
  onTryStart?: () => void;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Button style variant */
  variant?: 'default' | 'overlay';
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * QuickTryButton - One-tap try-on button with gradient styling
 * 
 * Displays a prominent ⚡ button that triggers the one-tap try-on flow.
 * Used on outfit cards, clothing cards, and trending outfits.
 * 
 * @requirements 2.1, 2.2, 2.5
 */
export const QuickTryButton = forwardRef<HTMLButtonElement, QuickTryButtonProps>(
  (
    {
      outfitId,
      clothingItem,
      onTryStart,
      size = 'md',
      variant = 'default',
      className,
      disabled = false,
      'data-testid': testId,
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onTryStart?.();
    };

    // Size classes for the button
    const sizeClasses = {
      sm: 'h-7 w-7 [&_svg]:size-3.5',
      md: 'h-9 w-9 [&_svg]:size-4',
      lg: 'h-11 w-11 [&_svg]:size-5',
    };

    // Variant classes
    const variantClasses = {
      default: 'shadow-medium hover:shadow-glow',
      overlay: 'shadow-lg backdrop-blur-sm bg-opacity-90',
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        data-testid={testId ?? 'quick-try-button'}
        aria-label="Quick try-on"
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-full',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-95',
          // Gradient background (primary to accent)
          'bg-gradient-to-br from-primary via-ig-purple to-accent',
          'text-white',
          'hover:brightness-110',
          // Size variant
          sizeClasses[size],
          // Style variant
          variantClasses[variant],
          className
        )}
      >
        <Zap className="fill-current" />
      </button>
    );
  }
);

QuickTryButton.displayName = 'QuickTryButton';

export default QuickTryButton;
