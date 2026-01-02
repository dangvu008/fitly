import { useState } from 'react';
import { AlertCircle, RefreshCw, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { CrawlError } from '@/hooks/useSmartPaste';

interface CrawlErrorToastProps {
  error: CrawlError;
  onRetry: () => Promise<void>;
  onManualUpload: () => void;
  onDismiss: () => void;
  isRetrying?: boolean;
}

/**
 * Error toast component for crawl failures
 * Shows error message with retry and manual upload fallback options
 * 
 * @requirements REQ-10.1, REQ-10.2, REQ-10.3
 */
export function CrawlErrorToast({
  error,
  onRetry,
  onManualUpload,
  onDismiss,
  isRetrying = false,
}: CrawlErrorToastProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);

  const handleRetry = async () => {
    await onRetry();
  };

  const handleManualUpload = () => {
    onManualUpload();
    onDismiss();
  };

  // Get icon based on error type
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
      case 'timeout':
        return '🌐';
      case 'unsupported':
        return '🚫';
      case 'no_image':
        return '🖼️';
      case 'rate_limit':
        return '⏳';
      default:
        return '⚠️';
    }
  };

  // Get title based on error type
  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return t('crawl_error_title_network') || 'Connection Error';
      case 'timeout':
        return t('crawl_error_title_timeout') || 'Request Timeout';
      case 'unsupported':
        return t('crawl_error_title_unsupported') || 'Platform Not Supported';
      case 'no_image':
        return t('crawl_error_title_no_image') || 'Image Not Found';
      case 'rate_limit':
        return t('crawl_error_title_rate_limit') || 'Too Many Requests';
      default:
        return t('crawl_error_title') || 'Could Not Load Image';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto',
        'transition-all duration-300 ease-out',
        'translate-y-0 opacity-100'
      )}
    >
      <div className="bg-card border border-destructive/30 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getErrorIcon()}</span>
              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  {getErrorTitle()}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {error.message}
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
              {error.url}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {error.canRetry && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t('retrying') || 'Retrying...'}
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    {t('retry') || 'Retry'}
                  </>
                )}
              </Button>
            )}
            <Button
              variant="instagram"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleManualUpload}
              disabled={isRetrying}
            >
              <Upload size={14} />
              {t('crawl_manual_upload') || 'Upload Manually'}
            </Button>
          </div>

          {/* Hint text */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            {t('crawl_fallback_hint') || 'You can upload the product image directly instead'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CrawlErrorToast;
