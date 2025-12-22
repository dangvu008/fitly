import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, ExternalLink, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/layout/MobileNav';
import { ShareOutfitDialog } from '@/components/outfit/ShareOutfitDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

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

  useEffect(() => {
    if (id) {
      fetchOutfitDetail(id);
      if (user) {
        checkIfLiked(id);
      }
    }
  }, [id, user]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

        {/* Clothing items */}
        <div>
          <h2 className="font-display font-semibold text-base text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag size={18} />
            Các món đồ trong outfit ({outfit.clothing_items?.length || 0})
          </h2>

          <div className="space-y-3">
            {outfit.clothing_items?.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-card rounded-xl border border-border overflow-hidden flex hover:shadow-medium transition-shadow"
              >
                {/* Item image */}
                <div className="w-20 h-20 flex-shrink-0 bg-secondary">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Item info */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-foreground text-sm line-clamp-1">
                      {item.name}
                    </h3>
                    {item.category && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Buy button */}
                  <Button
                    size="sm"
                    variant={item.purchaseUrl ? 'instagram' : 'outline'}
                    className="w-full mt-2 h-8 text-xs"
                    onClick={() => handleBuyItem(item)}
                  >
                    {item.purchaseUrl ? (
                      <>
                        <ExternalLink size={12} className="mr-1" />
                        Mua ngay
                      </>
                    ) : (
                      'Chưa có link'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Bottom Navigation */}
      <MobileNav activeTab="home" onTabChange={handleTabChange} />
    </div>
  );
};
