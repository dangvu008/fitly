import { useState, useEffect } from 'react';
import { History, Trash2, Share2, Download, Loader2, ImageOff, Scale, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCompare, SavedOutfit } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ClothingItem } from '@/types/clothing';

interface ClothingItemData {
  name: string;
  imageUrl: string;
}

interface TryOnHistoryItem {
  id: string;
  body_image_url: string;
  result_image_url: string;
  clothing_items: ClothingItemData[];
  created_at: string;
}

interface HistoryPageProps {
  onNavigateToCompare?: () => void;
  onNavigateToTryOn?: () => void;
  onReuseHistory?: (bodyImageUrl: string, clothingItems: ClothingItem[]) => void;
}

export const HistoryPage = ({ onNavigateToCompare, onNavigateToTryOn, onReuseHistory }: HistoryPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const { addToCompare, outfitsToCompare, isInCompare, clearCompare } = useCompare();
  const navigate = useNavigate();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('try_on_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Không thể tải lịch sử');
      console.error(error);
    } else {
      // Cast the data to our interface
      const typedData = (data || []).map(item => ({
        ...item,
        clothing_items: (item.clothing_items || []) as unknown as ClothingItemData[],
      }));
      setHistory(typedData);
    }
    setLoading(false);
  };

  const handleDelete = async (item: TryOnHistoryItem) => {
    if (!user) return;
    
    setDeletingId(item.id);
    
    // Delete from database
    const { error } = await supabase
      .from('try_on_history')
      .delete()
      .eq('id', item.id);

    if (error) {
      toast.error('Không thể xóa');
      console.error(error);
    } else {
      // Try to delete images from storage
      try {
        const resultPath = item.result_image_url.split('/try-on-images/')[1];
        const bodyPath = item.body_image_url.split('/try-on-images/')[1];
        
        if (resultPath) {
          await supabase.storage.from('try-on-images').remove([resultPath]);
        }
        if (bodyPath) {
          await supabase.storage.from('try-on-images').remove([bodyPath]);
        }
      } catch (e) {
        console.error('Error deleting images:', e);
      }
      
      setHistory(prev => prev.filter(h => h.id !== item.id));
      toast.success('Đã xóa');
    }
    setDeletingId(null);
  };

  const handleShare = async (item: TryOnHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.result_image_url);
      toast.success('Đã sao chép link ảnh!');
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const handleDownload = (item: TryOnHistoryItem) => {
    const link = document.createElement('a');
    link.href = item.result_image_url;
    link.download = `try-on-${item.id}.png`;
    link.target = '_blank';
    link.click();
    toast.success('Đang tải xuống...');
  };

  const handleReuse = async (item: TryOnHistoryItem) => {
    if (!onReuseHistory || !onNavigateToTryOn) {
      toast.error('Không thể sử dụng lại');
      return;
    }

    try {
      // Convert clothing items to ClothingItem format
      const clothingItems: ClothingItem[] = item.clothing_items.map((ci, idx) => ({
        id: `history-${item.id}-${idx}`,
        name: ci.name,
        category: 'top' as const, // Default category
        imageUrl: ci.imageUrl,
      }));

      // Call the reuse handler with body image URL and clothing items
      onReuseHistory(item.body_image_url, clothingItems);
      onNavigateToTryOn();
      toast.success('Đã tải lại outfit - bạn có thể thay đổi từng món đồ');
    } catch (error) {
      console.error('Error reusing history:', error);
      toast.error('Không thể tải lại outfit');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleSelectForCompare = (item: TryOnHistoryItem) => {
    if (selectedForCompare.includes(item.id)) {
      setSelectedForCompare(prev => prev.filter(id => id !== item.id));
    } else if (selectedForCompare.length < 4) {
      setSelectedForCompare(prev => [...prev, item.id]);
    } else {
      toast.error('Chỉ có thể so sánh tối đa 4 outfit');
    }
  };

  const handleStartCompare = () => {
    if (selectedForCompare.length < 2) {
      toast.error('Chọn ít nhất 2 outfit để so sánh');
      return;
    }

    // Clear existing compare items and add selected ones
    clearCompare();
    
    selectedForCompare.forEach(id => {
      const item = history.find(h => h.id === id);
      if (item) {
        const outfit: SavedOutfit = {
          id: item.id,
          name: formatDate(item.created_at),
          items: item.clothing_items.map((ci, idx) => ({
            id: `${item.id}-${idx}`,
            name: ci.name,
            category: 'top' as const,
            imageUrl: ci.imageUrl,
          })),
          resultImageUrl: item.result_image_url,
          createdAt: new Date(item.created_at),
        };
        addToCompare(outfit);
      }
    });

    toast.success(`Đã thêm ${selectedForCompare.length} outfit vào so sánh`);
    setCompareMode(false);
    setSelectedForCompare([]);
    
    if (onNavigateToCompare) {
      onNavigateToCompare();
    }
  };

  const cancelCompareMode = () => {
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="pb-24 pt-16 px-4 max-w-md mx-auto">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <History size={32} className="text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground mb-2">
            Đăng nhập để xem lịch sử
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Bạn cần đăng nhập để lưu và xem lịch sử thử đồ
          </p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="pb-24 pt-16 px-4 max-w-md mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-16 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <History size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">
              Lịch sử thử đồ
            </h1>
            <p className="text-muted-foreground text-sm">
              {compareMode 
                ? `Đã chọn ${selectedForCompare.length}/4` 
                : `${history.length} kết quả đã lưu`}
            </p>
          </div>
        </div>
        
        {/* Compare mode toggle */}
        {history.length >= 2 && !compareMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(true)}
            className="gap-1"
          >
            <Scale size={16} />
            So sánh
          </Button>
        )}
      </div>

      {/* Compare mode bar */}
      {compareMode && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border border-border rounded-2xl shadow-medium p-3 flex items-center justify-between animate-slide-up max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-primary" />
            <span className="text-sm font-medium">
              {selectedForCompare.length < 2 
                ? `Chọn thêm ${2 - selectedForCompare.length} outfit` 
                : `${selectedForCompare.length} outfit đã chọn`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelCompareMode}
            >
              <X size={16} />
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleStartCompare}
              disabled={selectedForCompare.length < 2}
            >
              <Scale size={16} />
              So sánh
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div className="text-center py-12 animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <ImageOff size={32} className="text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">
            Chưa có lịch sử
          </h3>
          <p className="text-muted-foreground text-sm">
            Thử đồ với AI và lưu kết quả để xem ở đây
          </p>
        </div>
      )}

      {/* History grid */}
      <div className="grid grid-cols-2 gap-3">
        {history.map((item, index) => {
          const isSelected = selectedForCompare.includes(item.id);
          
          return (
            <div
              key={item.id}
              onClick={() => compareMode && toggleSelectForCompare(item)}
              className={cn(
                "bg-card rounded-2xl overflow-hidden shadow-soft border animate-slide-up transition-all",
                compareMode && "cursor-pointer",
                isSelected 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Image */}
              <div className="relative aspect-[3/4] bg-secondary">
                <img
                  src={item.result_image_url}
                  alt="Try-on result"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Selection indicator */}
                {compareMode && (
                  <div className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    isSelected 
                      ? "gradient-primary text-primary-foreground" 
                      : "bg-card/80 backdrop-blur-sm border border-border"
                  )}>
                    {isSelected && <Check size={14} />}
                  </div>
                )}
                
                {/* Clothing badge */}
                {item.clothing_items && item.clothing_items.length > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-medium text-foreground">
                    {item.clothing_items.length} món
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.created_at)}
                </p>
                
                {/* Actions - hide in compare mode */}
                {!compareMode && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleReuse(item)}
                      className="flex-1 h-8 text-primary hover:text-primary hover:bg-primary/10"
                      title="Thử lại với outfit này"
                    >
                      <RefreshCw size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDownload(item)}
                      className="flex-1 h-8"
                    >
                      <Download size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleShare(item)}
                      className="flex-1 h-8"
                    >
                      <Share2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="flex-1 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === item.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
