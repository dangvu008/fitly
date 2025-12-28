import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Download,
  Share2,
  Bookmark,
  Check,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { AIProgressBar } from '@/components/tryOn/AIProgressBar';
import { ClothingItemsGrid } from './ClothingItemsGrid';
import { ShareResultDialog } from '@/components/outfit/ShareResultDialog';
import { ShareToPublicDialog } from '@/components/outfit/ShareToPublicDialog';
import { LoginRequiredDialog } from '@/components/auth/LoginRequiredDialog';
import { useOutfitTryOn, SharedOutfit, ClothingItemInfo } from '@/hooks/useOutfitTryOn';
import { useTryOnHistory } from '@/hooks/useTryOnHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useOutfitAnalysis } from '@/hooks/useOutfitAnalysis';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TryOutfitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outfit: SharedOutfit;
  onSuccess?: (resultImageUrl: string) => void;
}

type DialogStep = 'select-body' | 'processing' | 'result';

/**
 * TryOutfitDialog - Dialog for trying on a complete outfit from the feed
 * 
 * Flow:
 * 1. User selects/uploads body image (reuses TryOnCanvas)
 * 2. Shows outfit preview with clothing items
 * 3. User confirms to start try-on
 * 4. Shows progress during AI processing
 * 5. Displays result with save/share options
 * 
 * Requirements: 1.2, 1.4, 1.5, 1.6
 */
export const TryOutfitDialog = ({
  open,
  onOpenChange,
  outfit,
  onSuccess,
}: TryOutfitDialogProps) => {
  const {
    startTryOn,
    isProcessing,
    progress,
    result,
    error,
    bodyImage,
    setBodyImage,
    clearResult,
    cancelProcessing,
  } = useOutfitTryOn();

  const { saveTryOnResult } = useTryOnHistory();
  const { user } = useAuth();
  const { analyzeOutfit, isAnalyzing, analyzedItems } = useOutfitAnalysis();
  const { t } = useLanguage();

  const [step, setStep] = useState<DialogStep>('select-body');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareToFeedDialog, setShowShareToFeedDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'share' | null>(null);
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());
  
  // Use AI-analyzed items if available, otherwise fall back to database items
  const allItems: ClothingItemInfo[] = analyzedItems.length > 0 
    ? analyzedItems 
    : outfit.clothing_items || [];
  
  // Filter out excluded items
  const displayItems = allItems.filter((_, index) => !excludedIndices.has(index));

  // Reset state when dialog opens and trigger AI analysis
  useEffect(() => {
    if (open) {
      setStep('select-body');
      setIsSaved(false);
      setShowLoginDialog(false);
      setPendingAction(null);
      setExcludedIndices(new Set());
      clearResult();
      
      // Analyze outfit image with AI to get accurate clothing items
      analyzeOutfit(outfit.result_image_url);
    }
  }, [open, clearResult, analyzeOutfit, outfit.result_image_url]);

  // Handle pending action after user logs in
  // Requirements 4.4, 5.4: Redirect to action after successful login
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction === 'save') {
        handleSaveInternal();
      } else if (pendingAction === 'share') {
        setShowShareToFeedDialog(true);
      }
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  // Update step based on processing state
  useEffect(() => {
    if (isProcessing) {
      setStep('processing');
    } else if (result) {
      setStep('result');
      onSuccess?.(result.resultImageUrl);
    }
  }, [isProcessing, result, onSuccess]);

  const handleStartTryOn = async () => {
    if (!bodyImage) return;
    await startTryOn(outfit);
  };

  const handleRetry = () => {
    setStep('select-body');
    clearResult();
  };

  const handleRemoveItem = (index: number) => {
    // Find the actual index in allItems based on current displayItems index
    let actualIndex = -1;
    let displayIndex = 0;
    for (let i = 0; i < allItems.length; i++) {
      if (!excludedIndices.has(i)) {
        if (displayIndex === index) {
          actualIndex = i;
          break;
        }
        displayIndex++;
      }
    }
    if (actualIndex !== -1) {
      setExcludedIndices(prev => new Set([...prev, actualIndex]));
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      cancelProcessing();
    }
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (!result?.resultImageUrl) return;
    
    const link = document.createElement('a');
    link.href = result.resultImageUrl;
    link.download = `outfit-tryon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Internal save function that performs the actual save operation
   * Called directly when user is logged in, or after login via pendingAction
   */
  const handleSaveInternal = async () => {
    if (!result || !bodyImage || !user) return;
    
    setIsSaving(true);
    try {
      const clothingItemsData = result.clothingItems.map(item => ({
        name: item.name,
        imageUrl: item.imageUrl,
      }));
      
      // Save try-on result
      const saved = await saveTryOnResult(
        user.id,
        bodyImage,
        result.resultImageUrl,
        clothingItemsData
      );
      
      if (saved) {
        setIsSaved(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Saves the try-on result to history with source outfit reference
   * Requirements 4.2: Store result with reference to the original shared outfit
   * Requirements 4.4: Prompt user to log in before saving if not logged in
   */
  const handleSave = async () => {
    // Requirements 4.4: IF the user is not logged in THEN prompt to log in before saving
    if (!user) {
      setPendingAction('save');
      setShowLoginDialog(true);
      return;
    }
    
    await handleSaveInternal();
  };

  /**
   * Opens the share dialog for quick sharing (link/image)
   */
  const handleShare = () => {
    setShowShareDialog(true);
  };

  /**
   * Opens the share to feed dialog
   * Requirements 5.4: Prompt user to log in before sharing if not logged in
   */
  const handleShareToFeed = () => {
    if (!user) {
      setPendingAction('share');
      setShowLoginDialog(true);
      return;
    }
    setShowShareToFeedDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-semibold">
              {step === 'select-body' && t('feed_try_outfit')}
              {step === 'processing' && t('feed_processing')}
              {step === 'result' && t('feed_result')}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Step 1: Select body image */}
            {step === 'select-body' && (
              <>
                {/* Outfit preview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('feed_outfit_to_try')}
                  </h3>
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={outfit.result_image_url}
                        alt={outfit.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{outfit.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('feed_items_count').replace('{count}', String(outfit.clothing_items?.length || 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clothing items preview - using AI-analyzed items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('feed_items_in_outfit')}
                  </h3>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t('feed_analyzing_outfit')}
                      </span>
                    </div>
                  ) : displayItems.length > 0 ? (
                    <ClothingItemsGrid
                      items={displayItems}
                      showShopLinks={false}
                      showRemoveButton={true}
                      onItemRemove={handleRemoveItem}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                      {t('feed_no_items_found')}
                    </p>
                  )}
                </div>

                {/* Body image selector */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('feed_select_body_photo')}
                  </h3>
                  <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden">
                    <TryOnCanvas
                      bodyImageUrl={bodyImage || undefined}
                      onBodyImageChange={setBodyImage}
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                    {error}
                  </div>
                )}

                {/* Start button */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!bodyImage}
                  onClick={handleStartTryOn}
                >
                  {t('feed_start_try_on')}
                </Button>
              </>
            )}

            {/* Step 2: Processing - handled by AIProgressBar overlay */}

            {/* Step 3: Result */}
            {step === 'result' && result && (
              <>
                {/* Result image */}
                <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden">
                  <img
                    src={result.resultImageUrl}
                    alt={t('feed_try_on_result')}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Action buttons - Icon only with tooltips */}
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center justify-center gap-3">
                    {/* Retry */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleRetry}
                          className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        >
                          <RefreshCw size={20} className="text-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('retry')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Download */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleDownload}
                          className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        >
                          <Download size={20} className="text-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('download')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Save */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleSave}
                          disabled={isSaving || isSaved}
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95",
                            isSaved
                              ? "bg-green-500 text-white"
                              : "bg-primary text-primary-foreground hover:bg-primary/90",
                            (isSaving || isSaved) && "opacity-80 cursor-not-allowed"
                          )}
                        >
                          {isSaving ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : isSaved ? (
                            <Check size={20} />
                          ) : (
                            <Bookmark size={20} />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{isSaved ? t('feed_saved') : t('save')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Share */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleShare}
                          className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        >
                          <Share2 size={20} className="text-white" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('share')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                {/* Original outfit reference */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={outfit.result_image_url}
                      alt={outfit.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{t('feed_original_outfit')}</p>
                    <p className="text-sm font-medium truncate">{outfit.title}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress overlay */}
      <AIProgressBar
        progress={progress}
        isVisible={isProcessing}
        onCancel={cancelProcessing}
      />

      {/* Quick Share Dialog - share via link/image/social */}
      {result && (
        <ShareResultDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          imageUrl={result.resultImageUrl}
          title={outfit.title}
          onShareToFeed={handleShareToFeed}
        />
      )}

      {/* Share to Public Feed Dialog - Requirements 5.1, 5.2 */}
      {result && (
        <ShareToPublicDialog
          open={showShareToFeedDialog}
          onOpenChange={setShowShareToFeedDialog}
          resultImageUrl={result.resultImageUrl}
          clothingItems={result.clothingItems.map(item => ({
            name: item.name,
            imageUrl: item.imageUrl,
          }))}
          inspiredByOutfitId={outfit.id}
          onSuccess={() => {
            setShowShareToFeedDialog(false);
            handleClose();
          }}
        />
      )}

      {/* Login Required Dialog - Requirements 4.4, 5.4 */}
      <LoginRequiredDialog
        isOpen={showLoginDialog}
        onClose={() => {
          setShowLoginDialog(false);
          setPendingAction(null);
        }}
        title={pendingAction === 'save' ? t('login_to_save') : t('login_to_share')}
        description={
          pendingAction === 'save'
            ? t('login_to_save_desc')
            : t('login_to_share_desc')
        }
      />
    </>
  );
};
