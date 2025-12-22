import { useState, useEffect } from 'react';
import { Shirt, Heart, ShoppingBag, Check, Plus, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { sampleClothing } from '@/data/sampleClothing';

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

const categories: CategoryOption[] = [
  { id: 'top', label: 'Áo', icon: <Shirt size={20} /> },
  { id: 'bottom', label: 'Quần', icon: <span className="text-lg">👖</span> },
  { id: 'dress', label: 'Váy', icon: <span className="text-lg">👗</span> },
  { id: 'shoes', label: 'Giày', icon: <span className="text-lg">👟</span> },
  { id: 'accessory', label: 'Phụ kiện', icon: <span className="text-lg">👓</span> },
];

interface ClosetPageProps {
  onNavigateToTryOn?: () => void;
}

export const ClosetPage = ({ onNavigateToTryOn }: ClosetPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeMainTab, setActiveMainTab] = useState<'clothing' | 'outfits'>('clothing');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>('top');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  
  const [userClothingItems, setUserClothingItems] = useState<UserClothingWithPurchased[]>([]);
  const [outfits, setOutfits] = useState<OutfitHistory[]>([]);
  const [isLoadingClothing, setIsLoadingClothing] = useState(true);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true);

  // Sample clothing data
  const allClothing = sampleClothing;

  // Fetch user clothing
  useEffect(() => {
    if (!user) {
      setUserClothingItems([]);
      setIsLoadingClothing(false);
      return;
    }

    const fetchClothing = async () => {
      setIsLoadingClothing(true);
      const { data, error } = await supabase
        .from('user_clothing')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clothing:', error);
        toast.error('Không thể tải quần áo');
      } else {
        setUserClothingItems(data?.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category as ClothingCategory,
          imageUrl: item.image_url,
          color: item.color || undefined,
          gender: item.gender as 'male' | 'female' | 'unisex' | undefined,
          style: item.style || undefined,
          pattern: item.pattern || undefined,
          tags: item.tags || [],
          is_purchased: item.is_purchased ?? false,
          purchase_url: item.purchase_url || undefined,
        })) || []);
      }
      setIsLoadingClothing(false);
    };

    fetchClothing();
  }, [user]);

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
        toast.error('Không thể tải lịch sử outfit');
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
      toast.error('Không thể cập nhật trạng thái');
    } else {
      setUserClothingItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_purchased: !currentStatus } : item
      ));
      toast.success(currentStatus ? 'Đã chuyển sang Wishlist' : 'Đã đánh dấu đã mua');
    }
  };

  // Toggle favorite outfit
  const toggleFavorite = async (outfitId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('try_on_history')
      .update({ is_favorite: !currentStatus })
      .eq('id', outfitId);

    if (error) {
      toast.error('Không thể cập nhật yêu thích');
    } else {
      setOutfits(prev => prev.map(item => 
        item.id === outfitId ? { ...item, is_favorite: !currentStatus } : item
      ));
      toast.success(currentStatus ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
    }
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pb-24 pt-16 px-4 max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <ShoppingBag size={64} className="text-muted-foreground" />
          <h2 className="text-xl font-display font-bold">Đăng nhập để xem tủ đồ</h2>
          <p className="text-muted-foreground text-sm">
            Đăng nhập để lưu và quản lý quần áo, phụ kiện của bạn
          </p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-16 max-w-md mx-auto">
      <div className="px-4 space-y-4">
        {/* Main Tabs */}
        <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as 'clothing' | 'outfits')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="clothing" className="gap-2">
              <Shirt size={16} />
              Quần áo
            </TabsTrigger>
            <TabsTrigger value="outfits" className="gap-2">
              <Heart size={16} />
              Outfit đã lưu
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
                <span className="text-[10px] mt-0.5">Thêm</span>
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
                Tất cả
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
                Có trong tủ
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
                Chưa mua
              </button>
            </div>

            {/* Clothing Grid */}
            {isLoadingClothing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredClothing.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Shirt size={48} className="text-muted-foreground" />
                <p className="text-muted-foreground">Chưa có quần áo nào</p>
                <Button variant="outline" size="sm" onClick={onNavigateToTryOn} className="gap-1">
                  <Plus size={14} />
                  Thêm quần áo mới
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
                        
                        {/* Buy Link Badge */}
                        {!isOwned && purchaseUrl && (
                          <a
                            href={purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            Mua
                            <ExternalLink size={10} />
                          </a>
                        )}
                        
                        {/* Owned Badge */}
                        {isOwned && (
                          <button
                            onClick={() => togglePurchased(item.id, (item as UserClothingWithPurchased).is_purchased)}
                            className={cn(
                              "absolute top-2 right-2 p-1.5 rounded-full transition-colors",
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
                Tất cả
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setShowFavoritesOnly(true)}
                className="gap-1"
              >
                <Heart size={14} />
                Yêu thích
              </Button>
            </div>

            {/* Outfits Grid */}
            {isLoadingOutfits ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredOutfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Heart size={48} className="text-muted-foreground" />
                <p className="text-muted-foreground">
                  {showFavoritesOnly ? 'Chưa có outfit yêu thích' : 'Chưa có outfit nào được lưu'}
                </p>
                <Button variant="outline" size="sm" onClick={onNavigateToTryOn} className="gap-1">
                  Thử đồ ngay
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
    </div>
  );
};
