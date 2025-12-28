import { useState } from 'react';
import { Gem, Sparkles, Check } from 'lucide-react';
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
import { RewardedAdButton } from './RewardedAdButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GemPackage {
  id: string;
  gems: number;
  price: number;
  currency: string;
  isBestValue?: boolean;
}

const GEM_PACKAGES: GemPackage[] = [
  { id: 'small', gems: 10, price: 0.99, currency: 'USD' },
  { id: 'medium', gems: 50, price: 3.99, currency: 'USD', isBestValue: true },
  { id: 'large', gems: 120, price: 7.99, currency: 'USD' },
];

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
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (pkg: GemPackage) => {
    setSelectedPackage(pkg.id);
    // TODO: Integrate with actual IAP (App Store / Play Store)
    toast.info(`Processing purchase of ${pkg.gems} gems...`);
    
    // Simulate purchase for demo
    setTimeout(async () => {
      try {
        await addGems({
          amount: pkg.gems,
          type: 'purchase',
          description: `Purchased ${pkg.gems} gems`,
          referenceId: `purchase_${Date.now()}`,
        });
        toast.success(`+${pkg.gems} Gems added!`);
        onClose();
      } catch {
        toast.error('Purchase failed');
      } finally {
        setSelectedPackage(null);
      }
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-purple-500" />
            {t('gems_buy_title') || 'Get More Gems'}
          </DialogTitle>
          <DialogDescription>
            Current balance: <span className="font-semibold">{balance} gems</span>
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
            {GEM_PACKAGES.map((pkg) => (
              <Button
                key={pkg.id}
                variant="outline"
                className={cn(
                  'w-full justify-between h-14 relative',
                  pkg.isBestValue && 'border-purple-500 bg-purple-50/50'
                )}
                onClick={() => handlePurchase(pkg)}
                disabled={isAdding && selectedPackage === pkg.id}
              >
                {pkg.isBestValue && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t('gems_best_value') || 'Best Value'}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Gem className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{pkg.gems} Gems</div>
                    <div className="text-xs text-muted-foreground">
                      ${pkg.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                {selectedPackage === pkg.id ? (
                  <Check className="h-5 w-5 text-green-500 animate-pulse" />
                ) : (
                  <span className="text-purple-500 font-semibold">
                    +{pkg.gems} 💎
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
