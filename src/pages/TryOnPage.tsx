import React, { useState, useRef, useEffect } from 'react';
import { Camera, Share2, Sparkles, Loader2, Shirt, Square, Crown, Footprints, Glasses, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { SelectedClothingList } from '@/components/tryOn/SelectedClothingList';
import { AIProgressBar } from '@/components/tryOn/AIProgressBar';
import { EditResultDialog } from '@/components/tryOn/EditResultDialog';
import { ClothingValidationOverlay } from '@/components/tryOn/ClothingValidationOverlay';
import { AIResultModal } from '@/components/tryOn/AIResultModal';
import { ClothingPanel } from '@/components/tryOn/ClothingPanel';
import { EditClothingDetailsDialog } from '@/components/clothing/EditClothingDetailsDialog';
import { AddClothingDialog } from '@/components/clothing/AddClothingDialog';
import { ShareOutfitDialog } from '@/components/outfit/ShareOutfitDialog';
import { ShareToPublicDialog } from '@/components/outfit/ShareToPublicDialog';
import { SaveOutfitDialog } from '@/components/outfit/SaveOutfitDialog';
import { LoginRequiredDialog } from '@/components/auth/LoginRequiredDialog';
import { SelectCategoryDialog } from '@/components/clothing/SelectCategoryDialog';
import { BodyImageSourceDialog } from '@/components/tryOn/BodyImageSourceDialog';
import { sampleClothing } from '@/data/sampleClothing';
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
import { ProSubscriptionDialog } from '@/components/monetization/ProSubscriptionDialog';
import { FindSimilarItemsSheet } from '@/components/monetization/FindSimilarItemsSheet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Category definitions
const categories: { id: ClothingCategory; icon: React.ElementType; label: string }[] = [
  { id: 'top', icon: Shirt, label: 'Áo' },
  { id: 'bottom', icon: Square, label: 'Quần' },
  { id: 'dress', icon: Crown, label: 'Váy' },
  { id: 'shoes', icon: Footprints, label: 'Giày' },
  { id: 'accessory', icon: Glasses, label: 'Phụ kiện' },
  { id: 'all', icon: MoreHorizontal, label: 'Khác' },
];

const BODY_IMAGE_STORAGE_KEY = 'tryon_body_image';

interface HistoryResultData {
  resultImageUrl: string;
  bodyImageUrl: string;
  clothingItems: Array<{ name: string; imageUrl: string }>;
}

interface TryOnPageProps {
  initialItem?: ClothingItem;
  reuseBodyImage?: string;
  reuseClothingItems?: ClothingItem[];
  historyResult?: HistoryResultData;
  /** URL of garment image for Smart Paste / Quick Try flow */
  initialGarmentUrl?: string;
  /** ID of garment if from internal DB */
  initialGarmentId?: string;
  /** Auto-start try-on when garment and body image are ready */
  autoStart?: boolean;
}

export const TryOnPage = ({ 
  initialItem, 
  reuseBodyImage, 
  reuseClothingItems = [], 
  historyResult,
  initialGarmentUrl,
  initialGarmentId,
  autoStart = false,
}: TryOnPageProps) => {
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
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('top');
  const [clothingSource, setClothingSource] = useState<'sample' | 'saved'>('sample');
  const [clothing] = useState(sampleClothing);
  const [aiResultImage, setAiResultImage] = useState<string | null>(() => {
    return historyResult?.resultImageUrl || null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isResultSaved, setIsResultSaved] = useState(false);
  
  const [editingClothing, setEditingClothing] = useState<ClothingItem | null>(null);
  const [showClothingPanel, setShowClothingPanel] = useState(false);
  const [showAddClothingDialog, setShowAddClothingDialog] = useState(false);
  const [targetCategoryForUpload, setTargetCategoryForUpload] = useState<ClothingCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'color'>('date');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
  const [showProcessingSkeleton, setShowProcessingSkeleton] = useState(false);
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
  const { processVirtualTryOn, isProcessing, clearResult, progress: aiProgress, updateProgress, resetProgress, cancelProcessing } = useAITryOn();
  const { saveTryOnResult } = useTryOnHistory();
  const { userClothing, saveClothingItem, updateClothingItem, deleteClothingItem, isSaving: isSavingClothing } = useUserClothing();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { 
    validateAndProcessClothing, 
    isValidating: isValidatingClothing, 
    progress: clothingProgress,
    mapToAppCategory,
    issueTranslationMap
  } = useClothingValidation();
  const { saveCorrection } = useCategoryCorrections();
  const { profile, setDefaultBodyImage } = useUserProfile();
  const { isPro } = useProSubscription();
  const { remaining, dailyLimit, hasQuotaRemaining, isUnlimited, refreshQuota } = useUserQuota();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

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

  // Update state when reuse props change
  useEffect(() => {
    if (reuseBodyImage) {
      setBodyImage(reuseBodyImage);
    }
  }, [reuseBodyImage]);

  useEffect(() => {
    if (reuseClothingItems.length > 0) {
      setSelectedItems(reuseClothingItems);
    }
  }, [reuseClothingItems]);

  // Update state when historyResult changes
  useEffect(() => {
    if (historyResult) {
      setBodyImage(historyResult.bodyImageUrl);
      setAiResultImage(historyResult.resultImageUrl);
      setSelectedItems(
        historyResult.clothingItems.map((item, index) => ({
          id: `history-${index}`,
          name: item.name,
          imageUrl: item.imageUrl,
          category: 'all' as const,
        }))
      );
      setIsResultSaved(true); // History results are already saved
    }
  }, [historyResult]);

  // Auto-load default body image when user profile loads
  useEffect(() => {
    if (profile?.default_body_image_url && !bodyImage && !reuseBodyImage && !historyResult?.bodyImageUrl) {
      setBodyImage(profile.default_body_image_url);
    }
  }, [profile?.default_body_image_url, bodyImage, reuseBodyImage, historyResult?.bodyImageUrl]);

  // Smart Paste / Quick Try: Auto-load garment from URL
  // REQ-7.2, REQ-7.3, REQ-7.4
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  useEffect(() => {
    if (initialGarmentUrl && !hasAutoStarted) {
      // 1. Create garment item from URL
      const garmentItem: ClothingItem = {
        id: initialGarmentId || `quick-${Date.now()}`,
        name: 'Quick Try Item',
        imageUrl: initialGarmentUrl,
        category: 'all' as const, // AI will detect actual category
      };
      setSelectedItems([garmentItem]);
      
      // 2. Load default body image if available
      if (profile?.default_body_image_url && !bodyImage) {
        setBodyImage(profile.default_body_image_url);
        toast.success(t('quick_try_ready') || 'Outfit loaded! Ready to generate.');
      } else if (!bodyImage) {
        // Show body image prompt if no default
        setShowBodyImageSourceDialog(true);
        toast.info(t('quick_try_need_body') || 'Please select a body image first.');
      }
    }
  }, [initialGarmentUrl, initialGarmentId, profile?.default_body_image_url, hasAutoStarted]);

  // Smart Paste: Auto-start try-on when ready
  // REQ-7.5
  useEffect(() => {
    if (
      autoStart && 
      initialGarmentUrl && 
      bodyImage && 
      selectedItems.length > 0 && 
      !hasAutoStarted &&
      !isProcessing &&
      user &&
      hasQuotaRemaining
    ) {
      setHasAutoStarted(true);
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleAITryOn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, initialGarmentUrl, bodyImage, selectedItems.length, hasAutoStarted, isProcessing, user, hasQuotaRemaining]);

  // Get clothing based on source and filter by search
  const displayedClothing = clothingSource === 'saved' ? userClothing : clothing;
  const filteredByCategory = activeCategory === 'all'
    ? displayedClothing 
    : displayedClothing.filter(c => c.category === activeCategory);
  
  const filteredClothing = searchQuery.trim() 
    ? filteredByCategory.filter(item => {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(query);
        const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));
        return nameMatch || tagMatch;
      })
    : filteredByCategory;

  // Sort clothing items
  const sortedClothing = [...filteredClothing].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'color':
        return (a.color || '').localeCompare(b.color || '');
      case 'date':
      default:
        // Newer items first (assumes id or created_at reflects order)
        return 0; // Keep original order for sample, newer first for saved
    }
  });

  const handleAddBodyImage = () => {
    fileInputRef.current?.click();
  };

  const handleAddClothingFromDevice = () => {
    setTargetCategoryForUpload(null);
    setShowAddClothingDialog(true);
  };

  const handleAddClothingForCategory = (category: ClothingCategory) => {
    setTargetCategoryForUpload(category);
    setShowAddClothingDialog(true);
  };

  const handleClothingFromDialog = (item: ClothingItem) => {
    handleAddClothing(item);
  };

  const handleSaveClothingFromDialog = async (item: ClothingItem) => {
    if (user) {
      await saveClothingItem(item);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBodyImage(event.target?.result as string);
        setAiResultImage(null);
        clearResult();
        toast.success(t('msg_upload_success'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClothingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      
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
            {result.suggestions.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {result.suggestions[0]}
              </div>
            )}
          </div>
        );
        return;
      }
      
      const aiCategory = result.analysis?.category || 'unknown';
      const appCategory = mapToAppCategory(aiCategory);
      
      const baseItem = {
        id: Date.now().toString(),
        name: result.analysis?.subcategory || file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: result.processedImageUrl || imageDataUrl,
        color: result.analysis?.color,
        gender: result.analysis?.gender,
        style: result.analysis?.style,
        pattern: result.analysis?.pattern,
      };
      
      // If category is unknown, show dialog for user to select
      if (appCategory === 'unknown' || appCategory === 'all') {
        setPendingUnknownItem({ 
          item: baseItem, 
          imageUrl: result.processedImageUrl || imageDataUrl,
          aiPredictedCategory: aiCategory,
          imageFeatures: {
            color: result.analysis?.color,
            pattern: result.analysis?.pattern,
            style: result.analysis?.style,
            subcategory: result.analysis?.subcategory,
          }
        });
        setShowCategoryDialog(true);
        return;
      }
      
      const newItem: ClothingItem = {
        ...baseItem,
        category: appCategory,
      };
      
      handleAddClothing(newItem);
      
      if (user) {
        saveClothingItem(newItem);
      }
      
      const genderLabel = result.analysis?.gender === 'male' 
        ? t('msg_gender_male') 
        : result.analysis?.gender === 'female' 
          ? t('msg_gender_female') 
          : '';
          
      const categoryLabel = t(`msg_clothing_category_${appCategory}` as any) || appCategory;
      
      toast.success(
        <div className="space-y-1">
          <p>{t('msg_clothing_detected')} {categoryLabel}</p>
          <p className="text-xs text-muted-foreground">
            {result.analysis?.color && `${t('msg_clothing_color')} ${result.analysis.color}`}
            {genderLabel && ` • ${genderLabel}`}
          </p>
        </div>
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddClothing = (item: ClothingItem) => {
    setSelectedItems(prev => {
      const filtered = prev.filter(i => i.category !== item.category);
      return [...filtered, item];
    });
    toast.success(`${t('msg_item_selected')} ${item.name}`);
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
        
        // Save correction for AI learning
        await saveCorrection(
          pendingUnknownItem.imageUrl,
          pendingUnknownItem.aiPredictedCategory || null,
          category,
          pendingUnknownItem.imageFeatures
        );
      }
      
      const categoryLabel = t(`msg_clothing_category_${category}` as any) || category;
      toast.success(`${t('msg_clothing_detected')} ${categoryLabel}`);
      
      setPendingUnknownItem(null);
    }
  };

  const handleRemoveClothing = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
    toast.success(t('msg_item_removed'));
  };


  const handleDeleteSavedClothing = async (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDeleteClothing = async () => {
    if (pendingDeleteId) {
      await deleteClothingItem(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  const handleEditClothing = (item: ClothingItem) => {
    setEditingClothing(item);
  };

  const handleUpdateClothing = async (updatedItem: ClothingItem) => {
    const success = await updateClothingItem(updatedItem.id, { 
      name: updatedItem.name, 
      tags: updatedItem.tags || [],
      category: updatedItem.category,
      gender: updatedItem.gender,
      shopUrl: updatedItem.shopUrl
    });
    if (success) {
      toast.success(t('clothing_updated'));
    }
    return success;
  };

  const handleAITryOn = async () => {
    // Prevent spam clicks - check cooldown
    if (cooldownRemaining > 0 || isProcessing) {
      return;
    }

    // Check login first
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // Check quota for non-Pro users
    if (!hasQuotaRemaining) {
      toast.error('Bạn đã hết lượt thử miễn phí hôm nay. Nâng cấp Pro để thử không giới hạn!');
      setShowProDialog(true);
      return;
    }

    if (!bodyImage) {
      toast.error(t('msg_upload_body_first'));
      return;
    }

    if (selectedItems.length === 0) {
      toast.error(t('msg_select_clothing'));
      return;
    }

    // Start cooldown timer (minimum 20 seconds)
    const COOLDOWN_SECONDS = 20;
    setCooldownRemaining(COOLDOWN_SECONDS);
    setShowProcessingSkeleton(true);
    
    // Clear any existing timer
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    
    // Start countdown
    cooldownTimerRef.current = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Trigger haptic feedback when starting
    triggerLight();

    // Start progress tracking
    updateProgress('compressing', 5, 'Đang nén hình ảnh...');

    // Import compression utilities
    const { compressImageForAI, fetchAndCompressImage } = await import('@/utils/imageCompression');

    updateProgress('compressing', 15, `Đang xử lý ${selectedItems.length + 1} hình ảnh...`);

    // Process all images in parallel for speed
    const [compressedBodyImage, ...compressedClothingResults] = await Promise.all([
      // Compress body image (larger size for better quality)
      compressImageForAI(bodyImage, 1024, 1024, 0.85),
      // Compress all clothing images in parallel (smaller size for speed)
      ...selectedItems.map(item => 
        fetchAndCompressImage(item.imageUrl, 600, 600, 0.75)
          .then(compressedUrl => ({ imageUrl: compressedUrl, name: item.name }))
          .catch(error => {
            console.error('Error compressing image:', error);
            return { imageUrl: item.imageUrl, name: item.name };
          })
      )
    ]);

    const clothingItemsData = compressedClothingResults as Array<{ imageUrl: string; name: string }>;

    console.log('Starting AI try-on with compressed images:', clothingItemsData.length, 'items');
    const result = await processVirtualTryOn(compressedBodyImage, clothingItemsData);
    
    // Hide skeleton when done
    setShowProcessingSkeleton(false);
    
    if (result?.success && result.generatedImage) {
      // Trigger success haptic
      triggerSuccess();
      
      // Refresh quota after successful try-on
      refreshQuota();
      
      // Clear cooldown on success
      setCooldownRemaining(0);
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      
      setAiResultImage(result.generatedImage);
      setIsResultSaved(false);
      
      if (user) {
        const clothingForHistory = selectedItems.map(item => ({
          name: item.name,
          imageUrl: item.imageUrl,
        }));
        const saved = await saveTryOnResult(user.id, bodyImage, result.generatedImage, clothingForHistory);
        if (saved) {
          setIsResultSaved(true);
        }
      }
    } else {
      // Trigger error haptic on failure
      triggerError();
    }
  };

  const handleSave = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    if (!bodyImage || !aiResultImage) {
      toast.info(t('msg_no_result'));
      return;
    }
    
    if (isResultSaved) {
      toast.info(t('msg_already_saved'));
      return;
    }
    
    setIsSaving(true);
    const clothingItemsData = selectedItems.map(item => ({
      name: item.name,
      imageUrl: item.imageUrl,
    }));
    
    const saved = await saveTryOnResult(user.id, bodyImage, aiResultImage, clothingItemsData);
    if (saved) {
      setIsResultSaved(true);
    }
    setIsSaving(false);
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
    if (aiResultImage) {
      setShowShareToPublicDialog(true);
    }
  };

  const handleCloseResult = () => {
    setAiResultImage(null);
    setIsResultSaved(false);
    clearResult();
  };

  const handleEditResult = async (instruction: string) => {
    if (!aiResultImage) return;
    
    setIsEditingResult(true);
    
    try {
      // Compress clothing images for reference
      const { fetchAndCompressImage } = await import('@/utils/imageCompression');
      
      const compressedClothingItems = await Promise.all(
        selectedItems.map(async (item) => {
          try {
            const compressedUrl = await fetchAndCompressImage(item.imageUrl, 400, 400, 0.7);
            return { imageUrl: compressedUrl, name: item.name };
          } catch {
            return { imageUrl: item.imageUrl, name: item.name };
          }
        })
      );

      const { data, error } = await supabase.functions.invoke('edit-try-on-result', {
        body: {
          currentImage: aiResultImage,
          instruction,
          clothingItems: compressedClothingItems,
        },
      });

      if (error) {
        console.error('Edit function error:', error);
        toast.error('Không thể chỉnh sửa hình ảnh');
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.success && data.editedImage) {
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

  const getClothingProgressMessage = () => {
    if (!clothingProgress) return '';
    switch (clothingProgress.stage) {
      case 'checking_size': return t('msg_checking_size');
      case 'analyzing': return t('msg_analyzing_clothing');
      case 'removing_background': return t('msg_removing_background');
      case 'complete': return t('msg_validation_complete');
      case 'error': return '';
      default: return t('msg_validating_image');
    }
  };

  return (
    <div className="pt-14 pb-24 max-w-md mx-auto bg-background min-h-screen">
      {/* AI Processing Progress Bar */}
      <AIProgressBar progress={aiProgress} isVisible={isProcessing} onCancel={cancelProcessing} />

      {/* Clothing Validation Overlay - Fun Animation */}
      <ClothingValidationOverlay 
        isVisible={isValidatingClothing} 
        progress={clothingProgress} 
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={clothingInputRef}
        type="file"
        accept="image/*"
        onChange={handleClothingFileChange}
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
            handleAddBodyImage();
          }}
          onFindSimilar={() => setShowFindSimilarSheet(true)}
          onShare={handleShare}
        />
      )}

      {/* Share Dialog */}
      {aiResultImage && (
        <ShareOutfitDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          imageUrl={aiResultImage}
          title="Outfit thử đồ AI"
        />
      )}

      {/* Share to Public Dialog */}
      {aiResultImage && (
        <ShareToPublicDialog
          open={showShareToPublicDialog}
          onOpenChange={setShowShareToPublicDialog}
          resultImageUrl={aiResultImage}
          clothingItems={selectedItems.map(item => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            category: item.category,
            purchaseUrl: item.shopUrl,
          }))}
          onSuccess={() => {
            toast.success('Đã chia sẻ outfit lên trang chủ!');
          }}
        />
      )}

      {/* Save Outfit Dialog (Private) */}
      {aiResultImage && (
        <SaveOutfitDialog
          open={showSaveOutfitDialog}
          onOpenChange={setShowSaveOutfitDialog}
          resultImageUrl={aiResultImage}
          clothingItems={selectedItems.map(item => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            category: item.category,
            purchaseUrl: item.shopUrl,
          }))}
          onSuccess={() => {
            setIsResultSaved(true);
          }}
        />
      )}


      {/* Main Content */}
      <div className="px-3 space-y-3">
        {/* Body Image Section - Optimized for mobile */}
        <div className="relative w-full aspect-[3/4] max-h-[40vh] rounded-xl overflow-hidden bg-secondary border border-border">
          <TryOnCanvas
            bodyImageUrl={bodyImage}
            onBodyImageChange={(imageUrl) => {
              setBodyImage(imageUrl);
              setAiResultImage(null);
              clearResult();
              toast.success(t('msg_upload_success'));
            }}
            onOpenSourceDialog={() => setShowBodyImageSourceDialog(true)}
          />
        </div>

        {/* Selected Clothing List - Outfit Slots */}
        <SelectedClothingList 
          items={selectedItems} 
          onRemove={handleRemoveClothing}
          savedClothing={userClothing}
          sampleClothing={clothing}
          onSelectItem={handleAddClothing}
          onAddClothingForCategory={handleAddClothingForCategory}
          onEditClothing={handleEditClothing}
          onDeleteClothing={handleDeleteSavedClothing}
        />

        {/* Quality Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setQuality('standard')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
              quality === 'standard'
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            <span>Standard</span>
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
              "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5",
              quality === '4k'
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                : "border-border bg-card text-muted-foreground hover:border-yellow-500/50"
            )}
          >
            <span>4K Ultra</span>
            {!isPro && <Crown size={14} className="text-yellow-500" />}
          </button>
        </div>

        {/* Quota Indicator */}
        {user && !isUnlimited && (
          <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              Lượt thử miễn phí hôm nay
            </span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-semibold",
                remaining === 0 ? "text-destructive" : "text-primary"
              )}>
                {remaining}/{dailyLimit}
              </span>
              {remaining === 0 && (
                <button
                  onClick={() => setShowProDialog(true)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Nâng cấp Pro
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Pro Badge */}
        {user && isUnlimited && (
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg border border-yellow-500/20">
            <Crown size={16} className="text-yellow-500" />
            <span className="text-sm font-medium text-yellow-600">Không giới hạn lượt thử</span>
          </div>
        )}

        {/* Processing Skeleton - Optimistic UI */}
        {showProcessingSkeleton && !aiResultImage && (
          <div className="relative w-full aspect-[3/4] max-h-[30vh] rounded-xl overflow-hidden bg-secondary border border-border animate-pulse">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Đang xử lý...</p>
                <p className="text-xs text-muted-foreground">AI đang tạo hình ảnh thử đồ</p>
              </div>
            </div>
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>
        )}

        {/* AI Try-On Button */}
        <Button
          variant="instagram"
          className="w-full h-11 text-base relative overflow-hidden"
          onClick={handleAITryOn}
          disabled={isProcessing || cooldownRemaining > 0 || !bodyImage || selectedItems.length === 0 || (!hasQuotaRemaining && !isUnlimited)}
        >
          {isProcessing || cooldownRemaining > 0 ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {cooldownRemaining > 0 ? (
                <span>Đang xử lý... ({cooldownRemaining}s)</span>
              ) : (
                t('tryon_processing')
              )}
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

        {/* Share Button - only show when result exists */}
        {aiResultImage && (
          <Button
            variant="secondary"
            className="w-full h-10"
            onClick={handleShare}
          >
            <Share2 size={18} />
            {t('share')}
          </Button>
        )}
      </div>

      {/* Clothing Panel - Bottom Sheet */}
      <ClothingPanel
        isOpen={showClothingPanel}
        onClose={() => setShowClothingPanel(false)}
        activeCategory={activeCategory}
        clothingSource={clothingSource}
        onClothingSourceChange={(source) => setClothingSource(source)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        clothing={sortedClothing}
        selectedItems={selectedItems}
        userClothingCount={userClothing.length}
        isLoggedIn={!!user}
        onSelectItem={handleAddClothing}
        onEditItem={handleEditClothing}
        onDeleteItem={async (id) => {
          handleDeleteSavedClothing(id);
          return true;
        }}
        categories={categories.map(c => ({ id: c.id, label: c.label }))}
      />

      {/* Edit Clothing Dialog */}
      {editingClothing && (
        <EditClothingDetailsDialog
          item={editingClothing}
          isOpen={!!editingClothing}
          isSaving={isSavingClothing}
          onClose={() => setEditingClothing(null)}
          onSave={handleUpdateClothing}
        />
      )}

      {/* Add Clothing Dialog */}
      <AddClothingDialog
        isOpen={showAddClothingDialog}
        onClose={() => {
          setShowAddClothingDialog(false);
          setTargetCategoryForUpload(null);
        }}
        onAddClothing={handleClothingFromDialog}
        onSaveToCollection={handleSaveClothingFromDialog}
        targetCategory={targetCategoryForUpload}
      />

      {/* Login Required Dialog */}
      <LoginRequiredDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />

      {/* Select Category Dialog */}
      <SelectCategoryDialog
        isOpen={showCategoryDialog}
        onClose={() => {
          setShowCategoryDialog(false);
          setPendingUnknownItem(null);
        }}
        onSelect={handleCategorySelect}
        imageUrl={pendingUnknownItem?.imageUrl}
      />

      {/* Edit Result Dialog */}
      {aiResultImage && (
        <EditResultDialog
          open={showEditResultDialog}
          onOpenChange={setShowEditResultDialog}
          currentImage={aiResultImage}
          onEdit={handleEditResult}
          isProcessing={isEditingResult}
        />
      )}

      {/* Body Image Source Dialog */}
      <BodyImageSourceDialog
        open={showBodyImageSourceDialog}
        onOpenChange={setShowBodyImageSourceDialog}
        onUploadNew={() => {
          // Trigger file input through window reference
          if ((window as any).__tryOnCanvasTriggerFileInput) {
            (window as any).__tryOnCanvasTriggerFileInput();
          }
        }}
        onSelectFromHistory={(imageUrl) => {
          setBodyImage(imageUrl);
          setAiResultImage(null);
          clearResult();
          toast.success(t('msg_upload_success'));
        }}
        defaultBodyImageUrl={profile?.default_body_image_url}
        onSetDefault={setDefaultBodyImage}
      />

      {/* Delete Confirmation Dialog */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-lg border border-border space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('confirm_delete_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('confirm_delete_clothing')}</p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPendingDeleteId(null)}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDeleteClothing}
              >
                {t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Subscription Dialog */}
      <ProSubscriptionDialog
        isOpen={showProDialog}
        onClose={() => setShowProDialog(false)}
      />

      {/* Find Similar Items Sheet */}
      <FindSimilarItemsSheet
        isOpen={showFindSimilarSheet}
        onClose={() => setShowFindSimilarSheet(false)}
        imageUrl={aiResultImage || undefined}
      />
    </div>
  );
};
