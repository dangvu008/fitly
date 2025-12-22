import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TryOnResult {
  success: boolean;
  generatedImage?: string;
  message?: string;
  error?: string;
}

export interface TryOnProgress {
  stage: 'idle' | 'compressing' | 'uploading' | 'processing' | 'generating' | 'complete' | 'error' | 'cancelled';
  progress: number;
  message: string;
}

export const useAITryOn = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [progress, setProgress] = useState<TryOnProgress>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateProgress = useCallback((stage: TryOnProgress['stage'], progressValue: number, message: string) => {
    setProgress({ stage, progress: progressValue, message });
  }, []);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsProcessing(false);
    updateProgress('cancelled', 0, 'Đã hủy xử lý');
    toast.info('Đã hủy xử lý thử đồ');
  }, [updateProgress]);

  const processVirtualTryOn = async (
    bodyImage: string,
    clothingItems: Array<{ imageUrl: string; name: string }>
  ): Promise<TryOnResult | null> => {
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setIsProcessing(true);
    setResult(null);
    updateProgress('uploading', 10, 'Đang gửi dữ liệu...');

    try {
      console.log('Starting AI virtual try-on with', clothingItems.length, 'items...');
      
      updateProgress('processing', 30, 'Đang kết nối AI...');
      
      // Simulate progress during API call
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev.stage === 'processing' && prev.progress < 70) {
            return { ...prev, progress: prev.progress + 5, message: 'AI đang phân tích hình ảnh...' };
          }
          if (prev.stage === 'generating' && prev.progress < 95) {
            return { ...prev, progress: prev.progress + 2, message: 'Đang tạo hình ảnh kết quả...' };
          }
          return prev;
        });
      }, 800);

      updateProgress('processing', 40, 'AI đang phân tích hình ảnh...');

      const { data, error } = await supabase.functions.invoke('virtual-try-on', {
        body: {
          bodyImage,
          clothingItems,
        },
      });

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }

      if (error) {
        console.error('Function error:', error);
        updateProgress('error', 0, 'Lỗi kết nối');
        toast.error(error.message || 'Không thể xử lý hình ảnh');
        return null;
      }

      if (data.error) {
        console.error('API error:', data.error);
        updateProgress('error', 0, data.error);
        toast.error(data.error);
        return { success: false, error: data.error };
      }

      updateProgress('complete', 100, 'Hoàn thành!');

      const tryOnResult: TryOnResult = {
        success: true,
        generatedImage: data.generatedImage,
        message: data.message,
      };

      setResult(tryOnResult);
      toast.success('Đã tạo hình ảnh thử đồ thành công!');
      return tryOnResult;

    } catch (error) {
      // Clear progress interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Don't show error if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }
      
      console.error('Error processing virtual try-on:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
      updateProgress('error', 0, errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const clearResult = () => {
    setResult(null);
    setProgress({ stage: 'idle', progress: 0, message: '' });
  };

  const resetProgress = useCallback(() => {
    setProgress({ stage: 'idle', progress: 0, message: '' });
  }, []);

  return {
    processVirtualTryOn,
    isProcessing,
    result,
    progress,
    updateProgress,
    clearResult,
    resetProgress,
    cancelProcessing,
  };
};
