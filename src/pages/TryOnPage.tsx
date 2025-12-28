import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, Share2, Sparkles, Loader2, X, Heart, Trash2, Edit2, ImagePlus, Shirt, Square, Crown, Footprints, Glasses, MoreHorizontal, Search, Wand2, Bookmark, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { SelectedClothingList } from '@/components/tryOn/SelectedClothingList';
import { AIProgressBar } from '@/components/tryOn/AIProgressBar';
import { EditResultDialog } from '@/components/tryOn/EditResultDialog';
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
import { ProSubscriptionDialog } from '@/components/monetization/ProSubscriptionDialog';
import { FindSimilarItemsSheet, SAMPLE_AFFILIATE_PRODUCTS } from '@/components/monetization/FindSimilarItemsSheet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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
}

export const TryOnPage = ({ initialItem, reuseBodyImage, reuseClothingItems = [], historyResult }: TryOnPageProps) => {
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

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
    // Check login first
    if (!user) {
      setShowLoginDialog(true);
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
    
    if (result?.success && result.generatedImage) {
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
      {isValidatingClothing && clothingProgress && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-xl p-6 max-w-xs w-full shadow-medium space-y-4 border border-border">
            {/* Lottie Animation */}
            <div className="flex justify-center">
              <div className="w-24 h-24 relative">
                <DotLottieReact
                  src="https://lottie.host/0c5e8c0a-6af5-4b32-bdbd-25d0d04f7980/W8dWzCXoD9.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="absolute -top-1 -right-1 text-xl animate-bounce">
                  {clothingProgress.stage === 'analyzing' ? '🔍' : 
                   clothingProgress.stage === 'removing_background' ? '✂️' : '👗'}
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="text-center space-y-2">
              <p className="font-semibold text-foreground text-lg">
                {clothingProgress.stage === 'analyzing' ? '🧠 AI đang ngắm nghía...' :
                 clothingProgress.stage === 'removing_background' ? '✨ Đang tách nền xinh xắn...' :
                 clothingProgress.stage === 'checking_size' ? '📏 Đang đo đạc...' :
                 '👗 Đang xử lý quần áo...'}
              </p>
              <p className="text-sm text-muted-foreground">
                {clothingProgress.stage === 'analyzing' ? 'Hmm, món đồ này đẹp thế!' :
                 clothingProgress.stage === 'removing_background' ? 'Cắt cho gọn gàng nào!' :
                 clothingProgress.stage === 'checking_size' ? 'Kiểm tra kích thước...' :
                 'Sắp xong rồi đó!'}
              </p>
            </div>
            
            {/* Fun Progress Bar */}
            <div className="space-y-2">
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                  style={{
                    width: `${clothingProgress.progress}%`,
                    background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                      animation: 'shimmer 1.5s infinite',
                    }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-sm transition-all duration-500"
                  style={{ left: `calc(${Math.max(8, clothingProgress.progress)}% - 10px)` }}
                >
                  {clothingProgress.progress < 100 ? '👕' : '🎉'}
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground font-medium">
                {clothingProgress.progress}%
              </p>
            </div>
            
            {/* Animated dots */}
            <div className="flex justify-center gap-1.5 pt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  style={{
                    animation: 'bounce 1s infinite',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
          
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-border">
            <button onClick={handleCloseResult} className="text-foreground press-effect">
              <X size={24} />
            </button>
            <span className="font-semibold text-foreground">{t('tryon_result_title')}</span>
            <div className="w-6" />
          </div>

          {/* Result Image - Single image only */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img 
              src={aiResultImage} 
              alt="AI Try-On Result" 
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          {/* Action Bar - Reorganized */}
          <div className="border-t border-border p-4 space-y-3 safe-bottom">
            {/* Primary actions row */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (!user) {
                    setShowLoginDialog(true);
                    return;
                  }
                  setShowSaveOutfitDialog(true);
                }}
              >
                <Bookmark size={18} />
                Lưu riêng
              </Button>
              <Button
                variant="instagram"
                className="flex-1"
                onClick={handleShareToPublic}
              >
                <Share2 size={18} />
                Đăng lên
              </Button>
            </div>
            
            {/* Secondary actions row */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditResultDialog(true)}
              >
                <Wand2 size={18} />
                Chỉnh sửa
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleCloseResult();
                  handleAITryOn();
                }}
              >
                <Sparkles size={18} />
                Thử lại
              </Button>
            </div>
            
            {/* Tertiary actions row */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground"
                onClick={() => {
                  handleCloseResult();
                  handleAddBodyImage();
                }}
              >
                <Camera size={16} />
                Đổi ảnh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground"
                onClick={() => setShowFindSimilarSheet(true)}
              >
                <Search size={16} />
                Tìm đồ tương tự
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground"
                onClick={handleShare}
              >
                <Share2 size={16} />
                Chia sẻ
              </Button>
            </div>
          </div>
        </div>
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
      <div className="px-4 space-y-4">
        {/* Body Image Section - Compact */}
        <div className="relative w-full aspect-[3/4] max-h-[45vh] rounded-xl overflow-hidden bg-secondary border border-border">
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
              "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
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
              "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5",
              quality === '4k'
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                : "border-border bg-card text-muted-foreground hover:border-yellow-500/50"
            )}
          >
            <span>4K Ultra</span>
            {!isPro && <Crown size={14} className="text-yellow-500" />}
          </button>
        </div>

        {/* AI Try-On Button */}
        <Button
          variant="instagram"
          className="w-full h-12 text-base"
          onClick={handleAITryOn}
          disabled={isProcessing || !bodyImage || selectedItems.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {t('tryon_processing')}
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
            className="w-full h-11"
            onClick={handleShare}
          >
            <Share2 size={18} />
            {t('share')}
          </Button>
        )}
      </div>

      {/* Clothing Panel - Bottom Sheet */}
      {showClothingPanel && (
        <div className="fixed inset-0 z-40 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setShowClothingPanel(false)}
          />
          
          {/* Panel */}
          <div className="absolute inset-x-0 bottom-0 bg-card border-t border-border rounded-t-2xl max-h-[60vh] flex flex-col animate-slide-in-up safe-bottom">
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {categories.find(c => c.id === activeCategory)?.label || t('clothing_sample')}
                </span>
                {user && (
                  <Tabs value={clothingSource} onValueChange={(v) => setClothingSource(v as 'sample' | 'saved')}>
                    <TabsList className="h-7 p-0.5">
                      <TabsTrigger value="sample" className="text-xs h-6 px-2">
                        {t('clothing_sample')}
                      </TabsTrigger>
                      <TabsTrigger value="saved" className="text-xs h-6 px-2">
                        {t('clothing_saved')} ({userClothing.length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>
              <button
                onClick={() => setShowClothingPanel(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Search Bar + Sort */}
            <div className="px-4 py-3 flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('search_clothing')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              {clothingSource === 'saved' && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'color')}
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="date">{t('sort_by_date')}</option>
                  <option value="name">{t('sort_by_name')}</option>
                  <option value="color">{t('sort_by_color')}</option>
                </select>
              )}
            </div>
            
            {/* Clothing Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {sortedClothing.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {clothingSource === 'saved' ? t('no_saved_clothing') : t('no_clothing')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {sortedClothing.map((item) => (
                    <ClothingCard
                      key={item.id}
                      item={item}
                      size="md"
                      onSelect={(item) => {
                        handleAddClothing(item);
                        setShowClothingPanel(false);
                      }}
                      isSelected={selectedItems.some(i => i.id === item.id)}
                      showActions={clothingSource === 'saved'}
                      onEdit={clothingSource === 'saved' ? handleEditClothing : undefined}
                      onDelete={clothingSource === 'saved' ? async (id) => {
                        handleDeleteSavedClothing(id);
                        return true;
                      } : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        products={SAMPLE_AFFILIATE_PRODUCTS}
      />
    </div>
  );
};
