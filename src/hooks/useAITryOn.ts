import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TryOnResult {
  success: boolean;
  generatedImage?: string;
  message?: string;
  error?: string;
}

export interface TryOnProgress {
  stage: 'idle' | 'compressing' | 'uploading' | 'processing' | 'generating' | 'complete' | 'error';
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

  const updateProgress = useCallback((stage: TryOnProgress['stage'], progressValue: number, message: string) => {
    setProgress({ stage, progress: progressValue, message });
  }, []);

  const processVirtualTryOn = async (
    bodyImage: string,
    clothingItems: Array<{ imageUrl: string; name: string }>
  ): Promise<TryOnResult | null> => {
    setIsProcessing(true);
    setResult(null);
    updateProgress('uploading', 10, 'Đang gửi dữ liệu...');

    try {
      console.log('Starting AI virtual try-on with', clothingItems.length, 'items...');
      
      updateProgress('processing', 30, 'Đang kết nối AI...');
      
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
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

      clearInterval(progressInterval);

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
      console.error('Error processing virtual try-on:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
      updateProgress('error', 0, errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
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
  };
};
