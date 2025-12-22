import { useState, useRef, useEffect } from 'react';
import { Camera, Save, Share2, Sparkles, Loader2, X, Heart, Trash2, Edit2, ImagePlus, Shirt, Square, Crown, Footprints, Glasses, MoreHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { SelectedClothingList } from '@/components/tryOn/SelectedClothingList';
import { AIProgressBar } from '@/components/tryOn/AIProgressBar';
import { EditClothingDialog } from '@/components/clothing/EditClothingDialog';
import { AddClothingDialog } from '@/components/clothing/AddClothingDialog';
import { ShareOutfitDialog } from '@/components/outfit/ShareOutfitDialog';
import { ShareToPublicDialog } from '@/components/outfit/ShareToPublicDialog';
import { LoginRequiredDialog } from '@/components/auth/LoginRequiredDialog';
import { SelectCategoryDialog } from '@/components/clothing/SelectCategoryDialog';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAITryOn } from '@/hooks/useAITryOn';
import { useTryOnHistory } from '@/hooks/useTryOnHistory';
import { useUserClothing } from '@/hooks/useUserClothing';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClothingValidation } from '@/hooks/useClothingValidation';
import { useCategoryCorrections } from '@/hooks/useCategoryCorrections';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

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

interface TryOnPageProps {
  initialItem?: ClothingItem;
  reuseBodyImage?: string;
  reuseClothingItems?: ClothingItem[];
}

export const TryOnPage = ({ initialItem, reuseBodyImage, reuseClothingItems = [] }: TryOnPageProps) => {
  const [bodyImage, setBodyImage] = useState<string | undefined>(() => {
    if (reuseBodyImage) return reuseBodyImage;
    try {
      return localStorage.getItem(BODY_IMAGE_STORAGE_KEY) || undefined;
    } catch {
      return undefined;
    }
  });
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>(() => {
    if (reuseClothingItems.length > 0) return reuseClothingItems;
    if (initialItem) return [initialItem];
    return [];
  });
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('top');
  const [clothingSource, setClothingSource] = useState<'sample' | 'saved'>('sample');
  const [clothing] = useState(sampleClothing);
  const [aiResultImage, setAiResultImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [pendingClothingToSave, setPendingClothingToSave] = useState<ClothingItem | null>(null);
  const [editingClothing, setEditingClothing] = useState<ClothingItem | null>(null);
  const [showClothingPanel, setShowClothingPanel] = useState(false);
  const [showAddClothingDialog, setShowAddClothingDialog] = useState(false);
  const [targetCategoryForUpload, setTargetCategoryForUpload] = useState<ClothingCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareToPublicDialog, setShowShareToPublicDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
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
  const { processVirtualTryOn, isProcessing, clearResult, progress: aiProgress, updateProgress, resetProgress } = useAITryOn();
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

  const handleSaveClothingFromDialog = (item: ClothingItem) => {
    if (user) {
      setPendingClothingToSave(item);
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
        setPendingClothingToSave(newItem);
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
        setPendingClothingToSave(newItem);
        
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

  const handleSaveClothingToCollection = async () => {
    if (!pendingClothingToSave) return;
    await saveClothingItem(pendingClothingToSave);
    setPendingClothingToSave(null);
  };

  const handleDeleteSavedClothing = async (id: string) => {
    await deleteClothingItem(id);
  };

  const handleEditClothing = (item: ClothingItem) => {
    setEditingClothing(item);
  };

  const handleUpdateClothing = async (id: string, updates: { name: string; tags: string[] }) => {
    const success = await updateClothingItem(id, updates);
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
      <AIProgressBar progress={aiProgress} isVisible={isProcessing} />

      {/* Clothing Validation Overlay */}
      {isValidatingClothing && clothingProgress && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-xl p-6 max-w-xs w-full shadow-medium space-y-4 border border-border">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-foreground">{t('msg_analyzing_clothing')}</p>
              <p className="text-sm text-muted-foreground">{getClothingProgressMessage()}</p>
            </div>
            <Progress value={clothingProgress.progress} className="h-2" />
          </div>
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
            <button onClick={handleShare} className="text-primary press-effect">
              <Share2 size={22} />
            </button>
          </div>

          {/* Result Image */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img 
              src={aiResultImage} 
              alt="AI Try-On Result" 
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          {/* Action Bar - Instagram style */}
          <div className="border-t border-border p-4 space-y-4 safe-bottom">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving || isResultSaved}
                className="press-effect"
              >
                <Heart 
                  size={26} 
                  strokeWidth={1.5}
                  className={cn(isResultSaved && "fill-accent text-accent")} 
                />
              </button>
              <button onClick={handleShare} className="press-effect">
                <Share2 size={24} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleCloseResult();
                  handleAddBodyImage();
                }}
              >
                <Camera size={18} />
                {t('tryon_change_photo')}
              </Button>
              <Button
                variant="instagram"
                className="flex-1"
                onClick={handleShareToPublic}
              >
                Đăng lên
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

      {/* Save Clothing Dialog */}
      {pendingClothingToSave && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-xl p-5 max-w-xs w-full shadow-medium space-y-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                <img 
                  src={pendingClothingToSave.imageUrl} 
                  alt={pendingClothingToSave.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{pendingClothingToSave.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pendingClothingToSave.color && `${pendingClothingToSave.color}`}
                  {pendingClothingToSave.gender && pendingClothingToSave.gender !== 'unknown' && ` • ${
                    pendingClothingToSave.gender === 'male' ? t('msg_gender_male') : 
                    pendingClothingToSave.gender === 'female' ? t('msg_gender_female') : 'Unisex'
                  }`}
                </p>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {t('msg_save_clothing_question')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPendingClothingToSave(null)}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="instagram"
                className="flex-1"
                onClick={handleSaveClothingToCollection}
                disabled={isSavingClothing}
              >
                {isSavingClothing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Heart size={16} />
                )}
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
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
        />

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
            </>
          )}
        </Button>

        {/* Secondary Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={handleAddBodyImage}
          >
            <Camera size={18} />
            {bodyImage ? t('tryon_change_photo') : t('tryon_upload_photo')}
          </Button>
          {aiResultImage && (
            <Button
              variant="secondary"
              className="flex-1 h-11"
              onClick={handleShare}
            >
              <Share2 size={18} />
              {t('share')}
            </Button>
          )}
        </div>
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
            
            {/* Search Bar */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('search_clothing')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
            
            {/* Clothing Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredClothing.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {clothingSource === 'saved' ? t('no_saved_clothing') : t('no_clothing')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredClothing.map((item) => (
                    <div key={item.id} className="relative group">
                      <ClothingCard
                        item={item}
                        size="md"
                        onSelect={(item) => {
                          handleAddClothing(item);
                          setShowClothingPanel(false);
                        }}
                        isSelected={selectedItems.some(i => i.id === item.id)}
                      />
                      {clothingSource === 'saved' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClothing(item);
                            }}
                            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSavedClothing(item.id);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Clothing Dialog */}
      {editingClothing && (
        <EditClothingDialog
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
    </div>
  );
};
