/**
 * Design Tokens - AI Try-On Design System
 * 
 * Centralized design tokens for consistent styling across the application.
 * These tokens should be used instead of hardcoded values.
 * 
 * @see STYLE_GUIDE.md for usage guidelines
 */

// ===========================================
// COLOR TOKENS
// ===========================================

/**
 * Brand colors - Instagram-inspired palette
 */
export const brandColors = {
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',
} as const;

/**
 * Instagram gradient colors
 */
export const igColors = {
  yellow: 'hsl(var(--ig-yellow))',
  orange: 'hsl(var(--ig-orange))',
  pink: 'hsl(var(--ig-pink))',
  purple: 'hsl(var(--ig-purple))',
  blue: 'hsl(var(--ig-blue))',
} as const;

/**
 * Magic gradient colors (CTA buttons)
 */
export const magicColors = {
  from: 'hsl(var(--magic-from))',
  to: 'hsl(var(--magic-to))',
} as const;

/**
 * Gem/currency colors
 */
export const gemColors = {
  default: 'hsl(var(--gem))',
  light: 'hsl(var(--gem-light))',
  dark: 'hsl(var(--gem-dark))',
} as const;

/**
 * Social media brand colors
 * Use these for social sharing buttons
 */
export const socialColors = {
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  messenger: {
    from: '#00B2FF',
    to: '#006AFF',
  },
  zalo: '#0068FF',
  google: {
    blue: '#4285F4',
    green: '#34A853',
    yellow: '#FBBC05',
    red: '#EA4335',
  },
} as const;

/**
 * Semantic colors
 */
export const semanticColors = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',
} as const;

// ===========================================
// GRADIENT TOKENS
// ===========================================

/**
 * Pre-defined gradients for consistent styling
 */
export const gradients = {
  /** Instagram multi-color gradient */
  instagram: 'linear-gradient(45deg, hsl(45 100% 51%), hsl(28 100% 54%), hsl(340 82% 52%), hsl(280 87% 50%))',
  /** Primary blue to purple */
  primary: 'linear-gradient(135deg, hsl(214 100% 59%) 0%, hsl(280 87% 50%) 100%)',
  /** Accent pink to orange */
  accent: 'linear-gradient(135deg, hsl(340 82% 52%) 0%, hsl(28 100% 54%) 100%)',
  /** Warm yellow to pink */
  warm: 'linear-gradient(135deg, hsl(45 100% 51%) 0%, hsl(340 82% 52%) 100%)',
  /** Story ring gradient */
  story: 'linear-gradient(45deg, hsl(45 100% 51%), hsl(28 100% 54%), hsl(340 82% 52%), hsl(280 87% 50%), hsl(214 100% 59%))',
  /** Magic purple CTA gradient */
  magic: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
  /** Progress bar gradient */
  progress: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
  /** Confetti colors */
  confetti: ['#ff69b4', '#00ff88', '#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7'],
} as const;

// ===========================================
// SPACING TOKENS
// ===========================================

/**
 * Spacing scale (4px base)
 * Use these for consistent margins, paddings, and gaps
 */
export const spacing = {
  /** 4px */
  xs: '0.25rem',
  /** 8px */
  sm: '0.5rem',
  /** 12px */
  md: '0.75rem',
  /** 16px */
  lg: '1rem',
  /** 20px */
  xl: '1.25rem',
  /** 24px */
  '2xl': '1.5rem',
  /** 32px */
  '3xl': '2rem',
  /** 48px */
  '4xl': '3rem',
} as const;

// ===========================================
// TYPOGRAPHY TOKENS
// ===========================================

/**
 * Font families
 */
export const fontFamily = {
  display: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
} as const;

/**
 * Font sizes with line heights
 */
export const fontSize = {
  '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
} as const;

/**
 * Font weights
 */
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ===========================================
// BORDER RADIUS TOKENS
// ===========================================

/**
 * Border radius scale
 */
export const borderRadius = {
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// ===========================================
// SHADOW TOKENS
// ===========================================

/**
 * Box shadow presets
 */
export const shadows = {
  soft: '0 1px 3px rgba(0, 0, 0, 0.08)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.1)',
  glow: '0 0 20px rgba(225, 48, 108, 0.3)',
  card: '0 1px 2px rgba(0, 0, 0, 0.1)',
} as const;

// ===========================================
// ANIMATION TOKENS
// ===========================================

/**
 * Animation durations
 */
export const duration = {
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Animation easings
 */
export const easing = {
  default: 'ease-out',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// ===========================================
// Z-INDEX TOKENS
// ===========================================

/**
 * Z-index scale for layering
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

// ===========================================
// BREAKPOINTS
// ===========================================

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
} as const;

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get social button style
 */
export const getSocialButtonStyle = (platform: keyof typeof socialColors) => {
  const color = socialColors[platform];
  if (typeof color === 'string') {
    return { backgroundColor: color };
  }
  if ('from' in color && 'to' in color) {
    return { background: `linear-gradient(to right, ${color.from}, ${color.to})` };
  }
  return {};
};

export default {
  brandColors,
  igColors,
  magicColors,
  gemColors,
  socialColors,
  semanticColors,
  gradients,
  spacing,
  fontFamily,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
  duration,
  easing,
  zIndex,
  breakpoints,
};
