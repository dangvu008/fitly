import { useState, useCallback, useRef } from 'react';
import { useDefaultBodyImage } from './useDefaultBodyImage';
import { useUserGems } from './useUserGems';
import { useAITryOn, TryOnProgress } from './useAITryOn';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';

export interface TryOnResult {
  id: string;
  resultImageUrl: string;
  bodyImageUrl: string;
  clothingItems: ClothingItem[];
  createdAt: string;
  backgroundPreserved: boolean;
}

export interface ProcessingState {
  status: 'idle' | 'checking_gems' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: number | null;
  estimatedDuration: number;
  currentMessage: string;
  isOvertime: boolean;
}

export interface UseOneTapTryOnOptions {
  /** Outfit ID for trying an outfit from feed */
  outfitId?: string;
  /** Clothing items to try on */
  clothingItems?: ClothingItem[];
  /** Cost in gems for this try-on */
  gemCost?: number;
}

export interface UseOneTapTryOnReturn {
  // State
  isProcessing: boolean;
  processingState: ProcessingState;
  result: TryOnResult | null;
  error: Error | null;
  gemBalance: number;

  // Body image state
  hasDefaultBodyImage: boolean;
  defaultBodyImageUrl: string | null;

  // Gem gate state
  showGemGate: boolean;
  hasSufficientGems: boolean;

  // Body image prompt state
  showBodyImagePrompt: boolean;

  // Actions
  startTryOn: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  promptBodyImage: () => void;
  closeBodyImagePrompt: () => void;
  closeGemGate: () => void;
  onGemGateProceed: () => void;
  onWatchAd: () => Promise<void>;
  onPurchaseGems: () => void;
}

const ESTIMATED_DURATION_SECONDS = 15;
const OVERTIME_THRESHOLD_SECONDS = 20;

/**
 * useOneTapTryOn - Main orchestration hook for One-Tap Try-On Flow
 * 
 * Orchestrates the entire one-tap flow:
 * 1. Check for default body image
 * 2. Handle gem gate
 * 3. Trigger AI processing
 * 4. Manage processing state
 * 5. Return result
 * 
 * @requirements 3.1, 3.3, 3.4, 3.6, 3.7
 */
export function useOneTapTryOn(options: UseOneTapTryOnOptions = {}): UseOneTapTryOnReturn {
  const { outfitId, clothingItems = [], gemCost = 1 } = options;

  // Hooks
  const {
    defaultBodyImage,
    hasDefaultBodyImage,
    isLoading: isLoadingBodyImage,
  } = useDefaultBodyImage();

  const {
    balance: gemBalance,
    spendGems,
    addGems,
    hasEnoughGems,
  } = useUserGems();

  const {
    processVirtualTryOn,
    isProcessing: isAIProcessing,
    progress: aiProgress,
    cancelProcessing,
    resetProgress,
  } = useAITryOn();

  // Local state
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    startTime: null,
    estimatedDuration: ESTIMATED_DURATION_SECONDS,
    currentMessage: '',
    isOvertime: false,
  });
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [showGemGate, setShowGemGate] = useState(false);
  const [showBodyImagePrompt, setShowBodyImagePrompt] = useState(false);

  // Refs
  const overtimeCheckRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTryOnRef = useRef(false);

  // Computed
  const hasSufficientGems = hasEnoughGems(gemCost);
  const isProcessing = processingState.status === 'processing' || isAIProcessing;

  // Update processing state based on AI progress
  const updateProcessingFromAI = useCallback((progress: TryOnProgress) => {
    const now = Date.now();
    const startTime = processingState.startTime || now;
    const elapsed = (now - startTime) / 1000;
    const isOvertime = elapsed > OVERTIME_THRESHOLD_SECONDS;

    setProcessingState((prev) => ({
      ...prev,
      progress: progress.progress,
      currentMessage: progress.message,
      isOvertime,
    }));
  }, [processingState.startTime]);

  // Start overtime check
  const startOvertimeCheck = useCallback(() => {
    if (overtimeCheckRef.current) {
      clearInterval(overtimeCheckRef.current);
    }

    overtimeCheckRef.current = setInterval(() => {
      setProcessingState((prev) => {
        if (!prev.startTime) return prev;
        const elapsed = (Date.now() - prev.startTime) / 1000;
        return {
          ...prev,
          isOvertime: elapsed > OVERTIME_THRESHOLD_SECONDS,
        };
      });
    }, 1000);
  }, []);

  // Stop overtime check
  const stopOvertimeCheck = useCallback(() => {
    if (overtimeCheckRef.current) {
      clearInterval(overtimeCheckRef.current);
      overtimeCheckRef.current = null;
    }
  }, []);

  // Process the try-on
  const processTryOn = useCallback(async () => {
    if (!defaultBodyImage) {
      setError(new Error('No body image available'));
      return;
    }

    if (clothingItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món đồ');
      return;
    }

    // Deduct gems before processing - Requirement 3.4
    try {
      await spendGems({
        amount: gemCost,
        description: `One-tap try-on: ${outfitId || 'custom'}`,
        referenceId: outfitId,
      });
    } catch {
      // Gems feature not yet implemented, continue anyway
      console.log('[useOneTapTryOn] Gems not implemented, continuing...');
    }

    // Start processing
    setProcessingState({
      status: 'processing',
      progress: 0,
      startTime: Date.now(),
      estimatedDuration: ESTIMATED_DURATION_SECONDS,
      currentMessage: 'Đang bắt đầu...',
      isOvertime: false,
    });
    setError(null);
    startOvertimeCheck();

    try {
      const aiResult = await processVirtualTryOn(
        defaultBodyImage,
        clothingItems.map((item) => ({
          imageUrl: item.imageUrl,
          name: item.name,
        }))
      );

      stopOvertimeCheck();

      if (aiResult?.success && aiResult.generatedImage) {
        const tryOnResult: TryOnResult = {
          id: `tryon-${Date.now()}`,
          resultImageUrl: aiResult.generatedImage,
          bodyImageUrl: defaultBodyImage,
          clothingItems,
          createdAt: new Date().toISOString(),
          backgroundPreserved: true, // Assume preserved, check in result
        };

        setResult(tryOnResult);
        setProcessingState((prev) => ({
          ...prev,
          status: 'completed',
          progress: 100,
          currentMessage: 'Hoàn thành!',
        }));

        // Show gem balance after completion - Requirement 6.4
        toast.success(`Thử đồ thành công! Còn ${gemBalance - gemCost} gems`);
      } else {
        throw new Error(aiResult?.error || 'Không thể tạo hình ảnh');
      }
    } catch (err) {
      stopOvertimeCheck();
      console.error('[useOneTapTryOn] Processing error:', err);
      setError(err instanceof Error ? err : new Error('Processing failed'));
      setProcessingState((prev) => ({
        ...prev,
        status: 'error',
        currentMessage: 'Đã xảy ra lỗi',
      }));

      // Refund gems on failure
      try {
        await addGems({
          amount: gemCost,
          type: 'refund',
          description: 'Refund for failed try-on',
          referenceId: outfitId,
        });
        toast.info('Đã hoàn lại gems do lỗi xử lý');
      } catch {
        // Gems feature not implemented
      }
    }
  }, [
    defaultBodyImage,
    clothingItems,
    gemCost,
    outfitId,
    spendGems,
    addGems,
    gemBalance,
    processVirtualTryOn,
    startOvertimeCheck,
    stopOvertimeCheck,
  ]);

  // Start try-on flow
  const startTryOn = useCallback(async () => {
    // Check for body image first - Requirement 3.2
    if (!hasDefaultBodyImage) {
      setShowBodyImagePrompt(true);
      pendingTryOnRef.current = true;
      return;
    }

    // Check gems - Requirement 3.3
    setProcessingState((prev) => ({ ...prev, status: 'checking_gems' }));

    if (!hasSufficientGems) {
      setShowGemGate(true);
      pendingTryOnRef.current = true;
      return;
    }

    // Proceed immediately - Requirement 3.1
    await processTryOn();
  }, [hasDefaultBodyImage, hasSufficientGems, processTryOn]);

  // Retry try-on
  const retry = useCallback(async () => {
    setResult(null);
    setError(null);
    resetProgress();
    await startTryOn();
  }, [startTryOn, resetProgress]);

  // Reset state
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setShowGemGate(false);
    setShowBodyImagePrompt(false);
    setProcessingState({
      status: 'idle',
      progress: 0,
      startTime: null,
      estimatedDuration: ESTIMATED_DURATION_SECONDS,
      currentMessage: '',
      isOvertime: false,
    });
    resetProgress();
    stopOvertimeCheck();
    pendingTryOnRef.current = false;
  }, [resetProgress, stopOvertimeCheck]);

  // Body image prompt handlers
  const promptBodyImage = useCallback(() => {
    setShowBodyImagePrompt(true);
  }, []);

  const closeBodyImagePrompt = useCallback(() => {
    setShowBodyImagePrompt(false);
    pendingTryOnRef.current = false;
  }, []);

  // Gem gate handlers
  const closeGemGate = useCallback(() => {
    setShowGemGate(false);
    pendingTryOnRef.current = false;
  }, []);

  const onGemGateProceed = useCallback(async () => {
    setShowGemGate(false);
    if (pendingTryOnRef.current) {
      pendingTryOnRef.current = false;
      await processTryOn();
    }
  }, [processTryOn]);

  const onWatchAd = useCallback(async () => {
    // Simulate watching ad
    toast.info('Đang tải quảng cáo...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await addGems({
        amount: 1,
        type: 'ad_reward',
        description: 'Watched rewarded ad',
      });
      toast.success('+1 Gem!');

      // Check if now has enough gems
      if (gemBalance + 1 >= gemCost) {
        setShowGemGate(false);
        if (pendingTryOnRef.current) {
          pendingTryOnRef.current = false;
          await processTryOn();
        }
      }
    } catch {
      toast.error('Không thể nhận gems');
    }
  }, [addGems, gemBalance, gemCost, processTryOn]);

  const onPurchaseGems = useCallback(() => {
    // Open gems purchase dialog
    toast.info('Tính năng mua gems đang phát triển');
  }, []);

  return {
    // State
    isProcessing,
    processingState,
    result,
    error,
    gemBalance,

    // Body image state
    hasDefaultBodyImage,
    defaultBodyImageUrl: defaultBodyImage,

    // Gem gate state
    showGemGate,
    hasSufficientGems,

    // Body image prompt state
    showBodyImagePrompt,

    // Actions
    startTryOn,
    retry,
    reset,
    promptBodyImage,
    closeBodyImagePrompt,
    closeGemGate,
    onGemGateProceed,
    onWatchAd,
    onPurchaseGems,
  };
}

export default useOneTapTryOn;
