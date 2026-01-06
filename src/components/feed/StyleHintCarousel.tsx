/**
 * File: StyleHintCarousel.tsx
 * Purpose: Carousel hiển thị các outfit theo style StyleHint của Uniqlo
 *
 * Input: Array of StyleHintOutfit, loading state
 * Output: Horizontal scrollable carousel với navigation arrows
 *
 * Flow:
 * 1. Render header "Gợi ý phối đồ từ cộng đồng"
 * 2. Horizontal scroll container với StyleHintCards
 * 3. Arrow navigation cho desktop
 * 4. Handle click để navigate đến outfit detail
 */

import { useRef, useState, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StyleHintCard, StyleHintOutfit } from './StyleHintCard';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface StyleHintCarouselProps {
    /** Array of outfits to display */
    outfits: StyleHintOutfit[];
    /** Loading state */
    isLoading?: boolean;
    /** Callback when outfit is clicked */
    onOutfitClick: (id: string) => void;
    /** Section title */
    title?: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Optional className */
    className?: string;
}

/**
 * StyleHintCarousel - Horizontal carousel của StyleHint cards
 *
 * Features:
 * - Horizontal smooth scrolling
 * - Desktop arrow navigation (hover to show)
 * - Mobile touch/swipe support
 * - Loading skeleton state
 * - Auto-hide arrows when at edges
 */
export const StyleHintCarousel = memo(function StyleHintCarousel({
    outfits,
    isLoading = false,
    onOutfitClick,
    title = 'Gợi ý phối đồ từ cộng đồng',
    subtitle,
    className,
}: StyleHintCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const { t } = useLanguage();

    // Check scroll position to show/hide arrows
    const checkScrollPosition = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkScrollPosition);
            // Initial check
            checkScrollPosition();

            // Re-check when outfits change
            const timer = setTimeout(checkScrollPosition, 100);

            return () => {
                scrollContainer.removeEventListener('scroll', checkScrollPosition);
                clearTimeout(timer);
            };
        }
    }, [outfits]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 320; // ~2 cards
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <section className={cn('py-4', className)}>
                <div className="flex items-center gap-2 px-4 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold">{title}</h2>
                </div>
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-shrink-0 w-40">
                            <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                            <div className="mt-2 space-y-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    // Empty state
    if (outfits.length === 0) {
        return null;
    }

    return (
        <section className={cn('py-4 relative group', className)}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="flex-1">
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    {subtitle && (
                        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                    {outfits.length} outfit
                </span>
            </div>

            {/* Left Arrow - Desktop only */}
            <Button
                variant="secondary"
                size="icon"
                className={cn(
                    'absolute left-1 top-1/2 translate-y-4 z-10',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'shadow-md hidden md:flex',
                    'disabled:opacity-0',
                    !canScrollLeft && 'pointer-events-none'
                )}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Right Arrow - Desktop only */}
            <Button
                variant="secondary"
                size="icon"
                className={cn(
                    'absolute right-1 top-1/2 translate-y-4 z-10',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'shadow-md hidden md:flex',
                    'disabled:opacity-0',
                    !canScrollRight && 'pointer-events-none'
                )}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
            >
                <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex gap-3 px-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{
                    scrollPaddingLeft: '16px',
                    scrollPaddingRight: '16px',
                }}
            >
                {outfits.map((outfit) => (
                    <div key={outfit.id} className="snap-start">
                        <StyleHintCard
                            outfit={outfit}
                            onClick={onOutfitClick}
                        />
                    </div>
                ))}

                {/* End spacer for scroll padding */}
                <div className="flex-shrink-0 w-4" aria-hidden="true" />
            </div>

            {/* Scroll indicator dots - Mobile only */}
            <div className="flex justify-center gap-1 mt-3 md:hidden">
                {outfits.length > 2 && outfits.slice(0, Math.min(5, Math.ceil(outfits.length / 2))).map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
                    />
                ))}
            </div>
        </section>
    );
});

export default StyleHintCarousel;
