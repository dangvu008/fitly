import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickTryFABProps {
  onClick: () => void;
  className?: string;
}

/**
 * Floating Action Button for Quick Try feature
 * Positioned at center bottom, above MobileNav
 * 
 * @requirements REQ-4.1
 */
export function QuickTryFAB({ onClick, className }: QuickTryFABProps) {
  return (
    <button
      onClick={onClick}
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
