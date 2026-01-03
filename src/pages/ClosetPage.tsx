import { useState, useEffect } from 'react';
import { Shirt, Heart, ShoppingBag, Check, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/LoadingState';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { sampleClothing } from '@/data/sampleClothing';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserClothing } from '@/hooks/useUserClothing';
import { ClothingItemActions } from '@/components/clothing/ClothingItemActions';
import { EditClothingDialog } from '@/components/clothing/EditClothingDialog';

interface OutfitHistory {
  id: string;
  body_image_url: string;
  result_image_url: string;
  clothing_items: { name: string; imageUrl: string }[];
  created_at: string;
  is_favorite: boolean;
}

interface UserClothingWithPurchased extends ClothingItem {
  is_purchased: boolean;
  purchase_url?: string;
}

type OwnershipFilter = 'all' | 'owned' | 'not_owned';

interface CategoryOption {
  id: ClothingCategory;
  label: string;
  icon: React.ReactNode;
}

// Categories are defined dynamically using translations

interface ClosetPageProps {
  onNavigateToTryOn?: () => void;
}

export const ClosetPage = ({ onNavigateToTryOn }: ClosetPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  // Use the useUserClothing hook for clothing management
  const { 
    userClothing, 
    isLoading: isLoadingUserClothing, 
    isSaving, 
    updateClothingItem, 
    deleteClothingItem 
  } = useUserClothing();

  const categories: CategoryOption[] = [
    { id: 'top', label: t('slot_top'), icon: <Shirt size={20} /> },
    { id: 'bottom', label: t('slot_bottom'), icon: <span className="text-lg">👖</span> },
    { id: 'dress', label: t('slot_dress'), icon: <span className="text-lg">👗</span> },
    { id: 'shoes', label: t('slot_shoes'), icon: <span className="text-lg">👟</span> },
    { id: 'accessory', label: t('slot_accessory'), icon: <span className="text-lg">👓</span> },
  ];
  const [activeMainTab, setActiveMainTab] = useState<'clothing' | 'outfits'>('clothing');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>('top');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  
  // Edit dialog state
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [userClothingItems, setUserClothingItems] = useState<UserClothingWithPurchased[]>([]);
  const [outfits, setOutfits] = useState<OutfitHistory[]>([]);
  const [isLoadingClothing, setIsLoadingClothing] = useState(true);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true);

  // Sample clothing data
  const allClothing = sampleClothing;

  // Sync userClothingItems with useUserClothing hook data
  useEffect(() => {
    if (!user) {
      setUserClothingItems([]);
      setIsLoadingClothing(false);
      return;
    }

    // Map userClothing from hook to UserClothingWithPurchased format
    setUserClothingItems(userClothing.map(item => ({
      ...item,
      is_purchased: false, // Default value, can be enhanced later
      purchase_url: undefined,
    })));
    setIsLoadingClothing(isLoadingUserClothing);
  }, [user, userClothing, isLoadingUserClothing]);

  // Fetch outfit history
  useEffect(() => {
    if (!user) {
      setOutfits([]);
      setIsLoadingOutfits(false);
      return;
    }

    const fetchOutfits = async () => {
      setIsLoadingOutfits(true);
      const { data, error } = await supabase
        .from('try_on_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching outfits:', error);
        toast.error(t('history_cannot_load'));
      } else {
        setOutfits(data?.map(item => ({
          id: item.id,
          body_image_url: item.body_image_url,
          result_image_url: item.result_image_url,
          clothing_items: (item.clothing_items as { name: string; imageUrl: string }[]) || [],
          created_at: item.created_at,
          is_favorite: item.is_favorite ?? false,
        })) || []);
      }
      setIsLoadingOutfits(false);
    };

    fetchOutfits();
  }, [user]);

  // Toggle purchased status
  const togglePurchased = async (itemId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('user_clothing')
      .update({ is_purchased: !currentStatus })
      .eq('id', itemId);

    if (error) {
      toast.error(t('closet_cannot_update'));
    } else {
      setUserClothingItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_purchased: !currentStatus } : item
      ));
      toast.success(currentStatus ? t('closet_moved_to_wishlist') : t('closet_marked_bought'));
    }
  };

  // Toggle favorite outfit
  const toggleFavorite = async (outfitId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('try_on_history')
      .update({ is_favorite: !currentStatus })
      .eq('id', outfitId);

    if (error) {
      toast.error(t('closet_cannot_update_fav'));
    } else {
      setOutfits(prev => prev.map(item => 
        item.id === outfitId ? { ...item, is_favorite: !currentStatus } : item
      ));
      toast.success(currentStatus ? t('closet_removed_fav') : t('closet_added_fav'));
    }
  };

  // Edit handlers
  const handleEditItem = (item: ClothingItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: { name: string; tags: string[] }): Promise<boolean> => {
    const success = await updateClothingItem(id, updates);
    if (success) {
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast.success(t('clothing_updated') || 'Đã cập nhật quần áo');
    }
    return success;
  };

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  // Delete handler
  const handleDeleteItem = async (id: string): Promise<boolean> => {
    const success = await deleteClothingItem(id);
    return success;
  };

  // Get user owned item IDs
  const userOwnedIds = new Set(userClothingItems.map(item => item.id));

  // Combine and filter clothing by category and ownership
  const getFilteredClothing = () => {
    // Filter by category first
    const categoryFiltered = allClothing.filter(item => item.category === selectedCategory);
    const userCategoryFiltered = userClothingItems.filter(item => item.category === selectedCategory);
    
    // Combine sample clothing with user clothing (user items take priority)
    const combinedItems = [...userCategoryFiltered];
    
    // Add sample items that aren't duplicated
    categoryFiltered.forEach(item => {
      if (!userOwnedIds.has(item.id)) {
        combinedItems.push({
          ...item,
          is_purchased: false,
          purchase_url: item.shopUrl,
        } as UserClothingWithPurchased);
      }
    });

    // Apply ownership filter
    if (ownershipFilter === 'owned') {
      return combinedItems.filter(item => userOwnedIds.has(item.id));
    } else if (ownershipFilter === 'not_owned') {
      return combinedItems.filter(item => !userOwnedIds.has(item.id));
    }
    
    return combinedItems;
  };

  const filteredClothing = getFilteredClothing();

  // Filter outfits (favorites only option)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const filteredOutfits = showFavoritesOnly ? outfits.filter(o => o.is_favorite) : outfits;

  if (authLoading) {
    return (
      <LoadingState variant="page" message={t('loading')} className="min-h-[60vh]" />
    );
  }

  if (!user) {
    return (
      <div className="pb-24 pt-16 px-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <ShoppingBag size={64} className="text-muted-foreground" />
          <h2 className="text-xl font-display font-bold">{t('closet_login_to_view')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('closet_login_required')}
          </p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">
            {t('closet_login_now')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-16 max-w-lg mx-auto">
      <div className="px-4 space-y-4">
        {/* Main Tabs */}
        <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as 'clothing' | 'outfits')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="clothing" className="gap-2">
              <Shirt size={16} />
              {t('closet_clothing')}
            </TabsTrigger>
            <TabsTrigger value="outfits" className="gap-2">
              <Heart size={16} />
              {t('closet_saved_outfits')}
            </TabsTrigger>
          </TabsList>

          {/* Clothing Tab */}
          <TabsContent value="clothing" className="space-y-4 mt-4">
            {/* Category Slider with Add Button */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {/* Add New Button */}
              <button
                onClick={onNavigateToTryOn}
                className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus size={20} />
                <span className="text-[10px] mt-0.5">{t('closet_add')}</span>
              </button>
              
              {/* Category Buttons */}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all",
                    selectedCategory === cat.id
                      ? "bg-foreground text-background shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat.icon}
                  <span className="text-[10px] mt-0.5 font-medium">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Ownership Filter Chips */}
            <div className="flex gap-2">
              <button
                onClick={() => setOwnershipFilter('all')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  ownershipFilter === 'all'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t('closet_all')}
              </button>
              <button
                onClick={() => setOwnershipFilter('owned')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  ownershipFilter === 'owned'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Check size={14} />
                {t('closet_in_closet')}
              </button>
              <button
                onClick={() => setOwnershipFilter('not_owned')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  ownershipFilter === 'not_owned'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <ShoppingBag size={14} />
                {t('closet_not_bought')}
              </button>
            </div>

            {/* Clothing Grid */}
            {isLoadingClothing ? (
              <LoadingState variant="skeleton" skeletonCount={6} />
            ) : filteredClothing.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Shirt size={48} className="text-muted-foreground" />
                <p className="text-muted-foreground">{t('closet_no_clothing')}</p>
                <Button variant="outline" size="sm" onClick={onNavigateToTryOn} className="gap-1">
                  <Plus size={14} />
                  {t('closet_add_new')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredClothing.map((item) => {
                  const isOwned = userOwnedIds.has(item.id);
                  const purchaseUrl = item.purchase_url || item.shopUrl;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="bg-card rounded-xl overflow-hidden border border-border shadow-sm"
                    >
                      <div className="relative aspect-square bg-muted">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                        
                        {/* Action Menu for owned items */}
                        {isOwned && (
                          <div className="absolute top-2 right-2">
                            <ClothingItemActions
                              item={item}
                              onEdit={handleEditItem}
                              onDelete={handleDeleteItem}
                              showHiddenOption={false}
                            />
                          </div>
                        )}
                        
                        {/* Buy Link Badge */}
                        {!isOwned && purchaseUrl && (
                          <a
                            href={purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            {t('closet_buy')}
                            <ExternalLink size={10} />
                          </a>
                        )}
                        
                        {/* Owned Badge - moved to bottom right for owned items */}
                        {isOwned && (
                          <button
                            onClick={() => togglePurchased(item.id, (item as UserClothingWithPurchased).is_purchased)}
                            className={cn(
                              "absolute bottom-2 right-2 p-1.5 rounded-full transition-colors",
                              (item as UserClothingWithPurchased).is_purchased
                                ? "bg-green-500 text-white" 
                                : "bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {(item as UserClothingWithPurchased).is_purchased ? <Check size={14} /> : <ShoppingBag size={14} />}
                          </button>
                        )}
                        
                        {/* Price Badge */}
                        {item.price && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-medium">
                            {item.price}
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        {item.shopName && (
                          <p className="text-[10px] text-muted-foreground truncate">{item.shopName}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Outfits Tab */}
          <TabsContent value="outfits" className="space-y-4 mt-4">
            {/* Favorite Filter */}
            <div className="flex gap-2">
              <Button 
                variant={!showFavoritesOnly ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setShowFavoritesOnly(false)}
              >
                {t('closet_all')}
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setShowFavoritesOnly(true)}
                className="gap-1"
              >
                <Heart size={14} />
                {t('closet_favorites')}
              </Button>
            </div>

            {/* Outfits Grid */}
            {isLoadingOutfits ? (
              <LoadingState variant="skeleton" skeletonCount={4} />
            ) : filteredOutfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Heart size={48} className="text-muted-foreground" />
                <p className="text-muted-foreground">
                  {showFavoritesOnly ? t('closet_no_fav_outfit') : t('closet_no_saved_outfit')}
                </p>
                <Button variant="outline" size="sm" onClick={onNavigateToTryOn} className="gap-1">
                  {t('wardrobe_try_now')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredOutfits.map(outfit => (
                  <div 
                    key={outfit.id} 
                    className="bg-card rounded-xl overflow-hidden border border-border shadow-sm"
                  >
                    <div className="relative aspect-[3/4] bg-muted">
                      <img 
                        src={outfit.result_image_url} 
                        alt="Outfit"
                        className="w-full h-full object-cover"
                      />
                      {/* Favorite Badge */}
                      <button
                        onClick={() => toggleFavorite(outfit.id, outfit.is_favorite)}
                        className={cn(
                          "absolute top-2 right-2 p-1.5 rounded-full transition-colors",
                          outfit.is_favorite 
                            ? "bg-red-500 text-white" 
                            : "bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-red-500"
                        )}
                      >
                        <Heart size={14} className={outfit.is_favorite ? 'fill-current' : ''} />
                      </button>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(outfit.created_at).toLocaleDateString('vi-VN')}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {outfit.clothing_items.slice(0, 2).map((item, idx) => (
                          <span key={idx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {item.name}
                          </span>
                        ))}
                        {outfit.clothing_items.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{outfit.clothing_items.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Clothing Dialog */}
      {editingItem && (
        <EditClothingDialog
          item={editingItem}
          isOpen={isEditDialogOpen}
          isSaving={isSaving}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};
