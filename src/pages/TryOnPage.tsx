import { useState, useRef, useEffect } from 'react';
import { Camera, Save, Share2, Sparkles, Loader2, X, Download, Heart, Trash2, Edit2, ImagePlus, Shirt, Square, Crown, Footprints, Glasses, MoreHorizontal, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { SelectedClothingList } from '@/components/tryOn/SelectedClothingList';
import { EditClothingDialog } from '@/components/clothing/EditClothingDialog';
import { AddClothingDialog } from '@/components/clothing/AddClothingDialog';
import { ShareOutfitDialog } from '@/components/outfit/ShareOutfitDialog';
import { ShareToPublicDialog } from '@/components/outfit/ShareToPublicDialog';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAITryOn } from '@/hooks/useAITryOn';
import { useTryOnHistory } from '@/hooks/useTryOnHistory';
import { useUserClothing } from '@/hooks/useUserClothing';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClothingValidation } from '@/hooks/useClothingValidation';
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
    // Priority: reuseBodyImage > localStorage
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareToPublicDialog, setShowShareToPublicDialog] = useState(false);
  const { processVirtualTryOn, isProcessing, clearResult } = useAITryOn();
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
  
  // Filter by search query (name or tags)
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
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      
      // Validate clothing image with AI
      const result = await validateAndProcessClothing(imageDataUrl, { 
        removeBackground: true, 
        language 
      });
      
      if (!result.isValid) {
        // Show errors with suggestions
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
      
      // Get category from AI analysis
      const aiCategory = result.analysis?.category || 'top';
      const appCategory = mapToAppCategory(aiCategory);
      
      // Create clothing item with AI-detected info
      const newItem: ClothingItem = {
        id: Date.now().toString(),
        name: result.analysis?.subcategory || file.name.replace(/\.[^/.]+$/, ''),
        category: appCategory,
        imageUrl: result.processedImageUrl || imageDataUrl,
        color: result.analysis?.color,
        gender: result.analysis?.gender,
        style: result.analysis?.style,
        pattern: result.analysis?.pattern,
      };
      
      handleAddClothing(newItem);
      
      // Store pending item and ask if user wants to save
      if (user) {
        setPendingClothingToSave(newItem);
      }
      
      // Show success toast with detected info
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
    
    // Clear input for re-upload
    e.target.value = '';
  };

  const handleAddClothing = (item: ClothingItem) => {
    // Replace item of same category or add new
    setSelectedItems(prev => {
      const filtered = prev.filter(i => i.category !== item.category);
      return [...filtered, item];
    });
    toast.success(`${t('msg_item_selected')} ${item.name}`);
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
    if (!bodyImage) {
      toast.error(t('msg_upload_body_first'));
      return;
    }

    if (selectedItems.length === 0) {
      toast.error(t('msg_select_clothing'));
      return;
    }

    // Convert all selected items to base64 if needed
    const clothingItemsData: Array<{ imageUrl: string; name: string }> = [];
    
    for (const item of selectedItems) {
      let imageData = item.imageUrl;
      
      if (item.imageUrl.startsWith('http')) {
        try {
          const response = await fetch(item.imageUrl);
          const blob = await response.blob();
          imageData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting image:', error);
          toast.error(`${t('msg_image_load_error')} ${item.name}`);
          return;
        }
      }
      
      clothingItemsData.push({ imageUrl: imageData, name: item.name });
    }

    const result = await processVirtualTryOn(bodyImage, clothingItemsData);
    
    if (result?.success && result.generatedImage) {
      setAiResultImage(result.generatedImage);
      setIsResultSaved(false);
      
      // Auto-save to history if user is logged in
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
      toast.error(t('msg_login_required'));
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
      toast.error(t('msg_login_required'));
      return;
    }
    if (aiResultImage) {
      setShowShareToPublicDialog(true);
    }
  };

  const handleDownloadResult = () => {
    if (aiResultImage) {
      const link = document.createElement('a');
      link.href = aiResultImage;
      link.download = 'virtual-try-on-result.png';
      link.click();
      toast.success(t('msg_downloaded'));
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
    <div className="pb-24 pt-16 max-w-md mx-auto">
      {/* Clothing Validation Overlay */}
      {isValidatingClothing && clothingProgress && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl p-6 max-w-xs w-full shadow-medium space-y-4">
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
        <div className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-md flex items-center justify-center p-4 animate-scale-in">
          <div className="relative max-w-sm w-full max-h-[85vh]">
            {/* Close button */}
            <button
              onClick={handleCloseResult}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-card/40 transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Image container */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={aiResultImage} 
                alt="AI Try-On Result" 
                className="w-full max-h-[75vh] object-contain bg-card"
              />
              
              {/* Floating action buttons - bottom right corner */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                {/* Change photo button */}
                <button
                  onClick={() => {
                    handleCloseResult();
                    handleAddBodyImage();
                  }}
                  className="w-11 h-11 rounded-full bg-card border-2 border-primary text-primary flex items-center justify-center shadow-lg hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 active:scale-95"
                  title={t('tryon_change_photo')}
                >
                  <Camera size={18} />
                </button>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-11 h-11 rounded-full bg-card border border-border text-foreground flex items-center justify-center shadow-lg hover:bg-secondary transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  title={t('save')}
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                </button>

                {/* Share to public button */}
                <button
                  onClick={handleShareToPublic}
                  className="w-11 h-11 rounded-full bg-card border border-border text-foreground flex items-center justify-center shadow-lg hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 active:scale-95"
                  title="Chia sẻ công khai"
                >
                  <Globe size={18} />
                </button>

                {/* Share button */}
                <button
                  onClick={handleShare}
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                  title={t('share')}
                >
                  <Share2 size={18} />
                </button>
              </div>

              {/* Success indicator */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium flex items-center gap-1.5">
                <Sparkles size={12} />
                {t('tryon_result_title')}
              </div>
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
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl p-5 max-w-xs w-full shadow-medium space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
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
                variant="default"
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

      {/* Main content - Full width body image */}
      <div className="px-4">
        <div className="w-full aspect-[3/4] max-h-[60vh]">
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
      </div>

      {/* Clothing Panel - Shows when category is selected */}
      {showClothingPanel && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-card border-t border-border rounded-t-2xl shadow-medium animate-slide-up max-h-[50vh] flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {categories.find(c => c.id === activeCategory)?.label || t('clothing_sample')}
              </span>
              {user && (
                <Tabs value={clothingSource} onValueChange={(v) => setClothingSource(v as 'sample' | 'saved')} className="ml-2">
                  <TabsList className="h-7 p-0.5">
                    <TabsTrigger value="sample" className="text-[10px] h-6 px-2">
                      {t('clothing_sample')}
                    </TabsTrigger>
                    <TabsTrigger value="saved" className="text-[10px] h-6 px-2">
                      {t('clothing_saved')} ({userClothing.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setShowClothingPanel(false)}
            >
              <X size={18} />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="px-4 py-2 border-b border-border">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search_clothing')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          {/* Clothing Grid */}
          <div className="flex-1 overflow-y-auto p-4">
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
                    {/* Action buttons for saved clothing */}
                    {clothingSource === 'saved' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClothing(item);
                          }}
                          className="absolute top-1 left-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-soft"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSavedClothing(item.id);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-soft"
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
      )}

      {/* Bottom Category Bar */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add clothing button */}
          <button
            onClick={handleAddClothingFromDevice}
            className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            <ImagePlus size={20} />
            <span className="text-[9px] mt-1">Thêm đồ</span>
          </button>
          
          {/* Category buttons */}
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id && showClothingPanel;
            
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setShowClothingPanel(true);
                }}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all",
                  isActive 
                    ? "gradient-primary text-primary-foreground shadow-soft scale-105" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon size={20} />
                <span className="text-[9px] mt-1">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Clothing List */}
      <div className="px-4 mt-3">
        <SelectedClothingList 
          items={selectedItems} 
          onRemove={handleRemoveClothing}
          savedClothing={userClothing}
          sampleClothing={clothing}
          onSelectItem={handleAddClothing}
        />
      </div>

      {/* Action buttons */}
      <div className="px-4 mt-4 space-y-4">
        {/* AI Try-On Button */}
        <Button
          variant="default"
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

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAddBodyImage}
          >
            <Camera size={18} />
            {bodyImage ? t('tryon_change_photo') : t('tryon_upload_photo')}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleSave}
          >
            <Save size={18} />
            {t('save')}
          </Button>
          <Button
            variant="accent"
            size="icon"
            onClick={handleShare}
          >
            <Share2 size={18} />
          </Button>
        </div>
      </div>

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
        onClose={() => setShowAddClothingDialog(false)}
        onAddClothing={handleClothingFromDialog}
        onSaveToCollection={handleSaveClothingFromDialog}
      />
    </div>
  );
};
