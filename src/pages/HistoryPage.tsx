import { useState, useEffect } from 'react';
import { History, Trash2, Share2, Download, Loader2, ImageOff, Scale, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompare, SavedOutfit } from '@/contexts/CompareContext';
import { useTryOnDialog } from '@/contexts/TryOnDialogContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ClothingItem } from '@/types/clothing';
import { formatDistanceToNow, Locale } from 'date-fns';
import { vi, enUS, zhCN, ko, ja, th } from 'date-fns/locale';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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
}

const localeMap: Record<string, Locale> = { vi, en: enUS, zh: zhCN, ko, ja, th };

export const HistoryPage = ({ onNavigateToCompare }: HistoryPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { addToCompare, outfitsToCompare, isInCompare, clearCompare } = useCompare();
  const { openDialog } = useTryOnDialog();
  const navigate = useNavigate();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const dateLocale = localeMap[language] || enUS;

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
      toast.error(t('history_cannot_load'));
      console.error(error);
    } else {
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
    
    const { error } = await supabase
      .from('try_on_history')
      .delete()
      .eq('id', item.id);

    if (error) {
      toast.error(t('history_cannot_delete'));
      console.error(error);
    } else {
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
      toast.success(t('history_deleted'));
    }
    setDeletingId(null);
  };

  const handleShare = async (item: TryOnHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.result_image_url);
      toast.success(t('history_link_copied'));
    } catch {
      toast.error(t('history_cannot_copy'));
    }
  };

  const handleDownload = (item: TryOnHistoryItem) => {
    const link = document.createElement('a');
    link.href = item.result_image_url;
    link.download = `try-on-${item.id}.png`;
    link.target = '_blank';
    link.click();
    toast.success(t('history_downloading'));
  };

  const handleReuse = async (item: TryOnHistoryItem) => {
    // Open TryOnDialog with history result data
    openDialog({
      historyResult: {
        resultImageUrl: item.result_image_url,
        bodyImageUrl: item.body_image_url,
        clothingItems: item.clothing_items,
      },
    });
    toast.success(t('history_reloaded'));
  };

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { locale: dateLocale, addSuffix: true });
  };

  const toggleSelectForCompare = (item: TryOnHistoryItem) => {
    if (selectedForCompare.includes(item.id)) {
      setSelectedForCompare(prev => prev.filter(id => id !== item.id));
    } else if (selectedForCompare.length < 4) {
      setSelectedForCompare(prev => [...prev, item.id]);
    } else {
      toast.error(t('history_max_compare'));
    }
  };

  const handleStartCompare = () => {
    if (selectedForCompare.length < 2) {
      toast.error(t('history_select_min'));
      return;
    }

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

    toast.success(t('history_added_to_compare').replace('{count}', selectedForCompare.length.toString()));
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
      <div className="pb-24 pt-16 px-4 max-w-lg mx-auto">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <History size={32} className="text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground mb-2">
            {t('history_login_to_view')}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {t('history_login_required')}
          </p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">
            {t('login')}
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="pb-24 pt-16 px-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-24 h-24">
          <DotLottieReact
            src="https://lottie.host/0c5e8c0a-6af5-4b32-bdbd-25d0d04f7980/W8dWzCXoD9.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">📚 Đang tải lịch sử...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-16 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <History size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">
              {t('history_title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {compareMode 
                ? `${t('history_selected')} ${selectedForCompare.length}/4` 
                : `${history.length} ${t('history_results_saved')}`}
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
            {t('history_compare')}
          </Button>
        )}
      </div>

      {/* Compare mode bar */}
      {compareMode && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border border-border rounded-2xl shadow-medium p-3 flex items-center justify-between animate-slide-up max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-primary" />
            <span className="text-sm font-medium">
              {selectedForCompare.length < 2 
                ? t('history_select_more').replace('{count}', (2 - selectedForCompare.length).toString())
                : t('history_outfits_selected').replace('{count}', selectedForCompare.length.toString())}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelCompareMode}
            >
              <X size={16} />
              {t('cancel')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleStartCompare}
              disabled={selectedForCompare.length < 2}
            >
              <Scale size={16} />
              {t('history_compare')}
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
            {t('history_no_history')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('history_try_and_save')}
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
                    {item.clothing_items.length} {t('history_items')}
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
                      title={t('history_reuse')}
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