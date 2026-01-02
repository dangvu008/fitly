import { useState, useCallback, useRef } from 'react';
import { useClipboardDetection, DetectedLink } from './useClipboardDetection';
import { useUserGems } from './useUserGems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CrawledProduct {
  imageUrl: string;
  productName?: string;
  productPrice?: string;
  platform: string;
}

export interface CrawlError {
  type: 'network' | 'timeout' | 'unsupported' | 'no_image' | 'rate_limit' | 'unknown';
  message: string;
  url: string;
  canRetry: boolean;
}

export interface SmartPasteState {
  // Clipboard detection
  detectedLink: DetectedLink | null;
  isCheckingClipboard: boolean;
  
  // Crawling
  isCrawling: boolean;
  crawledProduct: CrawledProduct | null;
  crawlError: CrawlError | null;
  
  // Settings
  isClipboardEnabled: boolean;
  
  // Gem gate
  showGemGate: boolean;
  hasSufficientGems: boolean;
}

/** Default gem cost for smart paste try-on */
export const SMART_PASTE_GEM_COST = 1;

/**
 * Main orchestration hook for Smart Paste & Auto-Try feature
 * 
 * Handles:
 * - Clipboard detection for shopping links
 * - Product image crawling from URLs
 * - Navigation to TryOnPage with garment
 * - Error handling with retry and fallback options
 * - Gem balance checking before processing (REQ-11.1, REQ-11.2)
 * 
 * @requirements REQ-1.1, REQ-2.1, REQ-3.1, REQ-10.1, REQ-10.2, REQ-11.1, REQ-11.2
 */
export function useSmartPaste() {
  const { t } = useLanguage();
  const {
    detectedLink,
    isChecking: isCheckingClipboard,
    isEnabled: isClipboardEnabled,
    dismissLink,
    clearLink,
    setEnabled: setClipboardEnabled,
    markAsProcessed,
    checkClipboard,
  } = useClipboardDetection();

  // Gem balance hook
  const { balance: gemBalance, hasEnoughGems, isLoading: isLoadingGems } = useUserGems();

  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledProduct, setCrawledProduct] = useState<CrawledProduct | null>(null);
  const [crawlError, setCrawlError] = useState<CrawlError | null>(null);
  
  // Gem gate state
  const [showGemGate, setShowGemGate] = useState(false);
  
  // Pending action when gem gate is shown
  const pendingActionRef = useRef<{
    type: 'link' | 'screenshot';
    link?: DetectedLink;
    imageUrl?: string;
    onSuccess: (garmentUrl: string, garmentId?: string) => void;
    onError?: (error: CrawlError) => void;
  } | null>(null);
  
  // Track retry attempts
  const retryCountRef = useRef<Map<string, number>>(new Map());
  const MAX_RETRIES = 3;

  /**
   * Check if user has sufficient gems for smart paste operation
   * @requirements REQ-11.1
   */
  const hasSufficientGems = hasEnoughGems(SMART_PASTE_GEM_COST);

  /**
   * Parse error message to determine error type
   */
  const parseErrorType = useCallback((errorMessage: string): CrawlError['type'] => {
    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return 'timeout';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return 'network';
    }
    if (lowerMessage.includes('not supported') || lowerMessage.includes('unsupported')) {
      return 'unsupported';
    }
    if (lowerMessage.includes('no product image') || lowerMessage.includes('no image') || lowerMessage.includes('not found')) {
      return 'no_image';
    }
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
      return 'rate_limit';
    }
    return 'unknown';
  }, []);

  /**
   * Get user-friendly error message based on error type
   */
  const getErrorMessage = useCallback((type: CrawlError['type']): string => {
    switch (type) {
      case 'timeout':
        return t('crawl_error_timeout') || 'Request timed out. Please try again.';
      case 'network':
        return t('crawl_error_network') || 'Network error. Please check your connection.';
      case 'unsupported':
        return t('crawl_unsupported') || 'This platform is not supported yet.';
      case 'no_image':
        return t('crawl_error_no_image') || 'Could not find product image on this page.';
      case 'rate_limit':
        return t('crawl_error_rate_limit') || 'Too many requests. Please wait a moment.';
      default:
        return t('crawl_error') || 'Could not load product image. Please try again.';
    }
  }, [t]);

  /**
   * Check if error type allows retry
   */
  const canRetryError = useCallback((type: CrawlError['type']): boolean => {
    // Don't retry unsupported platforms
    return type !== 'unsupported';
  }, []);

  /**
   * Crawl product image from URL with retry support
   * @param url - The product URL to crawl
   * @param removeBackground - Whether to remove background from the product image (default: true)
   * @param isRetry - Whether this is a retry attempt
   */
  const crawlProductImage = useCallback(async (
    url: string, 
    removeBackground: boolean = true,
    isRetry: boolean = false
  ): Promise<CrawledProduct | null> => {
    setIsCrawling(true);
    setCrawlError(null);
    setCrawledProduct(null);

    // Track retry count
    const currentRetries = retryCountRef.current.get(url) || 0;
    if (isRetry) {
      retryCountRef.current.set(url, currentRetries + 1);
    } else {
      retryCountRef.current.set(url, 0);
    }

    try {
      // Call edge function to crawl product with optional background removal
      const { data, error } = await supabase.functions.invoke('crawl-product-image', {
        body: { url, removeBackground },
      });

      if (error) {
        throw new Error(error.message || 'Crawl failed');
      }

      if (!data?.success || !data?.productImage) {
        throw new Error(data?.error || 'No product image found');
      }

      // Use background-removed image if available, otherwise use original
      const product: CrawledProduct = {
        imageUrl: data.backgroundRemovedImage || data.productImage,
        productName: data.productName,
        productPrice: data.productPrice,
        platform: data.platform,
      };

      setCrawledProduct(product);
      // Clear retry count on success
      retryCountRef.current.delete(url);
      return product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useSmartPaste] Crawl error:', errorMessage);
      
      const errorType = parseErrorType(errorMessage);
      const canRetry = canRetryError(errorType) && (retryCountRef.current.get(url) || 0) < MAX_RETRIES;
      
      const crawlErr: CrawlError = {
        type: errorType,
        message: getErrorMessage(errorType),
        url,
        canRetry,
      };
      
      setCrawlError(crawlErr);
      
      // Don't show toast here - let the component handle it with retry option
      return null;
    } finally {
      setIsCrawling(false);
    }
  }, [parseErrorType, getErrorMessage, canRetryError]);

  /**
   * Retry crawling the last failed URL
   */
  const retryCrawl = useCallback(async (): Promise<CrawledProduct | null> => {
    if (!crawlError?.url) {
      return null;
    }
    return crawlProductImage(crawlError.url, true, true);
  }, [crawlError, crawlProductImage]);

  /**
   * Clear crawl error state
   */
  const clearCrawlError = useCallback(() => {
    setCrawlError(null);
  }, []);

  /**
   * Handle "Try Now" action from clipboard toast
   * Returns the garment URL if successful
   * Checks gem balance before processing (REQ-11.1, REQ-11.2)
   */
  const handleTryFromLink = useCallback(async (
    link: DetectedLink,
    onSuccess: (garmentUrl: string, garmentId?: string) => void,
    onError?: (error: CrawlError) => void
  ): Promise<void> => {
    // Check gem balance before processing (REQ-11.1)
    if (!hasSufficientGems) {
      // Store pending action and show gem gate (REQ-11.2)
      pendingActionRef.current = {
        type: 'link',
        link,
        onSuccess,
        onError,
      };
      setShowGemGate(true);
      return;
    }

    const product = await crawlProductImage(link.url);
    
    if (product?.imageUrl) {
      // Mark link as processed
      markAsProcessed(link.url);
      
      // Trigger navigation to TryOnPage
      onSuccess(product.imageUrl, undefined);
    } else if (crawlError && onError) {
      onError(crawlError);
    }
  }, [crawlProductImage, markAsProcessed, crawlError, hasSufficientGems]);

  /**
   * Process a screenshot/image for smart crop
   * Checks gem balance before processing (REQ-11.1, REQ-11.2)
   * For MVP, we'll skip smart crop and use the image directly
   */
  const processScreenshot = useCallback(async (
    imageUrl: string,
    onSuccess?: (garmentUrl: string) => void
  ): Promise<string | null> => {
    // Check gem balance before processing (REQ-11.1)
    if (!hasSufficientGems) {
      // Store pending action and show gem gate (REQ-11.2)
      if (onSuccess) {
        pendingActionRef.current = {
          type: 'screenshot',
          imageUrl,
          onSuccess,
        };
      }
      setShowGemGate(true);
      return null;
    }

    // TODO: Implement smart crop edge function
    // For now, return the image as-is
    return imageUrl;
  }, [hasSufficientGems]);

  /**
   * Close gem gate dialog
   */
  const closeGemGate = useCallback(() => {
    setShowGemGate(false);
    pendingActionRef.current = null;
  }, []);

  /**
   * Handle gem gate proceed - called when user has sufficient gems after watching ad or purchasing
   */
  const onGemGateProceed = useCallback(async () => {
    setShowGemGate(false);
    
    const pendingAction = pendingActionRef.current;
    if (!pendingAction) return;
    
    pendingActionRef.current = null;

    // Re-execute the pending action
    if (pendingAction.type === 'link' && pendingAction.link) {
      const product = await crawlProductImage(pendingAction.link.url);
      
      if (product?.imageUrl) {
        markAsProcessed(pendingAction.link.url);
        pendingAction.onSuccess(product.imageUrl, undefined);
      } else if (crawlError && pendingAction.onError) {
        pendingAction.onError(crawlError);
      }
    } else if (pendingAction.type === 'screenshot' && pendingAction.imageUrl) {
      // For screenshot, just pass through the image
      pendingAction.onSuccess(pendingAction.imageUrl, undefined);
    }
  }, [crawlProductImage, markAsProcessed, crawlError]);

  /**
   * Handle watch ad action from gem gate
   */
  const onWatchAd = useCallback(async () => {
    // TODO: Integrate with ad provider
    // For now, just log and close
    console.log('[useSmartPaste] Watch ad not yet implemented');
    toast.info('Feature coming soon');
  }, []);

  /**
   * Handle purchase gems action from gem gate
   */
  const onPurchaseGems = useCallback(() => {
    // This will be handled by the parent component opening GemsPurchaseDialog
    // Just close the gem gate
    setShowGemGate(false);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    clearLink();
    setCrawledProduct(null);
    setCrawlError(null);
    setShowGemGate(false);
    pendingActionRef.current = null;
    retryCountRef.current.clear();
  }, [clearLink]);

  return {
    // Clipboard detection state
    detectedLink,
    isCheckingClipboard,
    isClipboardEnabled,
    
    // Crawling state
    isCrawling,
    crawledProduct,
    crawlError,
    
    // Gem gate state (REQ-11.1, REQ-11.2)
    showGemGate,
    hasSufficientGems,
    gemBalance,
    isLoadingGems,
    gemCost: SMART_PASTE_GEM_COST,
    
    // Actions
    checkClipboard,
    dismissLink,
    clearLink,
    setClipboardEnabled,
    crawlProductImage,
    handleTryFromLink,
    processScreenshot,
    reset,
    
    // Error handling
    retryCrawl,
    clearCrawlError,
    
    // Gem gate actions (REQ-11.2)
    closeGemGate,
    onGemGateProceed,
    onWatchAd,
    onPurchaseGems,
  };
}
