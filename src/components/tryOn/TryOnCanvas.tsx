import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Check, User, AlertTriangle, Lightbulb } from 'lucide-react';
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
  const { t, language } = useLanguage();
  const [lastAnalysis, setLastAnalysis] = useState<ImageAnalysis | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      
      const result = await validateAndProcessImage(base64Url, { 
        removeBackground: true,
        language 
      });
      
      if (result.isValid && result.processedImageUrl) {
        setLastAnalysis(result.analysis);
        onBodyImageChange?.(result.processedImageUrl);
        onGenderDetected?.(result.analysis?.gender || 'unknown');
        
        const genderText = result.analysis?.gender === 'male' 
          ? t('msg_gender_male')
          : result.analysis?.gender === 'female'
            ? t('msg_gender_female')
            : t('msg_gender_unknown');
            
        toast.success(`${t('msg_upload_success')} ${t('msg_detected_gender')} ${genderText}`);
      } else {
        result.errors.forEach(error => {
          toast.error(error);
        });
        
        if (result.suggestions && result.suggestions.length > 0) {
          result.suggestions.forEach((suggestion, index) => {
            setTimeout(() => {
              toast.info(suggestion, {
                duration: 8000,
                icon: <Lightbulb className="w-4 h-4 text-yellow-500" />
              });
            }, (index + 1) * 500);
          });
        }
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

  return (
    <div className="relative w-full h-full">
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
        <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-xl">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-foreground mb-3">{getProgressMessage()}</p>
          <div className="w-full max-w-[200px]">
            <Progress value={progress?.progress || 0} className="h-1.5" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(progress?.progress || 0)}%
          </p>
        </div>
      )}

      {/* Body image */}
      {bodyImageUrl ? (
        <div className="relative w-full h-full">
          <img
            src={bodyImageUrl}
            alt="Your photo"
            className="w-full h-full object-contain cursor-pointer"
            onClick={handleUploadClick}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            {lastAnalysis && (
              <Badge 
                variant="secondary" 
                className="bg-background/80 backdrop-blur-sm text-xs"
              >
                <User size={10} className="mr-1" />
                {lastAnalysis.gender === 'male' 
                  ? t('msg_gender_male')
                  : lastAnalysis.gender === 'female'
                    ? t('msg_gender_female')
                    : t('msg_gender_unknown')}
              </Badge>
            )}
            
            {lastAnalysis && (
              <Badge 
                variant={lastAnalysis.quality === 'good' ? 'default' : 'secondary'}
                className={lastAnalysis.quality === 'good' 
                  ? 'bg-green-500/90 text-white text-xs' 
                  : 'bg-yellow-500/90 text-black text-xs'}
              >
                {lastAnalysis.quality === 'good' ? (
                  <><Check size={10} className="mr-1" /> Good</>
                ) : (
                  <><AlertTriangle size={10} className="mr-1" /> OK</>
                )}
              </Badge>
            )}
          </div>
          
          {/* Tap to change hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
              <Camera size={10} className="mr-1" />
              Chạm để đổi ảnh
            </Badge>
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-secondary/50 transition-colors rounded-xl"
          onClick={handleUploadClick}
        >
          <div className="w-24 h-36 border-2 border-dashed border-muted-foreground/30 rounded-xl flex items-center justify-center mb-4">
            <svg viewBox="0 0 100 150" className="w-16 h-24 text-muted-foreground/30">
              <circle cx="50" cy="25" r="18" fill="currentColor" />
              <path d="M28 50 L50 45 L72 50 L78 115 L60 125 L50 120 L40 125 L22 115 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Camera size={18} className="text-primary" />
            <ImagePlus size={18} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">{t('tryon_upload_body')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Chụp ảnh hoặc chọn từ thư viện
          </p>
        </div>
      )}
    </div>
  );
};
