import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ExternalLink, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ClothingItemInfo {
  name: string;
  imageUrl: string;
  shopUrl?: string;
  price?: string;
}

interface OutfitFeedCardProps {
  outfit: {
    id: string;
    title: string;
    description?: string;
    result_image_url: string;
    likes_count: number;
    comments_count?: number;
    is_featured: boolean;
    created_at: string;
    user_id: string;
    clothing_items: ClothingItemInfo[];
  };
  userProfile?: {
    display_name?: string;
    avatar_url?: string;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  onOpenComments: (outfitId: string) => void;
  onShare: (outfitId: string) => void;
  onViewDetail: (outfitId: string) => void;
  onLikeChange?: () => void;
  onSave?: (outfitId: string) => Promise<boolean>;
  onUnsave?: (outfitId: string) => Promise<boolean>;
  onHide?: (outfitId: string) => Promise<boolean>;
}

export const OutfitFeedCard = ({
  outfit,
  userProfile,
  isLiked = false,
  isSaved = false,
  onOpenComments,
  onShare,
  onViewDetail,
  onLikeChange,
  onSave,
  onUnsave,
  onHide,
}: OutfitFeedCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(outfit.likes_count);
  const [saved, setSaved] = useState(isSaved);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showClothingItems, setShowClothingItems] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích outfit');
      return;
    }
    
    if (isLiking) return;
    setIsLiking(true);

    try {
      if (liked) {
        const { error } = await supabase
          .from('outfit_likes')
          .delete()
          .eq('outfit_id', outfit.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('outfit_likes')
          .insert({ outfit_id: outfit.id, user_id: user.id });
          
        if (error) throw error;
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
      onLikeChange?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Không thể thực hiện');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }
    
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      if (saved) {
        const success = await onUnsave?.(outfit.id);
        if (success) {
          setSaved(false);
          toast.success('Đã bỏ lưu outfit');
        }
      } else {
        const success = await onSave?.(outfit.id);
        if (success) {
          setSaved(true);
          toast.success('Đã lưu outfit');
        }
      }
    } catch (error) {
      toast.error('Không thể thực hiện');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHide = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }
    
    const success = await onHide?.(outfit.id);
    if (success) {
      toast.success('Đã ẩn outfit này');
    } else {
      toast.error('Không thể ẩn outfit');
    }
  };

  const handleViewProfile = () => {
    navigate(`/user/${outfit.user_id}`);
  };

  const timeAgo = formatDistanceToNow(new Date(outfit.created_at), { 
    addSuffix: true, 
    locale: vi 
  });

  return (
    <div className="bg-card border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <button 
          onClick={handleViewProfile}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-8 h-8 ring-2 ring-primary/20">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
              {userProfile?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">
              {userProfile?.display_name || 'Người dùng'}
            </p>
            <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
          </div>
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleHide} className="gap-2 text-destructive">
              <EyeOff size={16} />
              Ẩn outfit này
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      <div 
        className="relative aspect-[4/5] bg-muted cursor-pointer"
        onClick={() => onViewDetail(outfit.id)}
      >
        <img
          src={outfit.result_image_url}
          alt={outfit.title}
          className="w-full h-full object-cover"
        />
        
        {/* Featured Badge */}
        {outfit.is_featured && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            ✨ Featured
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "transition-all active:scale-90",
                liked ? "text-red-500" : "text-foreground hover:text-muted-foreground"
              )}
            >
              <Heart size={24} className={liked ? "fill-current" : ""} />
            </button>
            <button 
              onClick={() => onOpenComments(outfit.id)}
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              <MessageCircle size={24} />
            </button>
            <button 
              onClick={() => onShare(outfit.id)}
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              <Share2 size={24} />
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "transition-all active:scale-90",
              saved ? "text-primary" : "text-foreground hover:text-muted-foreground"
            )}
          >
            <Bookmark size={24} className={saved ? "fill-current" : ""} />
          </button>
        </div>

        {/* Likes Count */}
        <p className="text-sm font-semibold">
          {likesCount.toLocaleString()} lượt thích
        </p>

        {/* Caption */}
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-semibold">{userProfile?.display_name || 'Người dùng'}</span>{' '}
            {outfit.title}
          </p>
          {outfit.description && (
            <p className="text-sm text-muted-foreground">{outfit.description}</p>
          )}
        </div>

        {/* View Comments */}
        {(outfit.comments_count ?? 0) > 0 && (
          <button 
            onClick={() => onOpenComments(outfit.id)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Xem tất cả {outfit.comments_count} bình luận
          </button>
        )}

        {/* Clothing Items Toggle */}
        {outfit.clothing_items && outfit.clothing_items.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowClothingItems(!showClothingItems)}
              className="text-xs text-primary font-medium hover:underline"
            >
              {showClothingItems ? 'Ẩn chi tiết' : `Xem ${outfit.clothing_items.length} món đồ`}
            </button>
            
            {showClothingItems && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {outfit.clothing_items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex-shrink-0 w-20 bg-muted rounded-lg overflow-hidden"
                  >
                    <div className="aspect-square relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                      {item.shopUrl && (
                        <a
                          href={item.shopUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-1 right-1 p-1 rounded-full bg-primary text-primary-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div className="p-1">
                      <p className="text-[9px] truncate">{item.name}</p>
                      {item.price && (
                        <p className="text-[9px] text-primary font-medium">{item.price}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
