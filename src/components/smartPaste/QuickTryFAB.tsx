import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTryOnDialog } from '@/contexts/TryOnDialogContext';

interface QuickTryFABProps {
  onClick?: () => void;
  className?: string;
  /** If true, opens TryOnDialog directly instead of calling onClick */
  openDialogDirectly?: boolean;
  /** Initial garment URL to pass to TryOnDialog */
  initialGarmentUrl?: string;
  /** Whether to auto-start AI processing */
  autoStart?: boolean;
}

/**
 * Floating Action Button for Quick Try feature
 * Positioned at center bottom, above MobileNav
 * Now integrates with TryOnDialog for seamless try-on experience
 * 
 * @requirements REQ-4.1, REQ-7.1, REQ-7.2
 */
export function QuickTryFAB({ 
  onClick, 
  className,
  openDialogDirectly = false,
  initialGarmentUrl,
  autoStart = false,
}: QuickTryFABProps) {
  const { openDialog } = useTryOnDialog();

  const handleClick = () => {
    if (openDialogDirectly) {
      // Open TryOnDialog directly with optional garment URL
      openDialog({ 
        initialGarmentUrl, 
        autoStart 
      });
    } else {
      // Call the legacy onClick callback
      onClick?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        // Base styles
        'fixed z-40',
        'w-14 h-14 rounded-full',
        'flex items-center justify-center',
        // Gradient background
        'bg-gradient-to-br from-primary via-ig-purple to-accent',
        'text-white',
        // Shadow and effects
        'shadow-lg shadow-primary/30',
        'hover:shadow-xl hover:shadow-primary/40',
        'hover:brightness-110',
        'active:scale-95',
        // Animation
        'transition-all duration-200',
        // Pulse animation for attention
        'animate-pulse-subtle',
        className
      )}
      aria-label="Quick Try"
    >
      <Zap size={24} className="fill-current" />
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 blur-lg -z-10 opacity-60" />
    </button>
  );
}

export default QuickTryFAB;
