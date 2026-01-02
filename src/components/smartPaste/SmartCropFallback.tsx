import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, Move, X, Loader2, Crop, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SmartCropFallbackProps {
  originalImage: string;
  errorMessage?: string;
  onConfirm: (bounds: CropBounds) => void;
  onCancel: () => void;
  onUseFullImage: () => void;
  isProcessing?: boolean;
}

/**
 * Manual crop fallback component when AI detection fails
 * Allows user to manually select the crop area
 * 
 * @requirements REQ-5.5, REQ-10.2
 */
export function SmartCropFallback({
  originalImage,
  errorMessage,
  onConfirm,
  onCancel,
  onUseFullImage,
  isProcessing = false,
}: SmartCropFallbackProps) {
  const { t } = useLanguage();
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [cropBounds, setCropBounds] = useState<CropBounds>({ x: 10, y: 10, width: 80, height: 80 });
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
      // Set initial crop to center 80% of image
      setCropBounds({ x: 10, y: 10, width: 80, height: 80 });
    };
    img.src = originalImage;
  }, [originalImage]);

  // Calculate scale factor for displaying crop overlay
  const getScaleFactor = useCallback(() => {
    if (!imageRef.current || originalDimensions.width === 0) return 1;
    return imageRef.current.clientWidth / originalDimensions.width;
  }, [originalDimensions.width]);

  // Convert percentage bounds to pixel display coordinates
  const getDisplayBounds = useCallback(() => {
    if (!imageRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    const imgWidth = imageRef.current.clientWidth;
    const imgHeight = imageRef.current.clientHeight;
    return {
      x: (cropBounds.x / 100) * imgWidth,
      y: (cropBounds.y / 100) * imgHeight,
      width: (cropBounds.width / 100) * imgWidth,
      height: (cropBounds.height / 100) * imgHeight,
    };
  }, [cropBounds]);

  // Handle mouse/touch events for adjustment
  const handlePointerDown = useCallback((e: React.PointerEvent, type: typeof dragType.current) => {
    e.preventDefault();
    isDragging.current = true;
    dragType.current = type;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !dragType.current || !imageRef.current) return;
    
    const imgWidth = imageRef.current.clientWidth;
    const imgHeight = imageRef.current.clientHeight;
    
    // Convert pixel movement to percentage
    const dx = ((e.clientX - dragStart.current.x) / imgWidth) * 100;
    const dy = ((e.clientY - dragStart.current.y) / imgHeight) * 100;
    dragStart.current = { x: e.clientX, y: e.clientY };

    setCropBounds(prev => {
      const newBounds = { ...prev };
      const minSize = 10; // Minimum 10% of image

      switch (dragType.current) {
        case 'move':
          newBounds.x = Math.max(0, Math.min(100 - prev.width, prev.x + dx));
          newBounds.y = Math.max(0, Math.min(100 - prev.height, prev.y + dy));
          break;
        case 'resize-nw':
          newBounds.x = Math.max(0, prev.x + dx);
          newBounds.y = Math.max(0, prev.y + dy);
          newBounds.width = Math.max(minSize, prev.width - dx);
          newBounds.height = Math.max(minSize, prev.height - dy);
          break;
        case 'resize-ne':
          newBounds.y = Math.max(0, prev.y + dy);
          newBounds.width = Math.max(minSize, Math.min(100 - prev.x, prev.width + dx));
          newBounds.height = Math.max(minSize, prev.height - dy);
          break;
        case 'resize-sw':
          newBounds.x = Math.max(0, prev.x + dx);
          newBounds.width = Math.max(minSize, prev.width - dx);
          newBounds.height = Math.max(minSize, Math.min(100 - prev.y, prev.height + dy));
          break;
        case 'resize-se':
          newBounds.width = Math.max(minSize, Math.min(100 - prev.x, prev.width + dx));
          newBounds.height = Math.max(minSize, Math.min(100 - prev.y, prev.height + dy));
          break;
      }

      return newBounds;
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    dragType.current = null;
  }, []);

  const handleConfirm = () => {
    onConfirm(cropBounds);
  };

  const displayBounds = getDisplayBounds();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crop size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {t('smart_crop_manual_title') || 'Manual Crop'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={isProcessing}
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-destructive font-medium">
                {t('smart_crop_ai_failed') || 'AI detection failed'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {t('smart_crop_manual_hint') || 'Drag the corners to select the clothing area, or use the full image'}
        </p>

        {/* Crop Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div 
            ref={containerRef}
            className="h-full relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center"
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
            {originalDimensions.width > 0 && imageRef.current && (
              <>
                {/* Darkened area outside crop */}
                <div 
                  className="absolute inset-0 pointer-events-none bg-black/50"
                  style={{
                    clipPath: `polygon(
                      0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                      ${displayBounds.x}px ${displayBounds.y}px,
                      ${displayBounds.x}px ${displayBounds.y + displayBounds.height}px,
                      ${displayBounds.x + displayBounds.width}px ${displayBounds.y + displayBounds.height}px,
                      ${displayBounds.x + displayBounds.width}px ${displayBounds.y}px,
                      ${displayBounds.x}px ${displayBounds.y}px
                    )`,
                  }}
                />
                
                {/* Crop area highlight */}
                <div
                  className="absolute border-2 border-primary border-dashed rounded-lg cursor-move"
                  style={{
                    left: displayBounds.x,
                    top: displayBounds.y,
                    width: displayBounds.width,
                    height: displayBounds.height,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Resize handles */}
                  <div
                    className="absolute -top-2 -left-2 w-5 h-5 bg-primary rounded-full cursor-nw-resize border-2 border-background"
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-nw'); }}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full cursor-ne-resize border-2 border-background"
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-ne'); }}
                  />
                  <div
                    className="absolute -bottom-2 -left-2 w-5 h-5 bg-primary rounded-full cursor-sw-resize border-2 border-background"
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-sw'); }}
                  />
                  <div
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full cursor-se-resize border-2 border-background"
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-se'); }}
                  />
                  
                  {/* Move indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-primary/80 rounded-full p-2">
                      <Move size={16} className="text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onUseFullImage}
              disabled={isProcessing}
            >
              {t('smart_crop_use_full') || 'Use Full Image'}
            </Button>
            <Button
              variant="instagram"
              className="flex-1"
              onClick={handleConfirm}
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
                  {t('smart_crop_confirm') || 'Use this area'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartCropFallback;
