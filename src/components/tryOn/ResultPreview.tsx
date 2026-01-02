import { useState, useRef, useCallback } from 'react';
import {
  Download,
  ShoppingBag,
  Share2,
  RefreshCw,
  RotateCcw,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClothingItem } from '@/types/clothing';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TryOnResultData {
  id: string;
  resultImageUrl: string;
  bodyImageUrl: string;
  clothingItems: ClothingItem[];
  createdAt: string;
  backgroundPreserved: boolean;
}

export interface ResultPreviewProps {
  /** The try-on result data */
  result: TryOnResultData;
  /** Original body image for comparison */
  originalBodyImage: string;
  /** Clothing items used in the try-on */
  clothingItems: ClothingItem[];
  /** Callback for Download HD action */
  onDownloadHD: () => void;
  /** Callback for Shop Now action */
  onShopNow: () => void;
  /** Callback for Share action */
  onShare: () => void;
  /** Callback for Try Another action */
  onTryAnother: () => void;
  /** Callback for Retry action */
  onRetry: () => void;
  /** Callback to close the preview */
  onClose: () => void;
  /** Additional class names */
  className?: string;
}

const LONG_PRESS_DURATION = 500; // ms

/**
 * ResultPreview - Full-screen result display with action buttons
 * 
 * Features:
 * - Full-screen result image display
 * - Long-press for Before/After comparison
 * - Action buttons: Download HD, Shop Now, Share, Try Another, Retry
 * - Background fallback notification
 * 
 * @requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.3
 */
export const ResultPreview = ({
  result,
  originalBodyImage,
  clothingItems,
  onDownloadHD,
  onShopNow,
  onShare,
  onTryAnother,
  onRetry,
  onClose,
  className,
}: ResultPreviewProps) => {
  const { t } = useLanguage();
  const [showComparison, setShowComparison] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressingRef = useRef(false);

  // Long-press handlers for Before/After comparison - Requirement 5.2
  const handlePressStart = useCallback(() => {
    isLongPressingRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressingRef.current = true;
      setShowComparison(true);
    }, LONG_PRESS_DURATION);
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setShowComparison(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handlePressStart();
    },
    [handlePressStart]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      handlePressEnd();
    },
    [handlePressEnd]
  );

  // Mouse event handlers (for desktop)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handlePressStart();
    },
    [handlePressStart]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      handlePressEnd();
    },
    [handlePressEnd]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      handlePressEnd();
    },
    [handlePressEnd]
  );

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col animate-fade-in',
        className
      )}
      data-testid="result-preview"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <button
          onClick={onClose}
          className="text-foreground press-effect"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <span className="font-semibold text-foreground">
          {t('tryon_result_title') || 'Kết quả thử đồ'}
        </span>
        <div className="w-6" />
      </div>

      {/* Background fallback notification - Requirement 7.3 */}
      {!result.backgroundPreserved && (
        <div
          className="mx-4 mt-2 flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          data-testid="background-fallback-notification"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Không thể giữ nguyên nền ảnh gốc, đã sử dụng nền trung tính
          </p>
        </div>
      )}

      {/* Result Image with long-press comparison */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Result image (default) */}
        <img
          src={showComparison ? originalBodyImage : result.resultImageUrl}
          alt={showComparison ? 'Original body image' : 'AI Try-On Result'}
          className="max-w-full max-h-full object-contain rounded-xl transition-opacity duration-200"
          draggable={false}
        />

        {/* Comparison indicator */}
        {showComparison && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground/80 text-background text-sm font-medium">
            Before
          </div>
        )}

        {/* Long-press hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground/50 text-background text-xs">
          Giữ để xem ảnh gốc
        </div>
      </div>

      {/* Clothing items carousel */}
      {clothingItems.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {clothingItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons - Requirements 5.3, 5.4, 5.5, 5.6, 5.7 */}
      <div className="border-t border-border p-4 space-y-3 safe-bottom">
        {/* Primary actions row */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onDownloadHD}
            data-testid="download-hd-button"
          >
            <Download size={18} className="mr-2" />
            Download HD
          </Button>
          <Button
            variant="instagram"
            className="flex-1"
            onClick={onShopNow}
            data-testid="shop-now-button"
          >
            <ShoppingBag size={18} className="mr-2" />
            Shop Now
          </Button>
        </div>

        {/* Secondary actions row */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onShare}
            data-testid="share-button"
          >
            <Share2 size={18} className="mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onTryAnother}
            data-testid="try-another-button"
          >
            <RefreshCw size={18} className="mr-2" />
            Try Another
          </Button>
        </div>

        {/* Retry button */}
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onRetry}
          data-testid="retry-button"
        >
          <RotateCcw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
};

export default ResultPreview;
