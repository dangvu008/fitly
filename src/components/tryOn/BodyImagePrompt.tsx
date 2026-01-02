import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Camera,
  Upload,
  History,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Star,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultBodyImage } from '@/hooks/useDefaultBodyImage';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BodyImagePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string) => void;
  onSkip?: () => void;
}

interface ValidationState {
  status: 'idle' | 'validating' | 'success' | 'error';
  message?: string;
  guidance?: string[];
}

interface HistoryImage {
  id: string;
  body_image_url: string;
  created_at: string;
}

/**
 * BodyImagePrompt Component
 * 
 * Dialog that prompts users to upload a body image for One-Tap Try-On.
 * Shows when user has no default body image and taps Quick Try Button.
 * 
 * Features:
 * - Upload from gallery option
 * - Take selfie with camera option
 * - Use previous body image option (if available)
 * - Body image validation with guidance
 * 
 * @see Requirements 1.2, 3.2 from one-tap-tryon-flow spec
 */
export function BodyImagePrompt({
  isOpen,
  onClose,
  onImageSelected,
  onSkip,
}: BodyImagePromptProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { defaultBodyImage, saveDefaultBodyImage } = useDefaultBodyImage();
  
  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' });
  const [historyImages, setHistoryImages] = useState<HistoryImage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryImage, setSelectedHistoryImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch history images when dialog opens
  const fetchHistoryImages = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('try_on_history')
        .select('id, body_image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Deduplicate by URL
      const seen = new Set<string>();
      const unique: HistoryImage[] = [];
      data?.forEach((item) => {
        if (!seen.has(item.body_image_url)) {
          seen.add(item.body_image_url);
          unique.push(item);
        }
      });

      setHistoryImages(unique);
    } catch (error) {
      console.error('[BodyImagePrompt] Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);


  // Load history when dialog opens
  useState(() => {
    if (isOpen && user) {
      fetchHistoryImages();
    }
  });

  // Validate body image using edge function
  const validateBodyImage = async (imageBase64: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-body-image', {
        body: { imageBase64 },
      });

      if (error) throw error;

      const isValid = data.isPerson && data.isFullBody && data.quality !== 'poor';
      return {
        isValid,
        issues: data.issues || [],
      };
    } catch (error) {
      console.error('[BodyImagePrompt] Validation error:', error);
      return {
        isValid: false,
        issues: ['validation_failed'],
      };
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection (gallery or camera)
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    event.target.value = '';

    try {
      const base64 = await fileToBase64(file);
      setPreviewImage(base64);
      
      // Start validation
      setValidation({ status: 'validating', message: t('msg_validating_image') });
      
      const result = await validateBodyImage(base64);
      
      if (result.isValid) {
        setValidation({ status: 'success', message: t('msg_validation_complete') });
        
        // Save as default and notify parent
        await saveDefaultBodyImage(base64);
        
        // Small delay to show success state
        setTimeout(() => {
          onImageSelected(base64);
          handleClose();
        }, 500);
      } else {
        // Show validation errors with guidance
        const guidance = mapIssuesToGuidance(result.issues);
        setValidation({
          status: 'error',
          message: t('body_image_validation_failed'),
          guidance,
        });
      }
    } catch (error) {
      console.error('[BodyImagePrompt] File processing error:', error);
      setValidation({
        status: 'error',
        message: t('msg_image_load_error'),
      });
    }
  };

  // Map validation issues to user-friendly guidance
  const mapIssuesToGuidance = (issues: string[]): string[] => {
    const guidanceMap: Record<string, string> = {
      'not a person': t('msg_no_person_detected'),
      'face not visible': t('body_image_guidance_face'),
      'cropped body': t('msg_not_full_body'),
      'too blurry': t('body_image_guidance_blur'),
      'too dark': t('body_image_guidance_lighting'),
      'multiple people': t('body_image_guidance_single'),
      'validation_failed': t('url_validation_failed'),
    };

    return issues.map((issue) => {
      const lowerIssue = issue.toLowerCase();
      for (const [key, value] of Object.entries(guidanceMap)) {
        if (lowerIssue.includes(key)) return value;
      }
      return issue;
    });
  };

  // Handle selecting from history
  const handleSelectFromHistory = async (imageUrl: string) => {
    setSelectedHistoryImage(imageUrl);
    setPreviewImage(imageUrl);
    
    // Save as default
    await saveDefaultBodyImage(imageUrl);
    
    onImageSelected(imageUrl);
    handleClose();
  };

  // Handle using default body image
  const handleUseDefault = () => {
    if (defaultBodyImage) {
      onImageSelected(defaultBodyImage);
      handleClose();
    }
  };

  // Reset state and close
  const handleClose = () => {
    setValidation({ status: 'idle' });
    setPreviewImage(null);
    setSelectedHistoryImage(null);
    onClose();
  };

  // Trigger file input for gallery
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Trigger camera input
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-display">
            {t('body_image_prompt_title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('body_image_prompt_desc')}
          </DialogDescription>
        </DialogHeader>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex-1 overflow-hidden px-4 pb-4">
          {/* Validation State Display */}
          {validation.status !== 'idle' && (
            <div
              className={cn(
                'mb-4 p-3 rounded-lg border',
                validation.status === 'validating' && 'bg-muted/50 border-muted',
                validation.status === 'success' && 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
                validation.status === 'error' && 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
              )}
            >
              <div className="flex items-start gap-2">
                {validation.status === 'validating' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />
                )}
                {validation.status === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                )}
                {validation.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={cn(
                    'text-sm font-medium',
                    validation.status === 'success' && 'text-green-700 dark:text-green-400',
                    validation.status === 'error' && 'text-red-700 dark:text-red-400'
                  )}>
                    {validation.message}
                  </p>
                  {validation.guidance && validation.guidance.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validation.guidance.map((tip, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-red-500">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview Image */}
          {previewImage && validation.status !== 'idle' && (
            <div className="mb-4 relative aspect-[3/4] max-h-48 mx-auto rounded-lg overflow-hidden border">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Upload Options */}
          <div className="space-y-3 mb-4">
            {/* Use Default Body Image (if available) */}
            {defaultBodyImage && (
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-4 border-primary/50 bg-primary/5"
                onClick={handleUseDefault}
                disabled={validation.status === 'validating'}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                  <img
                    src={defaultBodyImage}
                    alt="Default"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <Star className="absolute -bottom-1 -right-1 h-4 w-4 text-primary fill-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{t('body_image_use_default')}</p>
                  <p className="text-xs text-muted-foreground">{t('body_image_use_default_desc')}</p>
                </div>
              </Button>
            )}

            {/* Upload from Gallery */}
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4"
              onClick={handleUploadClick}
              disabled={validation.status === 'validating'}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">{t('body_image_upload_gallery')}</p>
                <p className="text-xs text-muted-foreground">{t('body_image_upload_gallery_desc')}</p>
              </div>
            </Button>

            {/* Take Selfie with Camera */}
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4"
              onClick={handleCameraClick}
              disabled={validation.status === 'validating'}
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Camera size={20} className="text-accent" />
              </div>
              <div className="text-left">
                <p className="font-medium">{t('body_image_take_selfie')}</p>
                <p className="text-xs text-muted-foreground">{t('body_image_take_selfie_desc')}</p>
              </div>
            </Button>
          </div>

          {/* Previous Body Images from History */}
          {user && historyImages.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">{t('body_image_from_history')}</span>
              </div>
              <ScrollArea className="h-32">
                <div className="grid grid-cols-4 gap-2">
                  {historyImages.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectFromHistory(item.body_image_url)}
                      disabled={validation.status === 'validating'}
                      className={cn(
                        'aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                        selectedHistoryImage === item.body_image_url
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-primary/50',
                        validation.status === 'validating' && 'opacity-50'
                      )}
                    >
                      <img
                        src={item.body_image_url}
                        alt="Previous"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty History State */}
          {user && historyImages.length === 0 && !isLoadingHistory && (
            <div className="border-t pt-4">
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <ImagePlus size={20} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('body_image_no_history')}
                </p>
              </div>
            </div>
          )}

          {/* Loading History */}
          {isLoadingHistory && (
            <div className="border-t pt-4 flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Skip Option */}
        {onSkip && (
          <div className="px-4 pb-4 border-t pt-3">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onSkip}
              disabled={validation.status === 'validating'}
            >
              {t('body_image_skip_for_now')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BodyImagePrompt;
