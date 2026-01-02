import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, Move, RotateCcw, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SmartCropPreviewProps {
  originalImage: string;
  croppedImage: string;
  cropBounds: CropBounds;
  onConfirm: () => void;
  onAdjust: (newBounds: CropBounds) => void;
  onRetry: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

/**
 * Preview component for smart crop results
 * Shows original image with crop area highlighted and cropped result side-by-side
 * Allows manual adjustment of crop bounds
 * 
 * @requirements REQ-5.3, REQ-5.5
 */
export function SmartCropPreview({
  originalImage,
  croppedImage,
  cropBounds,
  onConfirm,
  onAdjust,
  onRetry,
  onCancel,
  isProcessing = false,
}: SmartCropPreviewProps) {
  const { t } = useLanguage();
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustedBounds, setAdjustedBounds] = useState<CropBounds>(cropBounds);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragType = useRef<'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | null>(null);

  // Load original image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
    };
    img.src = originalImage;
  }, [originalImage]);

  // Reset adjusted bounds when cropBounds changes
  useEffect(() => {
    setAdjustedBounds(cropBounds);
  }, [cropBounds]);

  // Calculate scale factor for displaying crop overlay
  const getScaleFactor = useCallback(() => {
    if (!imageRef.current || originalDimensions.width === 0) return 1;
    return imageRef.current.clientWidth / originalDimensions.width;
  }, [originalDimensions.width]);

  // Convert bounds to display coordinates
  const getDisplayBounds = useCallback(() => {
    const scale = getScaleFactor();
    return {
      x: adjustedBounds.x * scale,
      y: adjustedBounds.y * scale,
      width: adjustedBounds.width * scale,
      height: adjustedBounds.height * scale,
    };
  }, [adjustedBounds, getScaleFactor]);

  // Handle mouse/touch events for adjustment
  const handlePointerDown = useCallback((e: React.PointerEvent, type: typeof dragType.current) => {
    if (!isAdjusting) return;
    e.preventDefault();
    isDragging.current = true;
    dragType.current = type;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isAdjusting]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !dragType.current) return;
    
    const scale = getScaleFactor();
    const dx = (e.clientX - dragStart.current.x) / scale;
    const dy = (e.clientY - dragStart.current.y) / scale;
    dragStart.current = { x: e.clientX, y: e.clientY };

    setAdjustedBounds(prev => {
      const newBounds = { ...prev };
      const minSize = 50; // Minimum crop size

      switch (dragType.current) {
        case 'move':
          newBounds.x = Math.max(0, Math.min(originalDimensions.width - prev.width, prev.x + dx));
          newBounds.y = Math.max(0, Math.min(originalDimensions.height - prev.height, prev.y + dy));
          break;
        case 'resize-nw':
          newBounds.x = Math.max(0, prev.x + dx);
          newBounds.y = Math.max(0, prev.y + dy);
          newBounds.width = Math.max(minSize, prev.width - dx);
          newBounds.height = Math.max(minSize, prev.height - dy);
          break;
        case 'resize-ne':
          newBounds.y = Math.max(0, prev.y + dy);
          newBounds.width = Math.max(minSize, Math.min(originalDimensions.width - prev.x, prev.width + dx));
          newBounds.height = Math.max(minSize, prev.height - dy);
          break;
        case 'resize-sw':
          newBounds.x = Math.max(0, prev.x + dx);
          newBounds.width = Math.max(minSize, prev.width - dx);
          newBounds.height = Math.max(minSize, Math.min(originalDimensions.height - prev.y, prev.height + dy));
          break;
        case 'resize-se':
          newBounds.width = Math.max(minSize, Math.min(originalDimensions.width - prev.x, prev.width + dx));
          newBounds.height = Math.max(minSize, Math.min(originalDimensions.height - prev.y, prev.height + dy));
          break;
      }

      return newBounds;
    });
  }, [getScaleFactor, originalDimensions]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    dragType.current = null;
  }, []);

  const handleConfirmAdjustment = () => {
    setIsAdjusting(false);
    onAdjust(adjustedBounds);
  };

  const handleCancelAdjustment = () => {
    setIsAdjusting(false);
    setAdjustedBounds(cropBounds);
  };

  const displayBounds = getDisplayBounds();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t('smart_crop_title') || 'Smart Crop'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={isProcessing}
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
          {/* Original Image with Crop Overlay */}
          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              {t('smart_crop_original') || 'Original'}
            </p>
            <div 
              ref={containerRef}
              className="flex-1 relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <img
                ref={imageRef}
                src={originalImage}
                alt="Original"
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
              
              {/* Crop Overlay */}
              {originalDimensions.width > 0 && (
                <>
                  {/* Darkened area outside crop */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        linear-gradient(to right, 
                          rgba(0,0,0,0.5) ${displayBounds.x}px, 
                          transparent ${displayBounds.x}px, 
                          transparent ${displayBounds.x + displayBounds.width}px, 
                          rgba(0,0,0,0.5) ${displayBounds.x + displayBounds.width}px
                        )
                      `,
                    }}
                  />
                  
                  {/* Crop area highlight */}
                  <div
                    className={cn(
                      "absolute border-2 border-primary rounded-lg transition-all",
                      isAdjusting && "border-dashed cursor-move"
                    )}
                    style={{
                      left: displayBounds.x,
                      top: displayBounds.y,
                      width: displayBounds.width,
                      height: displayBounds.height,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'move')}
                  >
                    {/* Resize handles (only in adjust mode) */}
                    {isAdjusting && (
                      <>
                        <div
                          className="absolute -top-2 -left-2 w-4 h-4 bg-primary rounded-full cursor-nw-resize"
                          onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-nw'); }}
                        />
                        <div
                          className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-ne-resize"
                          onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-ne'); }}
                        />
                        <div
                          className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary rounded-full cursor-sw-resize"
                          onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-sw'); }}
                        />
                        <div
                          className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-se-resize"
                          onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-se'); }}
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cropped Result */}
          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              {t('smart_crop_result') || 'Cropped Result'}
            </p>
            <div className="flex-1 relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    {t('loading') || 'Processing...'}
                  </p>
                </div>
              ) : (
                <img
                  src={croppedImage}
                  alt="Cropped"
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                />
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">
          {isAdjusting ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelAdjustment}
              >
                <X size={18} />
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                variant="instagram"
                className="flex-1"
                onClick={handleConfirmAdjustment}
              >
                <Check size={18} />
                {t('btn_confirm') || 'Apply'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsAdjusting(true)}
                  disabled={isProcessing}
                >
                  <Move size={18} />
                  {t('smart_crop_adjust') || 'Adjust'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onRetry}
                  disabled={isProcessing}
                >
                  <RotateCcw size={18} />
                  {t('retry') || 'Retry'}
                </Button>
              </div>
              <Button
                variant="instagram"
                className="w-full h-12"
                onClick={onConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('loading') || 'Processing...'}
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    {t('smart_crop_confirm') || 'Use this image'}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartCropPreview;
