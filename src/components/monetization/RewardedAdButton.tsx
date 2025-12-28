import { Play, Loader2, Gem, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRewardedAds } from '@/hooks/useRewardedAds';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RewardedAdButtonProps {
  onSuccess?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function RewardedAdButton({ 
  onSuccess, 
  variant = 'default',
  className 
}: RewardedAdButtonProps) {
  const { t } = useLanguage();
  const { adState, isAdLoading, isAdPlaying, watchAd } = useRewardedAds();

  const handleWatchAd = async () => {
    const success = await watchAd();
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const isDisabled = !adState.canWatchAd || isAdLoading || isAdPlaying;

  if (variant === 'compact') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleWatchAd}
        disabled={isDisabled}
        className={cn("gap-1.5", className)}
      >
        {isAdLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Loading...</span>
          </>
        ) : isAdPlaying ? (
          <>
            <Play size={14} className="animate-pulse" />
            <span>Playing...</span>
          </>
        ) : !adState.canWatchAd ? (
          <>
            <Clock size={14} />
            <span>Limit reached</span>
          </>
        ) : (
          <>
            <Play size={14} />
            <span>Watch Ad</span>
            <Gem size={12} className="text-blue-500" />
            <span className="text-blue-500">+1</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        variant="outline"
        className="w-full h-12 justify-between"
        onClick={handleWatchAd}
        disabled={isDisabled}
      >
        <div className="flex items-center gap-2">
          {isAdLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isAdPlaying ? (
            <Play size={18} className="animate-pulse text-green-500" />
          ) : (
            <Play size={18} />
          )}
          <span>
            {isAdLoading 
              ? t('ads_loading') || 'Loading ad...'
              : isAdPlaying 
                ? 'Watching ad...'
                : t('gems_watch_ad') || 'Watch Ad for 1 Gem'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-blue-500 font-semibold">
          <Gem size={16} />
          <span>+1</span>
        </div>
      </Button>
      
      {/* Ad limit indicator */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>{adState.remainingAds}/{5} ads remaining today</span>
        {!adState.canWatchAd && (
          <span className="text-orange-500">
            ({t('ads_limit_reached') || 'Daily limit reached'})
          </span>
        )}
      </div>
    </div>
  );
}
