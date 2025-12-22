import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TryOnHistoryItem {
  id: string;
  result_image_url: string;
  created_at: string;
  clothing_items: Array<{ name: string; imageUrl: string }>;
}

interface TryOnHistorySectionProps {
  onNavigateToTryOn: () => void;
  onNavigateToHistory?: () => void;
}

export const TryOnHistorySection = ({
  onNavigateToTryOn,
  onNavigateToHistory,
}: TryOnHistorySectionProps) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('try_on_history')
          .select('id, result_image_url, created_at, clothing_items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setHistory(
          (data || []).map((item) => ({
            id: item.id,
            result_image_url: item.result_image_url,
            created_at: item.created_at,
            clothing_items: (item.clothing_items as unknown as Array<{ name: string; imageUrl: string }>) || [],
          }))
        );
      } catch (error) {
        console.error('Error fetching try-on history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 180;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!user) {
    return (
      <section className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Lịch sử thử đồ</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            Đăng nhập để xem lịch sử thử đồ của bạn
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="flex items-center gap-2 px-4 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Lịch sử thử đồ</h2>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-32 h-40 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (history.length === 0) {
    return (
      <section className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Lịch sử thử đồ</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Play className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-3">
            Bạn chưa thử outfit nào
          </p>
          <Button onClick={onNavigateToTryOn} size="sm" variant="default">
            Thử ngay
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 relative group">
      <div className="flex items-center gap-2 px-4 mb-3">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Lịch sử thử đồ</h2>
        {onNavigateToHistory && (
          <button
            onClick={onNavigateToHistory}
            className="text-xs text-primary ml-auto hover:underline"
          >
            Xem tất cả
          </button>
        )}
      </div>

      {/* Scroll buttons */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute left-1 top-1/2 translate-y-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-1 top-1/2 translate-y-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {history.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-32 rounded-xl overflow-hidden bg-card border border-border shadow-soft"
          >
            <div className="relative aspect-[3/4]">
              <img
                src={item.result_image_url}
                alt="Try-on result"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { locale: vi, addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
