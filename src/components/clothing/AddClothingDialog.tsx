import { useState, useRef } from 'react';
import { X, Upload, Link2, ImagePlus, Check, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useClothingValidation } from '@/hooks/useClothingValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { FunLoading, FunProgressBar } from '@/components/ui/fun-loading';
import { ClothingDetailsForm } from './ClothingDetailsForm';

interface AddClothingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClothing: (item: ClothingItem) => void;
  onSaveToCollection?: (item: ClothingItem) => void;
  targetCategory?: ClothingCategory | null;
}

export const AddClothingDialog = ({ 
  isOpen, 
  onClose, 
  onAddClothing,
  onSaveToCollection,
  targetCategory
}: AddClothingDialogProps) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for review mode
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [detectedItem, setDetectedItem] = useState<ClothingItem | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  
  const { 
    validateAndProcessClothing, 
    isValidating,
    progress,
    mapToAppCategory,
    issueTranslationMap
  } = useClothingValidation();

  // Background removal is disabled - AI try-on model has good recognition capability
  const removeBackground = false;

  const handleClose = () => {
    setImageUrl('');
    setPreviewImage(null);
    setIsLoadingUrl(false);
    setShowReviewForm(false);
    setDetectedItem(null);
    setOriginalImageUrl('');
    onClose();
  };

  const processClothingImage = async (imageDataUrl: string, sourceName: string) => {
    const result = await validateAndProcessClothing(imageDataUrl, { 
      removeBackground, 
      language 
    });
    
    if (!result.isValid) {
      const errorMessages = result.errors.map(err => {
        const translationKey = issueTranslationMap[err];
        if (translationKey && t(translationKey as any) !== translationKey) {
          return t(translationKey as any);
        }
        return err;
      });
      
      toast.error(
        <div className="space-y-2">
          <p className="font-medium">{t('msg_not_clothing')}</p>
          <ul className="text-sm list-disc pl-4 space-y-1">
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }
    
    const aiCategory = result.analysis?.category || 'top';
    const appCategory = targetCategory && targetCategory !== 'all' && targetCategory !== 'unknown' 
      ? targetCategory 
      : mapToAppCategory(aiCategory);
    
    const newItem: ClothingItem = {
      id: Date.now().toString(),
      name: result.analysis?.subcategory || sourceName,
      category: appCategory,
      imageUrl: result.processedImageUrl || imageDataUrl,
      color: result.analysis?.color,
      gender: result.analysis?.gender,
      style: result.analysis?.style,
      pattern: result.analysis?.pattern,
    };
    
    // Show review form instead of immediately saving
    setOriginalImageUrl(result.processedImageUrl || imageDataUrl);
    setDetectedItem(newItem);
    setShowReviewForm(true);
  };

  const handleSaveClothing = (item: ClothingItem) => {
    onAddClothing(item);
    
    if (onSaveToCollection) {
      onSaveToCollection(item);
    }
    
    const categoryLabel = t(`msg_clothing_category_${item.category}` as any) || item.category;
    toast.success(`${t('msg_clothing_detected')} ${categoryLabel}`);
    
    handleClose();
  };

  const handleBackToUpload = () => {
    setShowReviewForm(false);
    setDetectedItem(null);
    setOriginalImageUrl('');
    setPreviewImage(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      setPreviewImage(imageDataUrl);
      await processClothingImage(imageDataUrl, file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error(t('add_clothing_url_required'));
      return;
    }

    try {
      new URL(imageUrl);
    } catch {
      toast.error(t('add_clothing_url_invalid'));
      return;
    }

    setIsLoadingUrl(true);
    
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Cannot load image');
      
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('Not an image');
      }
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string;
        setPreviewImage(imageDataUrl);
        await processClothingImage(imageDataUrl, t('add_clothing_from_url'));
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading image from URL:', error);
      toast.error(t('add_clothing_url_error'));
    } finally {
      setIsLoadingUrl(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-medium overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          {showReviewForm ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="iconSm" onClick={handleBackToUpload}>
                <ArrowLeft size={18} />
              </Button>
              <h3 className="font-display font-bold text-lg text-foreground">
                {t('clothing_form_review_title')}
              </h3>
            </div>
          ) : (
            <h3 className="font-display font-bold text-lg text-foreground">
              {targetCategory && targetCategory !== 'all' && targetCategory !== 'unknown'
                ? t('add_clothing_add_category').replace('{category}', t(`slot_${targetCategory}` as any))
                : t('add_clothing_title')}
            </h3>
          )}
          <Button variant="ghost" size="iconSm" onClick={handleClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Loading State */}
        {isValidating && progress && (
          <div className="absolute inset-0 z-20 bg-card/95 flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-4 p-6">
              <FunLoading 
                type="clothing" 
                size="lg" 
                message={
                  progress.stage === 'checking_size' ? t('add_clothing_checking_size') :
                  progress.stage === 'analyzing' ? t('add_clothing_detecting') :
                  progress.stage === 'removing_background' ? t('add_clothing_removing_bg') :
                  progress.stage === 'complete' ? t('add_clothing_complete') : t('add_clothing_analyzing')
                }
                showEmoji={true}
              />
              <div className="w-48 mx-auto">
                <FunProgressBar progress={progress.progress} />
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Review Form */}
          {showReviewForm && detectedItem ? (
            <ClothingDetailsForm
              item={detectedItem}
              imageUrl={originalImageUrl}
              onSave={handleSaveClothing}
              onCancel={handleBackToUpload}
            />
          ) : (
            /* Upload/URL Tabs */
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload size={14} />
                  {t('add_clothing_upload_tab')}
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link2 size={14} />
                  {t('add_clothing_url_tab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImagePlus size={28} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{t('add_clothing_select_device')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('add_clothing_supported')}</p>
                  </div>
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  {t('add_clothing_ai_detect')}
                </p>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('add_clothing_url_label')}</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="aspect-[4/3] rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-4">
                        <Link2 size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t('add_clothing_url_placeholder')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleUrlSubmit} disabled={!imageUrl.trim() || isLoadingUrl || isValidating} className="w-full h-11">
                  {isLoadingUrl ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('add_clothing_loading')}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {t('add_clothing_add_btn')}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">{t('add_clothing_url_hint')}</p>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
