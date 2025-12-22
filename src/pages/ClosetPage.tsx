import { useState, useEffect } from 'react';
import { Shirt, Square, Crown, Footprints, Glasses, MoreHorizontal, Heart, ShoppingBag, Check, Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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
}

const categories: { id: ClothingCategory | 'all'; icon: React.ElementType; label: string }[] = [
  { id: 'all', icon: MoreHorizontal, label: 'Tất cả' },
  { id: 'top', icon: Shirt, label: 'Áo' },
  { id: 'bottom', icon: Square, label: 'Quần' },
  { id: 'dress', icon: Crown, label: 'Váy' },
  { id: 'shoes', icon: Footprints, label: 'Giày' },
  { id: 'accessory', icon: Glasses, label: 'Phụ kiện' },
];

interface ClosetPageProps {
  onNavigateToTryOn?: () => void;
}

export const ClosetPage = ({ onNavigateToTryOn }: ClosetPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [activeMainTab, setActiveMainTab] = useState<'clothing' | 'outfits'>('clothing');
  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'all'>('all');
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'purchased' | 'wishlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [clothing, setClothing] = useState<UserClothingWithPurchased[]>([]);
  const [outfits, setOutfits] = useState<OutfitHistory[]>([]);
  const [isLoadingClothing, setIsLoadingClothing] = useState(true);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true);

  // Fetch user clothing
  useEffect(() => {
    if (!user) {
      setClothing([]);
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
        setClothing(data?.map(item => ({
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
      setClothing(prev => prev.map(item => 
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

  // Filter clothing
  const filteredClothing = clothing.filter(item => {
    const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
    const purchaseMatch = purchaseFilter === 'all' || 
      (purchaseFilter === 'purchased' && item.is_purchased) ||
      (purchaseFilter === 'wishlist' && !item.is_purchased);
    const searchMatch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && purchaseMatch && searchMatch;
  });

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
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm quần áo..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Purchase Filter */}
            <div className="flex gap-2">
              <Button 
                variant={purchaseFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPurchaseFilter('all')}
              >
                Tất cả
              </Button>
              <Button 
                variant={purchaseFilter === 'purchased' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPurchaseFilter('purchased')}
                className="gap-1"
              >
                <Check size={14} />
                Đã mua
              </Button>
              <Button 
                variant={purchaseFilter === 'wishlist' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPurchaseFilter('wishlist')}
                className="gap-1"
              >
                <ShoppingBag size={14} />
                Wishlist
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <Button
                    key={cat.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className="flex-shrink-0 gap-1"
                  >
                    <Icon size={14} />
                    {cat.label}
                  </Button>
                );
              })}
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
              <div className="grid grid-cols-2 gap-3">
                {filteredClothing.map(item => (
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
                      {/* Purchase Badge */}
                      <button
                        onClick={() => togglePurchased(item.id, item.is_purchased)}
                        className={cn(
                          "absolute top-2 right-2 p-1.5 rounded-full transition-colors",
                          item.is_purchased 
                            ? "bg-green-500 text-white" 
                            : "bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.is_purchased ? <Check size={14} /> : <ShoppingBag size={14} />}
                      </button>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.is_purchased ? '✓ Đã mua' : 'Wishlist'}
                      </p>
                    </div>
                  </div>
                ))}
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