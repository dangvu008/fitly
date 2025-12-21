import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Check, X, User, AlertTriangle } from 'lucide-react';
import { useImageValidation, ImageAnalysis } from '@/hooks/useImageValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface TryOnCanvasProps {
  bodyImageUrl?: string;
  onBodyImageChange?: (imageUrl: string) => void;
  onGenderDetected?: (gender: 'male' | 'female' | 'unknown') => void;
}

export const TryOnCanvas = ({
  bodyImageUrl,
  onBodyImageChange,
  onGenderDetected,
}: TryOnCanvasProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateAndProcessImage, isValidating, progress } = useImageValidation();
  const { t } = useLanguage();
  const [lastAnalysis, setLastAnalysis] = useState<ImageAnalysis | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      
      // Validate and process
      const result = await validateAndProcessImage(base64Url, { removeBackground: true });
      
      if (result.isValid && result.processedImageUrl) {
        setLastAnalysis(result.analysis);
        onBodyImageChange?.(result.processedImageUrl);
        onGenderDetected?.(result.analysis?.gender || 'unknown');
        
        // Show success with gender info
        const genderText = result.analysis?.gender === 'male' 
          ? t('msg_gender_male')
          : result.analysis?.gender === 'female'
            ? t('msg_gender_female')
            : t('msg_gender_unknown');
            
        toast.success(`${t('msg_upload_success')} ${t('msg_detected_gender')} ${genderText}`);
      } else {
        // Show errors
        result.errors.forEach(error => {
          toast.error(error);
        });
      }
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (!isValidating) {
      fileInputRef.current?.click();
    }
  };

  const getProgressMessage = () => {
    if (!progress) return '';
    switch (progress.stage) {
      case 'checking_size': return t('msg_checking_size');
      case 'analyzing': return t('msg_analyzing_image');
      case 'removing_background': return t('msg_removing_background');
      case 'complete': return t('msg_validation_complete');
      case 'error': return progress.message;
      default: return t('msg_validating_image');
    }
  };

  const getGenderBadge = () => {
    if (!lastAnalysis || !bodyImageUrl) return null;
    
    const gender = lastAnalysis.gender;
    const text = gender === 'male' 
      ? t('msg_gender_male')
      : gender === 'female'
        ? t('msg_gender_female')
        : t('msg_gender_unknown');
    
    return (
      <Badge 
        variant="secondary" 
        className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm"
      >
        <User size={12} className="mr-1" />
        {text}
      </Badge>
    );
  };

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden gradient-fashion shadow-medium">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isValidating}
      />

      {/* Validation overlay */}
      {isValidating && (
        <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-foreground mb-3">{getProgressMessage()}</p>
          <div className="w-full max-w-xs">
            <Progress value={progress?.progress || 0} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(progress?.progress || 0)}%
          </p>
        </div>
      )}

      {/* Body image */}
      {bodyImageUrl ? (
        <>
          <img
            src={bodyImageUrl}
            alt="Your photo"
            className="absolute inset-0 w-full h-full object-contain cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={handleUploadClick}
          />
          {getGenderBadge()}
          
          {/* Quality indicator */}
          {lastAnalysis && (
            <div className="absolute top-3 right-3">
              {lastAnalysis.quality === 'good' ? (
                <Badge variant="default" className="bg-green-500/90 hover:bg-green-500">
                  <Check size={12} className="mr-1" />
                  Good
                </Badge>
              ) : lastAnalysis.quality === 'acceptable' ? (
                <Badge variant="secondary" className="bg-yellow-500/90 text-black hover:bg-yellow-500">
                  <AlertTriangle size={12} className="mr-1" />
                  OK
                </Badge>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={handleUploadClick}
        >
          <div className="w-32 h-48 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex items-center justify-center mb-4">
            <svg viewBox="0 0 100 150" className="w-20 h-28 text-muted-foreground/30">
              <circle cx="50" cy="25" r="20" fill="currentColor" />
              <path d="M25 55 L50 50 L75 55 L80 120 L60 130 L50 125 L40 130 L20 120 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Camera size={20} className="text-primary" />
            <ImagePlus size={20} className="text-primary" />
          </div>
          <p className="text-sm font-medium">{t('tryon_upload_body')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('language') === 'vi' ? 'Chụp ảnh hoặc chọn từ thư viện' : 'Take a photo or choose from gallery'}
          </p>
        </div>
      )}
    </div>
  );
};
