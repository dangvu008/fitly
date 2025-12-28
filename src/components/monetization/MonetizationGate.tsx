import { useState } from 'react';
import { Gem, Play, Lock, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserGems } from '@/hooks/useUserGems';
import { useProSubscription } from '@/hooks/useProSubscription';
import { toast } from 'sonner';

interface MonetizationGateProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  type: 'gems' | 'pro';
  gemCost?: number;
  featureName?: string;
}

export function MonetizationGate({
  isOpen,
  onClose,
  onUnlock,
  type,
  gemCost = 1,
  featureName = 'this feature',
}: MonetizationGateProps) {
  const { t } = useLanguage();
  const { balance, spendGems, addGems, isSpending } = useUserGems();
  const { isPro } = useProSubscription();
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const hasEnoughGems = balance >= gemCost;

  const handleSpendGems = async () => {
    if (!hasEnoughGems) {
      toast.error(t('gems_insufficient') || 'Not enough gems');
      return;
    }

    try {
      await spendGems({
        amount: gemCost,
        description: `Used for ${featureName}`,
      });
      toast.success(`-${gemCost} Gem`);
      onUnlock();
      onClose();
    } catch {
      toast.error('Failed to spend gems');
    }
  };

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    // TODO: Integrate with actual ad SDK
    toast.info('Loading ad...');
    
    setTimeout(async () => {
      try {
        await addGems({
          amount: 1,
          type: 'ad_reward',
          description: 'Watched rewarded ad',
        });
        toast.success('+1 Gem earned!');
        
        // Auto-spend if now has enough
        if (balance + 1 >= gemCost) {
          await spendGems({
            amount: gemCost,
            description: `Used for ${featureName}`,
          });
          onUnlock();
          onClose();
        }
      } catch {
        toast.error('Failed to reward gem');
      } finally {
        setIsWatchingAd(false);
      }
    }, 2000);
  };

  // Pro gate
  if (type === 'pro') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {t('pro_locked') || 'Pro Feature'}
            </DialogTitle>
            <DialogDescription>
              {featureName} requires a Pro subscription
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Pro to unlock unlimited 4K try-ons, no gem costs, and more!
            </p>
            <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              <Crown className="h-4 w-4 mr-2" />
              {t('pro_subscribe') || 'Subscribe Now'} - $4.99/week
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Gems gate
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-purple-500" />
            {t('gems_cost')?.replace('{count}', String(gemCost)) || `Cost: ${gemCost} Gem`}
          </DialogTitle>
          <DialogDescription>
            You need {gemCost} gem{gemCost > 1 ? 's' : ''} to use {featureName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Your balance</div>
            <div className="text-2xl font-bold flex items-center justify-center gap-2">
              <Gem className="h-6 w-6 text-purple-500" />
              {balance}
            </div>
          </div>

          {hasEnoughGems ? (
            <Button
              className="w-full"
              onClick={handleSpendGems}
              disabled={isSpending}
            >
              <Gem className="h-4 w-4 mr-2" />
              {isSpending ? 'Processing...' : `Use ${gemCost} Gem`}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleWatchAd}
                disabled={isWatchingAd}
              >
                <Play className="h-4 w-4 mr-2" />
                {isWatchingAd ? 'Watching...' : t('gems_watch_ad') || 'Watch Ad for 1 Gem'}
              </Button>
              <Button variant="default" className="w-full">
                <Gem className="h-4 w-4 mr-2" />
                Buy Gems
              </Button>
            </>
          )}

          {isPro && (
            <p className="text-xs text-center text-muted-foreground">
              Pro subscribers get unlimited try-ons without gem costs!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
