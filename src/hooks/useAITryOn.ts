import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TryOnResult {
  success: boolean;
  generatedImage?: string;
  message?: string;
  error?: string;
}

export const useAITryOn = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);

  const processVirtualTryOn = async (
    bodyImage: string,
    clothingImage: string,
    clothingName?: string
  ): Promise<TryOnResult | null> => {
    setIsProcessing(true);
    setResult(null);

    try {
      console.log('Starting AI virtual try-on...');
      
      const { data, error } = await supabase.functions.invoke('virtual-try-on', {
        body: {
          bodyImage,
          clothingImage,
          clothingName,
        },
      });

      if (error) {
        console.error('Function error:', error);
        toast.error(error.message || 'Không thể xử lý hình ảnh');
        return null;
      }

      if (data.error) {
        console.error('API error:', data.error);
        toast.error(data.error);
        return { success: false, error: data.error };
      }

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
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  return {
    processVirtualTryOn,
    isProcessing,
    result,
    clearResult,
  };
};
