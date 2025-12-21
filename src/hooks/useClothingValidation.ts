import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { removeBackground, hasTransparentBackground } from '@/utils/backgroundRemoval';
import { ClothingCategory } from '@/types/clothing';
import { getClothingFixSuggestions } from '@/utils/validationSuggestions';

export interface ClothingAnalysis {
  isClothing: boolean;
  isFullyVisible: boolean;
  isFolded: boolean;
  category: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory' | 'unknown';
  subcategory: string;
  color: string;
  pattern: string;
  quality: 'good' | 'acceptable' | 'poor';
  issues: string[];
  style: string;
  gender: 'male' | 'female' | 'unisex' | 'unknown';
}

// Map issue codes to translation keys
const issueTranslationMap: Record<string, string> = {
  'folded': 'msg_clothing_folded',
  'crumpled': 'msg_clothing_crumpled',
  'partially_visible': 'msg_clothing_partial',
  'in_packaging': 'msg_clothing_packaged',
  'multiple_items': 'msg_clothing_multiple',
  'worn_by_person': 'msg_clothing_worn',
  'too_blurry': 'msg_clothing_blurry',
  'bad_lighting': 'msg_clothing_lighting',
  'too_small': 'msg_clothing_small',
  'not_clothing': 'msg_not_clothing',
  'background_cluttered': 'msg_clothing_cluttered',
};

export interface ClothingValidationResult {
  isValid: boolean;
  analysis: ClothingAnalysis | null;
  processedImageUrl: string | null;
  errors: string[];
  suggestions: string[];
}

export interface ClothingValidationProgress {
  stage: 'checking_size' | 'analyzing' | 'removing_background' | 'complete' | 'error';
  progress: number;
  message: string;
}

const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Map AI category to app category
const mapToAppCategory = (aiCategory: string): ClothingCategory => {
  switch (aiCategory) {
    case 'top': return 'top';
    case 'bottom': return 'bottom';
    case 'dress': return 'dress';
    case 'shoes': return 'shoes';
    case 'accessory': return 'accessory';
    default: return 'top';
  }
};

export const useClothingValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState<ClothingValidationProgress | null>(null);

  const checkBasicQuality = useCallback((imageDataUrl: string): Promise<{ 
    width: number; 
    height: number; 
    isValid: boolean; 
    errors: string[] 
  }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const errors: string[] = [];
        
        if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
          errors.push(`Image too small (min: ${MIN_WIDTH}x${MIN_HEIGHT}px)`);
        }
        
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

  const analyzeWithAI = useCallback(async (imageBase64: string): Promise<ClothingAnalysis> => {
    const { data, error } = await supabase.functions.invoke('analyze-clothing-image', {
      body: { imageBase64 }
    });

    if (error) {
      throw new Error(error.message || 'Failed to analyze image');
    }

    return data as ClothingAnalysis;
  }, []);

  const validateAndProcessClothing = useCallback(async (
    imageDataUrl: string,
    options: { removeBackground?: boolean; language?: 'vi' | 'en' } = { removeBackground: true, language: 'vi' }
  ): Promise<ClothingValidationResult> => {
    setIsValidating(true);
    const errors: string[] = [];
    const language = options.language || 'vi';
    
    try {
      // Step 1: Check basic quality
      setProgress({ stage: 'checking_size', progress: 10, message: 'Checking image size...' });
      
      const basicCheck = await checkBasicQuality(imageDataUrl);
      if (!basicCheck.isValid) {
        setProgress({ stage: 'error', progress: 100, message: 'Image quality issues' });
        const suggestions = getClothingFixSuggestions(basicCheck.errors.map(e => e.includes('small') ? 'image_too_small' : 'default'), language);
        return {
          isValid: false,
          analysis: null,
          processedImageUrl: null,
          errors: basicCheck.errors,
          suggestions
        };
      }
      
      // Step 2: AI Analysis
      setProgress({ stage: 'analyzing', progress: 30, message: 'Analyzing clothing with AI...' });
      
      let analysis: ClothingAnalysis;
      try {
        analysis = await analyzeWithAI(imageDataUrl);
      } catch (err) {
        console.error('AI analysis failed:', err);
        // Fallback - allow image but mark as unknown
        analysis = {
          isClothing: true,
          isFullyVisible: true,
          isFolded: false,
          category: 'unknown',
          subcategory: 'unknown',
          color: 'unknown',
          pattern: 'unknown',
          quality: 'acceptable',
          issues: [],
          style: 'unknown',
          gender: 'unknown'
        };
      }
      
      // Validate analysis results
      if (!analysis.isClothing) {
        errors.push('not_clothing');
      }
      
      if (analysis.isFolded) {
        errors.push('folded');
      }
      
      if (!analysis.isFullyVisible) {
        errors.push('partially_visible');
      }
      
      if (analysis.quality === 'poor') {
        errors.push('poor_quality');
      }
      
      // Add other issues from AI analysis
      if (analysis.issues && analysis.issues.length > 0) {
        for (const issue of analysis.issues) {
          if (!errors.includes(issue)) {
            errors.push(issue);
          }
        }
      }
      
      if (errors.length > 0) {
        setProgress({ stage: 'error', progress: 100, message: 'Validation failed' });
        const suggestions = getClothingFixSuggestions(errors, language);
        return {
          isValid: false,
          analysis,
          processedImageUrl: null,
          errors,
          suggestions
        };
      }
      
      // Step 3: Background removal (optional)
      let processedImageUrl = imageDataUrl;
      
      if (options.removeBackground) {
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
          }
        }
      }
      
      setProgress({ stage: 'complete', progress: 100, message: 'Validation complete!' });
      
      return {
        isValid: true,
        analysis,
        processedImageUrl,
        errors: [],
        suggestions: []
      };
    } catch (error) {
      console.error('Validation error:', error);
      setProgress({ stage: 'error', progress: 100, message: 'Validation failed' });
      const errorMsg = error instanceof Error ? error.message : 'Unknown validation error';
      return {
        isValid: false,
        analysis: null,
        processedImageUrl: null,
        errors: [errorMsg],
        suggestions: getClothingFixSuggestions(['default'], language)
      };
    } finally {
      setIsValidating(false);
    }
  }, [checkBasicQuality, analyzeWithAI]);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    validateAndProcessClothing,
    isValidating,
    progress,
    resetProgress,
    mapToAppCategory,
    issueTranslationMap
  };
};
