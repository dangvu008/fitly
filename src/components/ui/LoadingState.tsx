import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  /** Type of loading indicator */
  variant?: 'spinner' | 'skeleton' | 'dots' | 'page';
  /** Size of the loading indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Optional message to display */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton items (for skeleton variant) */
  skeletonCount?: number;
  /** Whether to center the loading state */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const containerSizes = {
  sm: 'min-h-[100px]',
  md: 'min-h-[200px]',
  lg: 'min-h-[400px]',
};

/**
 * Standardized loading state component for consistent UX across the app.
 * 
 * @example
 * // Simple spinner
 * <LoadingState />
 * 
 * // Full page loading
 * <LoadingState variant="page" message="Loading your wardrobe..." />
 * 
 * // Skeleton grid
 * <LoadingState variant="skeleton" skeletonCount={6} />
 */
export function LoadingState({
  variant = 'spinner',
  size = 'md',
  message,
  className,
  skeletonCount = 4,
  centered = true,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div
        className={cn(
          'flex items-center gap-1',
          centered && 'justify-center',
          containerSizes[size],
          className
        )}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-primary animate-bounce',
              size === 'sm' && 'w-1.5 h-1.5',
              size === 'md' && 'w-2 h-2',
              size === 'lg' && 'w-3 h-3'
            )}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 py-12',
          containerSizes.lg,
          className
        )}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
            <Loader2 className={cn('animate-spin text-primary', sizeClasses.lg)} />
          </div>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        centered && 'justify-center',
        containerSizes[size],
        className
      )}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

/**
 * Inline loading spinner for buttons and small areas
 */
export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

/**
 * Loading overlay for sections
 */
export function LoadingOverlay({
  isVisible,
  message,
}: {
  isVisible: boolean;
  message?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingState variant="spinner" size="lg" message={message} />
    </div>
  );
}
