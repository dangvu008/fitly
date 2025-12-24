import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, ExternalLink, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/layout/MobileNav';
import { ShareOutfitDialog } from '@/components/outfit/ShareOutfitDialog';
import { OutfitAnalyzer } from '@/components/outfit/OutfitAnalyzer';
import { ClothingItemsGrid } from '@/components/feed/ClothingItemsGrid';
import { ClothingItemDetailSheet } from '@/components/feed/ClothingItemDetailSheet';
import { SimilarItemsSheet } from '@/components/feed/SimilarItemsSheet';
import { TryOutfitButton } from '@/components/feed/TryOutfitButton';
import { useSimilarClothing } from '@/hooks/useSimilarClothing';
import { useOutfitAnalysis } from '@/hooks/useOutfitAnalysis';
import { ClothingItemInfo, SharedOutfit } from '@/hooks/useOutfitTryOn';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ClothingItemData {
  id?: string;
  name: string;
  imageUrl: string;
  category?: string;
  purchaseUrl?: string;
}

interface SharedOutfitDetail {
  id: string;
  title: string;
  description: string | null;
  result_image_url: string;
  clothing_items: ClothingItemData[];
  likes_count: number;
  is_featured: boolean;
  created_at: string;
}

export const SharedOutfitDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [outfit, setOutfit] = useState<SharedOutfitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // State for clothing item detail sheet (Requirements: 2.1, 2.2)
  const [selectedItem, setSelectedItem] = useState<ClothingItemInfo | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  
  // State for similar items sheet (Requirements: 3.1, 3.3, 3.4)
  const [similarSheetOpen, setSimilarSheetOpen] = useState(false);
  const [sourceItemForSimilar, setSourceItemForSimilar] = useState<ClothingItemInfo | null>(null);
  
  // Hook for finding similar items
  const { findSimilar, isSearching, similarItems } = useSimilarClothing();
  
  // Hook for AI outfit analysis
  const { analyzeOutfit, isAnalyzing, analyzedItems } = useOutfitAnalysis();

  useEffect(() => {
    if (id) {
      fetchOutfitDetail(id);
      if (user) {
        checkIfLiked(id);
      }
    }
  }, [id, user]);

  // Trigger AI analysis when outfit is loaded
  useEffect(() => {
    if (outfit?.result_image_url) {
      analyzeOutfit(outfit.result_image_url);
    }
  }, [outfit?.result_image_url, analyzeOutfit]);

  // Use AI-analyzed items if available, otherwise fall back to database items
  const displayItems: ClothingItemInfo[] = analyzedItems.length > 0 
    ? analyzedItems 
    : (outfit?.clothing_items?.map(item => ({
        name: item.name,
        imageUrl: item.imageUrl,
        shopUrl: item.purchaseUrl,
        category: item.category,
      })) || []);

  const fetchOutfitDetail = async (outfitId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_outfits')
      .select('*')
      .eq('id', outfitId)
      .single();

    if (error || !data) {
      toast.error('Không tìm thấy outfit');
      navigate('/');
      return;
    }

    setOutfit({
      ...data,
      clothing_items: (data.clothing_items || []) as unknown as ClothingItemData[],
    });
    setLikesCount(data.likes_count);
    setLoading(false);
  };

  const checkIfLiked = async (outfitId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('outfit_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('outfit_id', outfitId)
      .single();
    
    setIsLiked(!!data);
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích outfit');
      return;
    }
    if (!id) return;

    if (isLiked) {
      const { error } = await supabase
        .from('outfit_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_id', id);

      if (!error) {
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      }
    } else {
      const { error } = await supabase
        .from('outfit_likes')
        .insert({ user_id: user.id, outfit_id: id });

      if (!error) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    }
  };

  const handleBuyItem = (item: ClothingItemData) => {
    if (item.purchaseUrl) {
      window.open(item.purchaseUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.info('Chưa có link mua hàng cho sản phẩm này');
    }
  };

  const handleTabChange = (tab: string) => {
    navigate('/');
  };

  // Handler for clicking on a clothing item in the grid (Requirements: 2.1, 2.2)
  const handleItemClick = (item: ClothingItemInfo, index: number) => {
    setSelectedItem(item);
    setDetailSheetOpen(true);
  };

  // Handler for finding similar items (Requirements: 3.1, 3.3, 3.4)
  const handleFindSimilar = (item: ClothingItemInfo) => {
    setSourceItemForSimilar(item);
    setDetailSheetOpen(false);
    setSimilarSheetOpen(true);
    findSimilar(item);
  };

  // Convert outfit to SharedOutfit format for TryOutfitButton
  const getSharedOutfitData = (): SharedOutfit | null => {
    if (!outfit) return null;
    return {
      id: outfit.id,
      title: outfit.title,
      description: outfit.description,
      result_image_url: outfit.result_image_url,
      clothing_items: outfit.clothing_items.map(item => ({
        name: item.name,
        imageUrl: item.imageUrl,
        shopUrl: item.purchaseUrl,
        category: item.category,
      })),
      user_id: '', // Not needed for try-on
      created_at: outfit.created_at,
      likes_count: outfit.likes_count,
      comments_count: 0,
      is_featured: outfit.is_featured,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-24 h-24">
          <DotLottieReact
            src="https://lottie.host/d10e8b97-a4d3-4f9e-b0f8-7e9cdef05ec8/5EF3wJWe17.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">✨ Đang tải outfit...</p>
      </div>
    );
  }

  if (!outfit) {
    return null;
  }

  return (
    <div className="mobile-viewport bg-background pb-20">
      {/* Header - Instagram style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="TryOn Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground">
              TryOn
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShareOpen(true)}>
            <Share2 size={22} strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      <div className="pt-16 px-4 max-w-md mx-auto space-y-6">
        {/* Main outfit image */}
        <div className="rounded-xl overflow-hidden shadow-medium border border-border">
          <div className="aspect-[3/4] relative">
            <img
              src={outfit.result_image_url}
              alt={outfit.title}
              className="w-full h-full object-cover"
            />
            
            {outfit.is_featured && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                ⭐ Nổi bật
              </div>
            )}
          </div>
          
          {/* Action bar - Instagram style */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleLike}
                className="press-effect"
              >
                <Heart 
                  size={26} 
                  strokeWidth={1.5}
                  className={cn(
                    "transition-colors",
                    isLiked ? "fill-accent text-accent" : "text-foreground"
                  )} 
                />
              </button>
              <button onClick={() => setShareOpen(true)} className="press-effect">
                <Share2 size={24} strokeWidth={1.5} />
              </button>
              {/* Try Outfit Button - Requirements: 1.1 */}
              {getSharedOutfitData() && (
                <TryOutfitButton
                  outfit={getSharedOutfitData()!}
                  variant="icon"
                />
              )}
            </div>
            
            <div className="font-semibold text-sm">
              {likesCount.toLocaleString()} lượt thích
            </div>
            
            <div>
              <span className="font-semibold text-sm">{outfit.title}</span>
              {outfit.description && (
                <span className="text-sm text-foreground ml-1">{outfit.description}</span>
              )}
            </div>
          </div>
        </div>

        {/* Clothing items - Using AI analysis (Requirements: 2.1, 2.4) */}
        <div>
          <h2 className="font-display font-semibold text-base text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag size={18} />
            Các món đồ trong outfit
            {!isAnalyzing && ` (${displayItems.length})`}
          </h2>

          {/* Show loading state while analyzing */}
          {isAnalyzing ? (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Đang phân tích outfit bằng AI...
              </span>
            </div>
          ) : displayItems.length > 0 ? (
            <ClothingItemsGrid
              items={displayItems}
              onItemClick={handleItemClick}
              showShopLinks={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              Không tìm thấy món đồ nào
            </p>
          )}

          {/* Full Try Outfit Button - Requirements: 1.1 */}
          {getSharedOutfitData() && (
            <div className="mt-4">
              <TryOutfitButton
                outfit={getSharedOutfitData()!}
                variant="full"
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* AI Outfit Analyzer */}
        <div className="pt-4 border-t border-border">
          <h2 className="font-display font-semibold text-base text-foreground mb-4 flex items-center gap-2">
            🔍 Phân tích & Tìm mua
          </h2>
          <OutfitAnalyzer 
            imageUrl={outfit.result_image_url}
            existingItems={outfit.clothing_items}
          />
        </div>
      </div>

      {/* Share Dialog */}
      <ShareOutfitDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        imageUrl={outfit.result_image_url}
        title={outfit.title}
        shareUrl={window.location.href}
      />

      {/* Clothing Item Detail Sheet (Requirements: 2.2, 2.3, 3.1) */}
      <ClothingItemDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        item={selectedItem}
        onFindSimilar={handleFindSimilar}
      />

      {/* Similar Items Sheet (Requirements: 3.3, 3.4) */}
      <SimilarItemsSheet
        open={similarSheetOpen}
        onOpenChange={setSimilarSheetOpen}
        sourceItem={sourceItemForSimilar}
        similarItems={similarItems}
        isSearching={isSearching}
      />

      {/* Bottom Navigation */}
      <MobileNav activeTab="home" onTabChange={handleTabChange} />
    </div>
  );
};
