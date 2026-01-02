import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface DetectedItem {
  type: string;
  confidence: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface MultipleItemsSelectorProps {
  originalImage: string;
  detectedItems: DetectedItem[];
  onSelect: (item: DetectedItem) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

/**
 * Component for selecting from multiple detected clothing items
 * Shows all detected items with visual indicators and allows user to choose one
 * 
 * @requirements REQ-5.5, REQ-10.2
 */
export function MultipleItemsSelector({
  originalImage,
  detectedItems,
  onSelect,
  onCancel,
  isProcessing = false,
}: MultipleItemsSelectorProps) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Get clothing type label
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      top: t('cat_top') || 'Top',
      bottom: t('cat_bottom') || 'Bottom',
      dress: t('cat_dress') || 'Dress',
      shoes: t('cat_shoes') || 'Shoes',
      accessory: t('cat_accessory') || 'Accessory',
      outerwear: t('smart_crop_outerwear') || 'Outerwear',
    };
    return labels[type] || type;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const handleConfirm = () => {
    if (selectedIndex !== null && detectedItems[selectedIndex]) {
      onSelect(detectedItems[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t('smart_crop_multiple_title') || 'Multiple Items Detected'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={isProcessing}
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Instructions */}
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {t('smart_crop_multiple_hint') || 'We found multiple clothing items. Please select the one you want to try on.'}
        </p>

        {/* Image with detected items overlay */}
        <div className="flex-1 min-h-0 overflow-hidden mb-4">
          <div className="h-full relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
            
            {/* Detected items overlays */}
            {detectedItems.map((item, index) => (
              <button
                key={index}
                className={cn(
                  "absolute border-2 rounded-lg transition-all cursor-pointer",
                  selectedIndex === index
                    ? "border-primary bg-primary/20 ring-2 ring-primary ring-offset-2"
                    : "border-muted-foreground/50 hover:border-primary/70 hover:bg-primary/10"
                )}
                style={{
                  left: `${item.bounds.x}%`,
                  top: `${item.bounds.y}%`,
                  width: `${item.bounds.width}%`,
                  height: `${item.bounds.height}%`,
                }}
                onClick={() => setSelectedIndex(index)}
                disabled={isProcessing}
              >
                {/* Item label */}
                <div className={cn(
                  "absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium",
                  selectedIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {getTypeLabel(item.type)}
                </div>
                
                {/* Selection indicator */}
                {selectedIndex === index && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check size={14} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div className="mb-4 space-y-2 max-h-32 overflow-y-auto">
          {detectedItems.map((item, index) => (
            <button
              key={index}
              className={cn(
                "w-full p-3 rounded-lg border transition-all flex items-center justify-between",
                selectedIndex === index
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setSelectedIndex(index)}
              disabled={isProcessing}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  selectedIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>
                <span className="font-medium">{getTypeLabel(item.type)}</span>
              </div>
              <span className={cn("text-sm", getConfidenceColor(item.confidence))}>
                {Math.round(item.confidence * 100)}%
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            variant="instagram"
            className="flex-1"
            onClick={handleConfirm}
            disabled={isProcessing || selectedIndex === null}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('loading') || 'Processing...'}
              </>
            ) : (
              <>
                <Check size={18} />
                {t('smart_crop_select') || 'Select'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MultipleItemsSelector;
