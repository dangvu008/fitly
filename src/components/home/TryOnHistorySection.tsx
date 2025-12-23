import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS, zhCN, ko, ja, th } from 'date-fns/locale';

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

const localeMap = {
  vi: vi,
  en: enUS,
  zh: zhCN,
  ko: ko,
  ja: ja,
  th: th,
};

export const TryOnHistorySection = ({
  onNavigateToTryOn,
  onNavigateToHistory,
}: TryOnHistorySectionProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
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

  const dateLocale = localeMap[language] || enUS;

  if (!user) {
    return (
      <section className="py-4 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t('tryon_history')}</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            {t('login_to_view_history')}
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="flex items-center gap-2 px-4 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t('tryon_history')}</h2>
        </div>
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-20 h-28 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (history.length === 0) {
    return (
      <section className="py-4 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t('tryon_history')}</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Play className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm mb-3">
            {t('no_tryon_yet')}
          </p>
          <Button onClick={onNavigateToTryOn} size="sm" variant="default">
            {t('try_now')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-3 relative group">
      <div className="flex items-center gap-2 px-4 mb-2">
        <Clock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('tryon_history')}</h2>
        {onNavigateToHistory && (
          <button
            onClick={onNavigateToHistory}
            className="text-[10px] text-primary ml-auto hover:underline"
          >
            {t('view_all')}
          </button>
        )}
      </div>

      {/* Scroll buttons */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute left-1 top-1/2 translate-y-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex h-6 w-6"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="w-3 h-3" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-1 top-1/2 translate-y-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hidden md:flex h-6 w-6"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="w-3 h-3" />
      </Button>

      <div
        ref={scrollRef}
        className="flex gap-2 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {history.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-20 rounded-lg overflow-hidden bg-card border border-border shadow-soft"
          >
            <div className="relative aspect-[3/4]">
              <img
                src={item.result_image_url}
                alt="Try-on result"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-1">
                <p className="text-[8px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { locale: dateLocale, addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
