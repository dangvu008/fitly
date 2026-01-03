import { useState } from 'react';
import { Gem, Sparkles, Loader2, Zap } from 'lucide-react';
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
import { useHaptics } from '@/hooks/useHaptics';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { confettiService } from '@/utils/confetti';
import { RewardedAdButton } from './RewardedAdButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  GEM_PACKAGES, 
  getTotalGems,
  TRY_ON_COST_STANDARD,
  TRY_ON_COST_4K,
  type GemPackage 
} from '@/lib/pricing';

interface GemsPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GemsPurchaseDialog({ 
  isOpen, 
  onClose,
}: GemsPurchaseDialogProps) {
  const { t } = useLanguage();
  const { balance, addGems, isAdding } = useUserGems();
  const { triggerSuccess, triggerError } = useHaptics();
  const { 
    purchase, 
    isLoading: rcLoading,
  } = useRevenueCat();
  
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (pkg: GemPackage) => {
    setSelectedPackage(pkg.id);
    
    try {
      const success = await purchase(pkg.productId);
      const totalGems = getTotalGems(pkg);
      
      if (success) {
        // Add gems to user balance (including bonus)
        await addGems({
          amount: totalGems,
          type: 'purchase',
          description: `Purchased ${pkg.gems} gems${pkg.bonusGems ? ` + ${pkg.bonusGems} bonus` : ''}`,
          referenceId: `rc_${pkg.productId}_${Date.now()}`,
        });
        
        // Success feedback
        triggerSuccess();
        confettiService.fireSuccess();
        
        toast.success(`+${totalGems} Gems added!`);
        onClose();
      } else {
        triggerError();
        toast.error('Purchase cancelled');
      }
    } catch (err) {
      triggerError();
      toast.error('Purchase failed. Please try again.');
      console.error('Purchase error:', err);
    } finally {
      setSelectedPackage(null);
    }
  };

  const isPurchasing = isAdding || (selectedPackage !== null);

  // Calculate try-on counts for display
  const getTryOnCount = (gems: number, type: 'standard' | '4k') => {
    const cost = type === '4k' ? TRY_ON_COST_4K : TRY_ON_COST_STANDARD;
    return Math.floor(gems / cost);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-gem" />
            {t('gems_buy_title') || 'Get More Gems'}
          </DialogTitle>
          <DialogDescription>
            Số dư hiện tại: <span className="font-semibold text-gem">{balance} gems</span>
          </DialogDescription>
        </DialogHeader>

        {/* Pricing info */}
        <div className="flex gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Thử đồ: {TRY_ON_COST_STANDARD}💎</span>
          </div>
          <span>•</span>
          <div>4K: {TRY_ON_COST_4K}💎</div>
        </div>

        <div className="space-y-4 py-2">
          {/* Watch Ad Option */}
          <RewardedAdButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                hoặc mua gems
              </span>
            </div>
          </div>

          {/* Gem Packages */}
          <div className="space-y-2">
            {rcLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              GEM_PACKAGES.map((pkg) => {
                const totalGems = getTotalGems(pkg);
                const tryOnCount = getTryOnCount(totalGems, 'standard');
                
                return (
                  <Button
                    key={pkg.id}
                    variant="outline"
                    className={cn(
                      'w-full justify-between h-auto py-3 relative',
                      pkg.isBestValue && 'border-magic-from bg-magic-from/5'
                    )}
                    onClick={() => handlePurchase(pkg)}
                    disabled={isPurchasing}
                  >
                    {pkg.isBestValue && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 gradient-magic text-white text-xs rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {t('gems_best_value') || 'Best Value'}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gem/20">
                        <Gem className="h-4 w-4 text-gem" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">
                          {pkg.gems} Gems
                          {pkg.bonusGems && (
                            <span className="text-green-500 ml-1">+{pkg.bonusGems} bonus</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pkg.priceString} • ~{tryOnCount} lần thử
                        </div>
                      </div>
                    </div>
                    {selectedPackage === pkg.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <span className="text-gem font-semibold">
                        +{totalGems} 💎
                      </span>
                    )}
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
