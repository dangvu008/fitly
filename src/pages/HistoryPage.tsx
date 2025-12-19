import { useState, useEffect } from 'react';
import { History, Trash2, Share2, Download, ArrowLeft, Loader2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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

export const HistoryPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
          <History size={24} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            Lịch sử thử đồ
          </h1>
          <p className="text-muted-foreground text-sm">
            {history.length} kết quả đã lưu
          </p>
        </div>
      </div>

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
        {history.map((item, index) => (
          <div
            key={item.id}
            className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border animate-slide-up"
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
              
              {/* Actions */}
              <div className="flex gap-1">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
