import React, { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, Loader2, Shirt, Crown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { AIProgressBar } from '@/components/tryOn/AIProgressBar';
import { ClothingValidationOverlay } from '@/components/tryOn/ClothingValidationOverlay';
import { AIResultModal } from '@/components/tryOn/AIResultModal';
import { AddClothingDialog } from '@/components/clothing/AddClothingDialog';
import { ShareOutfitDialog } from '@/components/outfit/ShareOutfitDialog';
import { ShareToPublicDialog } from '@/components/outfit/ShareToPublicDialog';
import { SaveOutfitDialog } from '@/components/outfit/SaveOutfitDialog';
import { LoginRequiredDialog } from '@/components/auth/LoginRequiredDialog';
import { SelectCategoryDialog } from '@/components/clothing/SelectCategoryDialog';
import { BodyImageSourceDialog } from '@/components/tryOn/BodyImageSourceDialog';
import { EditResultDialog } from '@/components/tryOn/EditResultDialog';
import { ProSubscriptionDialog } from '@/components/monetization/ProSubscriptionDialog';
import { FindSimilarItemsSheet } from '@/components/monetization/FindSimilarItemsSheet';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAITryOn } from '@/hooks/useAITryOn';
import { useTryOnHistory } from '@/hooks/useTryOnHistory';
import { useUserClothing } from '@/hooks/useUserClothing';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClothingValidation } from '@/hooks/useClothingValidation';
import { useCategoryCorrections } from '@/hooks/useCategoryCorrections';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useProSubscription } from '@/hooks/useProSubscription';
import { useUserQuota } from '@/hooks/useUserQuota';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Category icons for quick slots
const categoryIcons = {
  top: Shirt,
  bottom: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3h12l-1 7h-4v11h-2V10H7L6 3z" />
    </svg>
  ),
  dress: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L9 12L6 22h12l-3-10 3-10H6z" />
    </svg>
  ),
  shoes: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 17h18v4H3z" />
      <path d="M5 17V9a4 4 0 0 1 4-4h2l2 4h4a4 4 0 0 1 4 4v4" />
    </svg>
  ),
  accessory: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8" />
      <path d="M9 21h6" />
    </svg>
  ),
};

const BODY_IMAGE_STORAGE_KEY = 'tryon_body_image';

interface StudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: ClothingItem;
  reuseBodyImage?: string;
  reuseClothingItems?: ClothingItem[];
  historyResult?: {
    resultImageUrl: string;
    bodyImageUrl: string;
    clothingItems: Array<{ name: string; imageUrl: string }>;
  };
  initialGarmentUrl?: string;
  initialGarmentId?: string;
  autoStart?: boolean;
}

export const StudioDialog = ({
  open,
  onOpenChange,
  initialItem,
  reuseBodyImage,
  reuseClothingItems = [],
  historyResult,
  initialGarmentUrl,
  initialGarmentId,
  autoStart = false,
}: StudioDialogProps) => {
  const [bodyImage, setBodyImage] = useState<string | undefined>(() => {
    if (historyResult?.bodyImageUrl) return historyResult.bodyImageUrl;
    if (reuseBodyImage) return reuseBodyImage;
    try {
      return localStorage.getItem(BODY_IMAGE_STORAGE_KEY) || undefined;
    } catch {
      return undefined;
    }
  });
  
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>(() => {
    if (historyResult?.clothingItems) {
      return historyResult.clothingItems.map((item, index) => ({
        id: `history-${index}`,
        name: item.name,
        imageUrl: item.imageUrl,
        category: 'all' as const,
      }));
    }
    if (reuseClothingItems.length > 0) return reuseClothingItems;
    if (initialItem) return [initialItem];
    return [];
  });

  const [aiResultImage, setAiResultImage] = useState<string | null>(() => {
    return historyResult?.resultImageUrl || null;
  });
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [showAddClothingDialog, setShowAddClothingDialog] = useState(false);
  const [targetCategoryForUpload, setTargetCategoryForUpload] = useState<ClothingCategory | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareToPublicDialog, setShowShareToPublicDialog] = useState(false);
  const [showSaveOutfitDialog, setShowSaveOutfitDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showEditResultDialog, setShowEditResultDialog] = useState(false);
  const [showBodyImageSourceDialog, setShowBodyImageSourceDialog] = useState(false);
  const [showProDialog, setShowProDialog] = useState(false);
  const [showFindSimilarSheet, setShowFindSimilarSheet] = useState(false);
  const [quality, setQuality] = useState<'standard' | '4k'>('standard');
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [pendingUnknownItem, setPendingUnknownItem] = useState<{
    item: Omit<ClothingItem, 'category'>;
    imageUrl: string;
    aiPredictedCategory?: string;
    imageFeatures?: {
      color?: string;
      pattern?: string;
      style?: string;
      subcategory?: string;
    };
  } | null>(null);

  const { processVirtualTryOn, isProcessing, clearResult, progress: aiProgress, cancelProcessing } = useAITryOn();
  const { saveTryOnResult } = useTryOnHistory();
  const { userClothing, saveClothingItem } = useUserClothing();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isValidating: isValidatingClothing, progress: clothingProgress } = useClothingValidation();
  const { saveCorrection } = useCategoryCorrections();
  const { profile, setDefaultBodyImage } = useUserProfile();
  const { isPro } = useProSubscription();
  const { remaining, dailyLimit, hasQuotaRemaining, isUnlimited, refreshQuota } = useUserQuota();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      if (profile?.default_body_image_url) {
        setBodyImage(profile.default_body_image_url);
      } else {
        try {
          const stored = localStorage.getItem(BODY_IMAGE_STORAGE_KEY);
          if (stored) setBodyImage(stored);
        } catch {
          // ignore
        }
      }
    }
  }, [open, profile?.default_body_image_url]);

  // Save body image to localStorage when it changes
  useEffect(() => {
    if (bodyImage && !reuseBodyImage) {
      try {
        localStorage.setItem(BODY_IMAGE_STORAGE_KEY, bodyImage);
      } catch (e) {
        console.warn('Could not save body image to localStorage:', e);
      }
    }
  }, [bodyImage, reuseBodyImage]);

  // Cleanup cooldown timer
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBodyImage(event.target?.result as string);
        setAiResultImage(null);
        clearResult();
        toast.success('Tải ảnh thành công');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClothing = (item: ClothingItem) => {
    setSelectedItems(prev => {
      const filtered = prev.filter(i => i.category !== item.category);
      return [...filtered, item];
    });
    toast.success(`Đã chọn ${item.name}`);
  };

  const handleAddClothingForCategory = (category: ClothingCategory) => {
    setTargetCategoryForUpload(category);
    setShowAddClothingDialog(true);
  };

  const handleCategorySelect = async (category: ClothingCategory) => {
    if (pendingUnknownItem) {
      const newItem: ClothingItem = {
        ...pendingUnknownItem.item,
        category,
      } as ClothingItem;
      
      handleAddClothing(newItem);
      
      if (user) {
        saveClothingItem(newItem);
        await saveCorrection(
          pendingUnknownItem.imageUrl,
          pendingUnknownItem.aiPredictedCategory || null,
          category,
          pendingUnknownItem.imageFeatures
        );
      }
      
      setPendingUnknownItem(null);
      setShowCategoryDialog(false);
    }
  };

  const handleAITryOn = async () => {
    if (!bodyImage) {
      toast.error('Vui lòng chọn ảnh toàn thân');
      return;
    }
    
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 món đồ');
      return;
    }

    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!hasQuotaRemaining && !isUnlimited) {
      setShowProDialog(true);
      return;
    }

    triggerLight();

    try {
      const clothingData = selectedItems.map(item => ({ 
        imageUrl: item.imageUrl, 
        name: item.name 
      }));
      
      const result = await processVirtualTryOn(bodyImage, clothingData);
      
      if (result && result.generatedImage) {
        setAiResultImage(result.generatedImage);
        setIsResultSaved(false);
        triggerSuccess();
        
        // Save to history
        await saveTryOnResult(
          result.generatedImage,
          bodyImage,
          selectedItems.map(item => ({
            name: item.name,
            imageUrl: item.imageUrl,
          })),
          user.id
        );
        
        // Refresh quota
        await refreshQuota();
        
        toast.success('Thử đồ thành công!');
      }
    } catch (error) {
      console.error('TryOn error:', error);
      triggerError();
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleCloseResult = () => {
    setAiResultImage(null);
    clearResult();
  };

  const handleShare = () => {
    if (aiResultImage) {
      setShowShareDialog(true);
    }
  };

  const handleShareToPublic = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    setShowShareToPublicDialog(true);
  };

  const handleEditResult = async (instruction: string) => {
    if (!aiResultImage) return;
    
    setIsEditingResult(true);
    try {
      const { data, error } = await supabase.functions.invoke('edit-try-on-result', {
        body: {
          currentImage: aiResultImage,
          instruction,
          clothingItems: selectedItems.map(item => ({
            name: item.name,
            imageUrl: item.imageUrl,
          })),
        },
      });

      if (error || data?.error) {
        toast.error('Không thể chỉnh sửa hình ảnh');
        return;
      }

      if (data?.success && data?.editedImage) {
        setAiResultImage(data.editedImage);
        setIsResultSaved(false);
        setShowEditResultDialog(false);
        toast.success('Đã chỉnh sửa thành công!');
      }
    } catch (error) {
      console.error('Error editing result:', error);
      toast.error('Đã xảy ra lỗi khi chỉnh sửa');
    } finally {
      setIsEditingResult(false);
    }
  };

  const categories: { id: ClothingCategory; label: string }[] = [
    { id: 'top', label: 'Áo' },
    { id: 'bottom', label: 'Quần' },
    { id: 'dress', label: 'Đầm' },
    { id: 'shoes', label: 'Giày' },
    { id: 'accessory', label: 'Phụ kiện' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* AI Processing Progress */}
        <AIProgressBar progress={aiProgress} isVisible={isProcessing} onCancel={cancelProcessing} />
        
        {/* Clothing Validation Overlay */}
        <ClothingValidationOverlay isVisible={isValidatingClothing} progress={clothingProgress} />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* AI Result Modal */}
        {aiResultImage && (
          <AIResultModal
            resultImage={aiResultImage}
            onClose={handleCloseResult}
            onSavePrivate={() => {
              if (!user) {
                setShowLoginDialog(true);
                return;
              }
              setShowSaveOutfitDialog(true);
            }}
            onShareToPublic={handleShareToPublic}
            onEdit={() => setShowEditResultDialog(true)}
            onRetry={() => {
              handleCloseResult();
              handleAITryOn();
            }}
            onChangePhoto={() => {
              handleCloseResult();
              fileInputRef.current?.click();
            }}
            onFindSimilar={() => setShowFindSimilarSheet(true)}
            onShare={handleShare}
          />
        )}

        <div className="p-4 space-y-4">
          {/* Body Image Section */}
          <div 
            onClick={() => setShowBodyImageSourceDialog(true)}
            className="relative mx-auto w-full aspect-[3/4] max-h-[35vh] rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/50 transition-colors"
          >
            {bodyImage ? (
              <img 
                src={bodyImage} 
                alt="Body" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {/* Silhouette placeholder */}
                <div className="w-24 h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 36" className="w-12 h-20 text-muted-foreground/40">
                    <ellipse cx="12" cy="6" rx="5" ry="5" fill="currentColor" />
                    <path d="M6 12h12l-2 24H8L6 12z" fill="currentColor" />
                  </svg>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Camera size={20} className="text-muted-foreground" />
                  </div>
                  <div className="p-2 rounded-full bg-muted">
                    <ImageIcon size={20} className="text-muted-foreground" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="font-medium text-foreground">Tải ảnh toàn thân</p>
                  <p className="text-sm text-muted-foreground">Chọn từ thư viện hoặc chụp ảnh mới</p>
                </div>
              </div>
            )}
          </div>

          {/* Category Clothing Slots */}
          <div className="grid grid-cols-5 gap-2">
            {categories.map(({ id, label }) => {
              const selectedItem = selectedItems.find(item => item.category === id);
              const IconComponent = categoryIcons[id as keyof typeof categoryIcons] || Shirt;
              
              return (
                <div key={id} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => handleAddClothingForCategory(id)}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center transition-all overflow-hidden",
                      selectedItem 
                        ? "border-primary bg-primary/5" 
                        : "border-border/60 hover:border-primary/50 bg-secondary/30"
                    )}
                  >
                    {selectedItem ? (
                      <img 
                        src={selectedItem.imageUrl} 
                        alt={selectedItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground/60">
                        <IconComponent className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">+</span>
                      </div>
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Quality Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setQuality('standard')}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all",
                quality === 'standard'
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              )}
            >
              Standard
            </button>
            <button
              onClick={() => {
                if (isPro) {
                  setQuality('4k');
                } else {
                  setShowProDialog(true);
                }
              }}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                quality === '4k'
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                  : "border-border bg-card text-muted-foreground hover:border-yellow-500/50"
              )}
            >
              4K Ultra
              {!isPro && <Crown size={14} className="text-yellow-500" />}
            </button>
          </div>

          {/* Quota Indicator */}
          {user && !isUnlimited && (
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                Lượt thử miễn phí hôm nay
              </span>
              <span className={cn(
                "text-sm font-semibold",
                remaining === 0 ? "text-destructive" : "text-primary"
              )}>
                {remaining}/{dailyLimit}
              </span>
            </div>
          )}

          {/* Pro Badge */}
          {user && isUnlimited && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg border border-yellow-500/20">
              <Crown size={16} className="text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">Không giới hạn lượt thử</span>
            </div>
          )}

          {/* Try On Button */}
          <Button
            variant="instagram"
            className="w-full h-12 text-base font-semibold relative overflow-hidden rounded-xl"
            onClick={handleAITryOn}
            disabled={isProcessing || cooldownRemaining > 0 || !bodyImage || selectedItems.length === 0 || (!hasQuotaRemaining && !isUnlimited)}
          >
            {isProcessing || cooldownRemaining > 0 ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {cooldownRemaining > 0 ? `Đang xử lý... (${cooldownRemaining}s)` : 'Đang xử lý...'}
              </>
            ) : !hasQuotaRemaining && !isUnlimited ? (
              <>
                <Crown size={20} />
                Nâng cấp để tiếp tục
              </>
            ) : (
              <>
                <Sparkles size={20} />
                {t('tryon_ai_button')}
                {quality === '4k' && <span className="ml-1 text-xs opacity-80">(4K)</span>}
              </>
            )}
          </Button>
        </div>

        {/* Dialogs */}
        <AddClothingDialog
          isOpen={showAddClothingDialog}
          onClose={() => setShowAddClothingDialog(false)}
          onAddClothing={handleAddClothing}
          onSaveToCollection={(item) => user && saveClothingItem(item)}
          targetCategory={targetCategoryForUpload}
        />

        <SelectCategoryDialog
          isOpen={showCategoryDialog}
          onClose={() => setShowCategoryDialog(false)}
          onSelect={handleCategorySelect}
          imageUrl={pendingUnknownItem?.imageUrl}
        />

        <BodyImageSourceDialog
          open={showBodyImageSourceDialog}
          onOpenChange={setShowBodyImageSourceDialog}
          onUploadNew={() => fileInputRef.current?.click()}
          onSelectFromHistory={(imageUrl) => {
            setBodyImage(imageUrl);
            setAiResultImage(null);
            clearResult();
          }}
          defaultBodyImageUrl={profile?.default_body_image_url}
          onSetDefault={async (imageUrl) => {
            if (user && imageUrl) {
              const success = await setDefaultBodyImage(imageUrl);
              if (success) {
                toast.success('Đã lưu làm ảnh mặc định');
              }
              return success;
            }
            return false;
          }}
        />

        <ShareOutfitDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          imageUrl={aiResultImage || ''}
          title="Outfit thử đồ AI"
        />

        <ShareToPublicDialog
          open={showShareToPublicDialog}
          onOpenChange={setShowShareToPublicDialog}
          resultImageUrl={aiResultImage || ''}
          clothingItems={selectedItems.map(item => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            category: item.category,
            purchaseUrl: item.shopUrl,
          }))}
          onSuccess={() => toast.success('Đã chia sẻ outfit lên trang chủ!')}
        />

        <SaveOutfitDialog
          open={showSaveOutfitDialog}
          onOpenChange={setShowSaveOutfitDialog}
          resultImageUrl={aiResultImage || ''}
          clothingItems={selectedItems.map(item => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            category: item.category,
            purchaseUrl: item.shopUrl,
          }))}
          onSuccess={() => setIsResultSaved(true)}
        />

        <LoginRequiredDialog
          isOpen={showLoginDialog}
          onClose={() => setShowLoginDialog(false)}
        />

        <EditResultDialog
          open={showEditResultDialog}
          onOpenChange={setShowEditResultDialog}
          currentImage={aiResultImage || ''}
          onEdit={handleEditResult}
          isProcessing={isEditingResult}
        />

        <ProSubscriptionDialog
          isOpen={showProDialog}
          onClose={() => setShowProDialog(false)}
        />

        <FindSimilarItemsSheet
          isOpen={showFindSimilarSheet}
          onClose={() => setShowFindSimilarSheet(false)}
          imageUrl={aiResultImage || undefined}
        />
      </DialogContent>
    </Dialog>
  );
};
