import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, EyeOff, ArrowLeft, Heart, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useSavedOutfits } from '@/hooks/useSavedOutfits';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SavedOutfitsPageProps {
  onNavigateBack: () => void;
}

export const SavedOutfitsPage = ({ onNavigateBack }: SavedOutfitsPageProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedOutfits, hiddenOutfits, isLoading, unsaveOutfit, unhideOutfit } = useSavedOutfits();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleUnsave = async (outfitId: string) => {
    setRemovingId(outfitId);
    const success = await unsaveOutfit(outfitId);
    setRemovingId(null);
    if (success) {
      toast.success('Đã bỏ lưu outfit');
    } else {
      toast.error('Không thể bỏ lưu outfit');
    }
  };

  const handleUnhide = async (outfitId: string) => {
    setRemovingId(outfitId);
    const success = await unhideOutfit(outfitId);
    setRemovingId(null);
    if (success) {
      toast.success('Đã bỏ ẩn outfit');
    } else {
      toast.error('Không thể bỏ ẩn outfit');
    }
  };

  const handleViewOutfit = (outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  };

  if (!user) {
    return (
      <div className="pt-16 pb-24 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onNavigateBack} className="p-2 -ml-2 hover:bg-secondary rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Outfit đã lưu</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Vui lòng đăng nhập</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Đăng nhập để xem outfit đã lưu
          </p>
          <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <button onClick={onNavigateBack} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Bộ sưu tập</h1>
      </div>

      <Tabs defaultValue="saved" className="px-4">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark size={16} />
            Đã lưu ({savedOutfits.length})
          </TabsTrigger>
          <TabsTrigger value="hidden" className="gap-2">
            <EyeOff size={16} />
            Đã ẩn ({hiddenOutfits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : savedOutfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bookmark size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có outfit nào</h3>
              <p className="text-muted-foreground text-sm">
                Lưu outfit yêu thích từ trang chủ để xem lại sau
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedOutfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="relative rounded-xl overflow-hidden bg-card border border-border shadow-soft group"
                >
                  <button
                    onClick={() => handleViewOutfit(outfit.id)}
                    className="w-full aspect-[3/4] overflow-hidden"
                  >
                    <img
                      src={outfit.result_image_url}
                      alt={outfit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  </button>

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-medium text-foreground line-clamp-1 mb-1">
                      {outfit.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Heart size={10} />
                          {outfit.likes_count}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(outfit.saved_at), { locale: vi, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleUnsave(outfit.id)}
                    disabled={removingId === outfit.id}
                    className="absolute top-2 right-2 p-1.5 bg-card/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {removingId === outfit.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hidden" className="mt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : hiddenOutfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <EyeOff size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không có outfit ẩn</h3>
              <p className="text-muted-foreground text-sm">
                Các outfit bạn ẩn sẽ không hiển thị trên feed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenOutfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={outfit.result_image_url}
                      alt={outfit.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {outfit.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ẩn {formatDistanceToNow(new Date(outfit.hidden_at), { locale: vi, addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnhide(outfit.id)}
                    disabled={removingId === outfit.id}
                    className="gap-1"
                  >
                    {removingId === outfit.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Eye size={14} />
                        Bỏ ẩn
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
