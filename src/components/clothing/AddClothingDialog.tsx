import { useState, useRef } from 'react';
import { X, Upload, Link2, Loader2, ImagePlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useClothingValidation } from '@/hooks/useClothingValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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
  
  const { 
    validateAndProcessClothing, 
    isValidating,
    progress,
    mapToAppCategory,
    issueTranslationMap
  } = useClothingValidation();

  const handleClose = () => {
    setImageUrl('');
    setPreviewImage(null);
    setIsLoadingUrl(false);
    onClose();
  };

  const processClothingImage = async (imageDataUrl: string, sourceName: string) => {
    const result = await validateAndProcessClothing(imageDataUrl, { 
      removeBackground: true, 
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
    // Use target category if provided, otherwise use AI detected category
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
    
    onAddClothing(newItem);
    
    if (onSaveToCollection) {
      onSaveToCollection(newItem);
    }
    
    const categoryLabel = t(`msg_clothing_category_${appCategory}` as any) || appCategory;
    toast.success(`${t('msg_clothing_detected')} ${categoryLabel}`);
    
    handleClose();
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
      toast.error('Vui lòng nhập link ảnh');
      return;
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      toast.error('Link ảnh không hợp lệ');
      return;
    }

    setIsLoadingUrl(true);
    
    try {
      // Fetch image from URL and convert to base64
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Không thể tải ảnh');
      
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('Link không phải là ảnh');
      }
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string;
        setPreviewImage(imageDataUrl);
        await processClothingImage(imageDataUrl, 'Quần áo từ URL');
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading image from URL:', error);
      toast.error('Không thể tải ảnh từ link. Vui lòng kiểm tra lại link hoặc thử cách khác.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-medium overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display font-bold text-lg text-foreground">
            {targetCategory && targetCategory !== 'all' && targetCategory !== 'unknown'
              ? `Thêm ${targetCategory === 'top' ? 'áo' : targetCategory === 'bottom' ? 'quần' : targetCategory === 'dress' ? 'váy' : targetCategory === 'shoes' ? 'giày' : 'phụ kiện'}`
              : 'Thêm quần áo mới'}
          </h3>
          <Button variant="ghost" size="iconSm" onClick={handleClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Processing overlay */}
        {isValidating && progress && (
          <div className="absolute inset-0 z-10 bg-card/95 flex items-center justify-center">
            <div className="text-center space-y-4 p-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <div className="space-y-2">
                <p className="font-medium text-foreground">Đang phân tích ảnh...</p>
                <p className="text-sm text-muted-foreground">
                  {progress.stage === 'checking_size' && 'Kiểm tra kích thước...'}
                  {progress.stage === 'analyzing' && 'Nhận diện quần áo...'}
                  {progress.stage === 'removing_background' && 'Xóa nền ảnh...'}
                  {progress.stage === 'complete' && 'Hoàn tất!'}
                </p>
              </div>
              <Progress value={progress.progress} className="h-2 w-48 mx-auto" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload size={14} />
                Tải ảnh lên
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link2 size={14} />
                Nhập link
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
                  <p className="font-medium text-foreground">Chọn ảnh từ thiết bị</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hỗ trợ JPG, PNG, WEBP
                  </p>
                </div>
              </button>

              <p className="text-xs text-muted-foreground text-center">
                AI sẽ tự động nhận diện loại quần áo và xóa nền ảnh
              </p>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Link ảnh quần áo
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Preview area */}
                <div className="aspect-[4/3] rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Link2 size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Dán link ảnh và nhấn "Thêm quần áo"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleUrlSubmit}
                disabled={!imageUrl.trim() || isLoadingUrl || isValidating}
                className="w-full h-11"
              >
                {isLoadingUrl ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Thêm quần áo
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Link ảnh phải là link trực tiếp đến file ảnh (JPG, PNG, WEBP)
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
