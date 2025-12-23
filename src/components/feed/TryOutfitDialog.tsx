import { useState, useEffect } from 'react';
import { X, RefreshCw, Download, Share2, Bookmark, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { AIProgressBar } from '@/components/tryOn/AIProgressBar';
import { ClothingItemsGrid } from './ClothingItemsGrid';
import { ShareToPublicDialog } from '@/components/outfit/ShareToPublicDialog';
import { LoginRequiredDialog } from '@/components/auth/LoginRequiredDialog';
import { useOutfitTryOn, SharedOutfit } from '@/hooks/useOutfitTryOn';
import { useTryOnHistory } from '@/hooks/useTryOnHistory';
import { useAuth } from '@/contexts/AuthContext';

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

  const [step, setStep] = useState<DialogStep>('select-body');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'share' | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('select-body');
      setIsSaved(false);
      setShowLoginDialog(false);
      setPendingAction(null);
      clearResult();
    }
  }, [open, clearResult]);

  // Handle pending action after user logs in
  // Requirements 4.4, 5.4: Redirect to action after successful login
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction === 'save') {
        handleSaveInternal();
      } else if (pendingAction === 'share') {
        setShowShareDialog(true);
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
      
      // Save with source outfit reference (Requirements 4.2)
      const saved = await saveTryOnResult(
        user.id,
        bodyImage,
        result.resultImageUrl,
        clothingItemsData,
        outfit.id // Pass source outfit ID
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
   * Opens the share dialog
   * Requirements 5.4: Prompt user to log in before sharing if not logged in
   */
  const handleShare = () => {
    // Requirements 5.4: IF the user is not logged in THEN prompt to log in before sharing
    if (!user) {
      setPendingAction('share');
      setShowLoginDialog(true);
      return;
    }
    
    setShowShareDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {step === 'select-body' && 'Mặc thử outfit'}
                {step === 'processing' && 'Đang xử lý...'}
                {step === 'result' && 'Kết quả thử đồ'}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClose}
              >
                <X size={18} />
              </Button>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Step 1: Select body image */}
            {step === 'select-body' && (
              <>
                {/* Outfit preview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Outfit sẽ mặc thử
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
                        {outfit.clothing_items?.length || 0} món đồ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clothing items preview */}
                {outfit.clothing_items && outfit.clothing_items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Các món đồ trong outfit
                    </h3>
                    <ClothingItemsGrid
                      items={outfit.clothing_items}
                      showShopLinks={false}
                    />
                  </div>
                )}

                {/* Body image selector */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Chọn ảnh toàn thân của bạn
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
                  Bắt đầu mặc thử
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
                    alt="Kết quả thử đồ"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleRetry}
                  >
                    <RefreshCw size={16} />
                    Thử lại
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownload}
                  >
                    <Download size={16} />
                    Tải về
                  </Button>
                  <Button
                    variant={isSaved ? "secondary" : "default"}
                    className="gap-2"
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                  >
                    {isSaved ? (
                      <>
                        <Check size={16} />
                        Đã lưu
                      </>
                    ) : (
                      <>
                        <Bookmark size={16} />
                        {isSaving ? 'Đang lưu...' : 'Lưu'}
                      </>
                    )}
                  </Button>
                  {/* Share button - Requirements 5.1, 5.2, 5.4 */}
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleShare}
                  >
                    <Share2 size={16} />
                    Chia sẻ
                  </Button>
                </div>

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
                    <p className="text-xs text-muted-foreground">Outfit gốc</p>
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

      {/* Share to Public Dialog - Requirements 5.1, 5.2 */}
      {result && (
        <ShareToPublicDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          resultImageUrl={result.resultImageUrl}
          clothingItems={result.clothingItems.map(item => ({
            name: item.name,
            imageUrl: item.imageUrl,
          }))}
          inspiredByOutfitId={outfit.id}
          onSuccess={() => {
            setShowShareDialog(false);
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
        title={pendingAction === 'save' ? 'Đăng nhập để lưu' : 'Đăng nhập để chia sẻ'}
        description={
          pendingAction === 'save'
            ? 'Bạn cần đăng nhập để lưu kết quả thử đồ vào lịch sử của mình.'
            : 'Bạn cần đăng nhập để chia sẻ outfit lên cộng đồng.'
        }
      />
    </>
  );
};
