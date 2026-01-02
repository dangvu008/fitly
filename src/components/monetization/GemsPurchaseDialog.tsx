import { useState, useEffect } from 'react';
import { Gem, Sparkles, Check, Loader2 } from 'lucide-react';
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
import { useRevenueCat, PRODUCT_IDS } from '@/hooks/useRevenueCat';
import { confettiService } from '@/utils/confetti';
import { RewardedAdButton } from './RewardedAdButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GemPackage {
  id: string;
  productId: string;
  gems: number;
  price: string;
  isBestValue?: boolean;
}

// Map RevenueCat product IDs to gem amounts
const GEMS_MAP: Record<string, number> = {
  [PRODUCT_IDS.GEMS_50]: 50,
  [PRODUCT_IDS.GEMS_150]: 150,
  [PRODUCT_IDS.GEMS_500]: 500,
};

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
    getGemPackages, 
    purchase, 
    isLoading: rcLoading,
    getProductPrice 
  } = useRevenueCat();
  
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<GemPackage[]>([]);

  // Load packages from RevenueCat
  useEffect(() => {
    const rcPackages = getGemPackages();
    
    if (rcPackages.length > 0) {
      setPackages(rcPackages.map((pkg, index) => ({
        id: pkg.identifier,
        productId: pkg.product.identifier,
        gems: GEMS_MAP[pkg.product.identifier] || 50,
        price: pkg.product.priceString,
        isBestValue: index === 1, // Middle package is best value
      })));
    } else {
      // Fallback packages
      setPackages([
        { id: 'small', productId: PRODUCT_IDS.GEMS_50, gems: 50, price: '$0.99' },
        { id: 'medium', productId: PRODUCT_IDS.GEMS_150, gems: 150, price: '$2.99', isBestValue: true },
        { id: 'large', productId: PRODUCT_IDS.GEMS_500, gems: 500, price: '$7.99' },
      ]);
    }
  }, [getGemPackages]);

  const handlePurchase = async (pkg: GemPackage) => {
    setSelectedPackage(pkg.id);
    
    try {
      const success = await purchase(pkg.productId);
      
      if (success) {
        // Add gems to user balance
        await addGems({
          amount: pkg.gems,
          type: 'purchase',
          description: `Purchased ${pkg.gems} gems`,
          referenceId: `rc_${pkg.productId}_${Date.now()}`,
        });
        
        // Success feedback
        triggerSuccess();
        confettiService.fireSuccess();
        
        toast.success(`+${pkg.gems} Gems added!`);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-gem" />
            {t('gems_buy_title') || 'Get More Gems'}
          </DialogTitle>
          <DialogDescription>
            Current balance: <span className="font-semibold text-gem">{balance} gems</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Watch Ad Option */}
          <RewardedAdButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or purchase
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
              packages.map((pkg) => (
                <Button
                  key={pkg.id}
                  variant="outline"
                  className={cn(
                    'w-full justify-between h-14 relative',
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
                      <div className="font-medium">{pkg.gems} Gems</div>
                      <div className="text-xs text-muted-foreground">
                        {pkg.price}
                      </div>
                    </div>
                  </div>
                  {selectedPackage === pkg.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <span className="text-gem font-semibold">
                      +{pkg.gems} 💎
                    </span>
                  )}
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
