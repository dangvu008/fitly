import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { removeBackground, hasTransparentBackground } from '@/utils/backgroundRemoval';

export interface ImageAnalysis {
  isPerson: boolean;
  isFullBody: boolean;
  gender: 'male' | 'female' | 'unknown';
  quality: 'good' | 'acceptable' | 'poor';
  issues: string[];
}

export interface ValidationResult {
  isValid: boolean;
  analysis: ImageAnalysis | null;
  processedImageUrl: string | null;
  errors: string[];
}

export interface ValidationProgress {
  stage: 'checking_size' | 'analyzing' | 'removing_background' | 'complete' | 'error';
  progress: number;
  message: string;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 400;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useImageValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState<ValidationProgress | null>(null);

  const checkBasicQuality = useCallback((imageDataUrl: string): Promise<{ width: number; height: number; isValid: boolean; errors: string[] }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const errors: string[] = [];
        
        if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
          errors.push(`Image too small (min: ${MIN_WIDTH}x${MIN_HEIGHT}px)`);
        }
        
        // Check file size from base64
        const base64Length = imageDataUrl.length - (imageDataUrl.indexOf(',') + 1);
        const fileSize = (base64Length * 3) / 4;
        if (fileSize > MAX_FILE_SIZE) {
          errors.push('Image file too large (max: 10MB)');
        }
        
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          isValid: errors.length === 0,
          errors
        });
      };
      img.onerror = () => {
        resolve({
          width: 0,
          height: 0,
          isValid: false,
          errors: ['Failed to load image']
        });
      };
      img.src = imageDataUrl;
    });
  }, []);

  const analyzeWithAI = useCallback(async (imageBase64: string): Promise<ImageAnalysis> => {
    const { data, error } = await supabase.functions.invoke('analyze-body-image', {
      body: { imageBase64 }
    });

    if (error) {
      throw new Error(error.message || 'Failed to analyze image');
    }

    return data as ImageAnalysis;
  }, []);

  const validateAndProcessImage = useCallback(async (
    imageDataUrl: string,
    options: { removeBackground?: boolean } = { removeBackground: true }
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    const errors: string[] = [];
    
    try {
      // Step 1: Check basic quality
      setProgress({ stage: 'checking_size', progress: 10, message: 'Checking image size...' });
      
      const basicCheck = await checkBasicQuality(imageDataUrl);
      if (!basicCheck.isValid) {
        setProgress({ stage: 'error', progress: 100, message: 'Image quality issues' });
        return {
          isValid: false,
          analysis: null,
          processedImageUrl: null,
          errors: basicCheck.errors
        };
      }
      
      // Step 2: AI Analysis
      setProgress({ stage: 'analyzing', progress: 30, message: 'Analyzing image with AI...' });
      
      let analysis: ImageAnalysis;
      try {
        analysis = await analyzeWithAI(imageDataUrl);
      } catch (err) {
        console.error('AI analysis failed:', err);
        // Fallback - allow image but mark as unknown
        analysis = {
          isPerson: true,
          isFullBody: true,
          gender: 'unknown',
          quality: 'acceptable',
          issues: []
        };
      }
      
      // Validate analysis results
      if (!analysis.isPerson) {
        errors.push('No person detected in image');
      }
      
      if (!analysis.isFullBody) {
        errors.push('Full body not visible');
      }
      
      if (analysis.quality === 'poor') {
        errors.push('Image quality is too low');
      }
      
      if (analysis.issues && analysis.issues.length > 0) {
        errors.push(...analysis.issues);
      }
      
      if (errors.length > 0) {
        setProgress({ stage: 'error', progress: 100, message: 'Validation failed' });
        return {
          isValid: false,
          analysis,
          processedImageUrl: null,
          errors
        };
      }
      
      // Step 3: Background removal (optional)
      let processedImageUrl = imageDataUrl;
      
      if (options.removeBackground) {
        // Check if already has transparent background
        const alreadyTransparent = await hasTransparentBackground(imageDataUrl);
        
        if (!alreadyTransparent) {
          setProgress({ stage: 'removing_background', progress: 50, message: 'Removing background...' });
          
          try {
            processedImageUrl = await removeBackground(imageDataUrl, (p) => {
              setProgress({
                stage: 'removing_background',
                progress: 50 + (p * 0.4),
                message: 'Removing background...'
              });
            });
          } catch (err) {
            console.warn('Background removal failed, using original image:', err);
            // Continue with original image if background removal fails
          }
        }
      }
      
      setProgress({ stage: 'complete', progress: 100, message: 'Image validated!' });
      
      return {
        isValid: true,
        analysis,
        processedImageUrl,
        errors: []
      };
    } catch (error) {
      console.error('Validation error:', error);
      setProgress({ stage: 'error', progress: 100, message: 'Validation failed' });
      return {
        isValid: false,
        analysis: null,
        processedImageUrl: null,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    } finally {
      setIsValidating(false);
    }
  }, [checkBasicQuality, analyzeWithAI]);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    validateAndProcessImage,
    isValidating,
    progress,
    resetProgress
  };
};
