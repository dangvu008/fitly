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
  stage: 'idle' | 'compressing' | 'uploading' | 'scanning' | 'processing' | 'warping' | 'generating' | 'finalizing' | 'complete' | 'error' | 'cancelled' | 'timeout';
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
    const startTime = Date.now();
    
    setIsProcessing(true);
    setResult(null);
    updateProgress('uploading', 5, 'Đang gửi dữ liệu...');

    try {
      console.log('Starting AI virtual try-on with', clothingItems.length, 'items...');
      
      updateProgress('scanning', 15, 'Scanning Body...');
      
      // Simulate progress during API call with new stages
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        setProgress(prev => {
          // Timeout handling after 30 seconds
          if (elapsed > 30000 && prev.stage !== 'timeout' && prev.stage !== 'complete' && prev.stage !== 'error') {
            return { stage: 'timeout', progress: prev.progress, message: 'Vẫn đang xử lý...' };
          }
          
          // Progress through stages
          if (prev.stage === 'scanning' && prev.progress < 30) {
            return { ...prev, progress: prev.progress + 3, message: 'Đang quét cơ thể...' };
          }
          if (prev.stage === 'scanning' && prev.progress >= 30) {
            return { stage: 'warping', progress: 35, message: 'Warping Cloth...' };
          }
          if (prev.stage === 'warping' && prev.progress < 60) {
            return { ...prev, progress: prev.progress + 4, message: 'Đang điều chỉnh quần áo...' };
          }
          if (prev.stage === 'warping' && prev.progress >= 60) {
            return { stage: 'generating', progress: 65, message: 'Đang tạo hình ảnh...' };
          }
          if (prev.stage === 'generating' && prev.progress < 85) {
            return { ...prev, progress: prev.progress + 3, message: 'AI đang tạo hình ảnh...' };
          }
          if (prev.stage === 'generating' && prev.progress >= 85) {
            return { stage: 'finalizing', progress: 88, message: 'Finalizing...' };
          }
          if (prev.stage === 'finalizing' && prev.progress < 95) {
            return { ...prev, progress: prev.progress + 1, message: 'Đang hoàn thiện...' };
          }
          if (prev.stage === 'timeout' && prev.progress < 98) {
            return { ...prev, progress: prev.progress + 0.5, message: 'Vẫn đang xử lý, xin đợi...' };
          }
          return prev;
        });
      }, 600);

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

      const generatedImage = data.generatedImage;
      console.log('Try-on result received:', {
        success: data.success,
        hasImage: !!generatedImage,
        imageLength: generatedImage?.length || 0,
        imagePrefix: generatedImage?.substring(0, 80) || 'none',
      });

      const tryOnResult: TryOnResult = {
        success: true,
        generatedImage,
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
