import { useEffect, useState } from 'react';
import { X, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { DetectedLink } from '@/hooks/useClipboardDetection';

interface ClipboardLinkToastProps {
  detectedLink: DetectedLink;
  onTryNow: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  autoDismissMs?: number;
}

/**
 * Toast component that appears when a shopping link is detected in clipboard
 * 
 * @requirements REQ-1.3, REQ-1.4
 */
export function ClipboardLinkToast({
  detectedLink,
  onTryNow,
  onDismiss,
  isLoading = false,
  autoDismissMs = 15000,
}: ClipboardLinkToastProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss countdown
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [autoDismissMs, onDismiss]);

  const handleTryNow = () => {
    if (!isLoading) {
      onTryNow();
    }
  };

  // Format title with platform name
  const title = (t('clipboard_detected_title') || 'Detected {platform} link')
    .replace('{platform}', detectedLink.platformName);

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto',
        'transition-all duration-300 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{detectedLink.platformIcon}</span>
              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  {title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {t('clipboard_detected_desc') || 'Would you like to try this item?'}
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>

          {/* URL preview */}
          <div className="mb-3 px-3 py-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground truncate font-mono">
              {detectedLink.url}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDismiss}
              disabled={isLoading}
            >
              {t('clipboard_dismiss') || 'Dismiss'}
            </Button>
            <Button
              variant="instagram"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleTryNow}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t('loading') || 'Loading...'}
                </>
              ) : (
                <>
                  <Zap size={14} className="fill-current" />
                  {t('clipboard_try_now') || '⚡ Try Now'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClipboardLinkToast;
