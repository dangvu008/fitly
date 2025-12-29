/**
 * FitlyLogo - App logo component with gradient styling
 * Modern, minimal design representing virtual try-on
 */

import { cn } from '@/lib/utils';

interface FitlyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const SIZES = {
  sm: { icon: 24, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
  xl: { icon: 56, text: 'text-3xl' },
};

export function FitlyLogo({ size = 'md', showText = true, className }: FitlyLogoProps) {
  const { icon, text } = SIZES[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - Stylized hanger with sparkle */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="fitlyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id="fitlyGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        
        {/* Hanger hook */}
        <path
          d="M24 4C24 4 24 8 24 10C24 12 26 14 28 14"
          stroke="url(#fitlyGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Hanger body - stylized shirt shape */}
        <path
          d="M10 18L24 14L38 18L36 38H12L10 18Z"
          fill="url(#fitlyGradient)"
          opacity="0.9"
        />
        
        {/* Inner shirt detail */}
        <path
          d="M18 18L24 16L30 18L29 32H19L18 18Z"
          fill="white"
          opacity="0.3"
        />
        
        {/* Sparkle - top right */}
        <path
          d="M38 8L40 12L44 10L40 14L42 18L38 14L34 16L38 12L36 8L38 8Z"
          fill="url(#fitlyGradient2)"
        />
        
        {/* Small sparkle - bottom left */}
        <circle cx="8" cy="32" r="2" fill="url(#fitlyGradient)" opacity="0.6" />
        <circle cx="6" cy="28" r="1" fill="url(#fitlyGradient2)" opacity="0.4" />
      </svg>

      {/* Text */}
      {showText && (
        <span className={cn(
          'font-bold tracking-tight',
          text
        )}>
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            Fit
          </span>
          <span className="text-foreground">ly</span>
        </span>
      )}
    </div>
  );
}

// Alternative compact logo for small spaces
export function FitlyLogoCompact({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="fitlyGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      
      {/* Simplified hanger + shirt */}
      <path
        d="M24 4C24 4 24 8 24 10C24 12 26 14 28 14"
        stroke="url(#fitlyGradientCompact)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 18L24 14L38 18L36 38H12L10 18Z"
        fill="url(#fitlyGradientCompact)"
      />
      <path
        d="M18 18L24 16L30 18L29 32H19L18 18Z"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
