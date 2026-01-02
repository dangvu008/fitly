import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, Gem, Image, Loader2, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProSubscription } from '@/hooks/useProSubscription';
import { useHaptics } from '@/hooks/useHaptics';
import { useRevenueCat, PRODUCT_IDS } from '@/hooks/useRevenueCat';
import { confettiService } from '@/utils/confetti';
import { toast } from 'sonner';

interface ProSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  { icon: Image, label: 'pro_feature_4k', fallback: 'Unlimited 4K Try-ons' },
  { icon: Gem, label: 'pro_feature_no_gems', fallback: 'No Gem cost for try-ons' },
  { icon: Crown, label: 'pro_feature_badge', fallback: 'Exclusive Pro Badge' },
];

export function ProSubscriptionDialog({ isOpen, onClose }: ProSubscriptionDialogProps) {
  const { t } = useLanguage();
  const { subscribe, isSubscribing, isPro, daysRemaining } = useProSubscription();
  const { triggerSuccess, triggerError } = useHaptics();
  const { 
    getSubscriptionPackages, 
    purchase, 
    restorePurchases,
    isLoading: rcLoading,
    getProductPrice 
  } = useRevenueCat();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isRestoring, setIsRestoring] = useState(false);
  const [prices, setPrices] = useState({
    monthly: '$4.99/month',
    yearly: '$29.99/year',
  });

  // Load prices from RevenueCat
  useEffect(() => {
    const monthlyPrice = getProductPrice(PRODUCT_IDS.PRO_MONTHLY);
    const yearlyPrice = getProductPrice(PRODUCT_IDS.PRO_YEARLY);
    
    if (monthlyPrice || yearlyPrice) {
      setPrices({
        monthly: monthlyPrice || '$4.99/month',
        yearly: yearlyPrice || '$29.99/year',
      });
    }
  }, [getProductPrice]);

  const handleSubscribe = async () => {
    const productId = selectedPlan === 'yearly' 
      ? PRODUCT_IDS.PRO_YEARLY 
      : PRODUCT_IDS.PRO_MONTHLY;
    
    try {
      const success = await purchase(productId);
      
      if (success) {
        // Also update local subscription state
        await subscribe({
          plan: selectedPlan === 'yearly' ? 'pro_yearly' : 'pro_monthly',
          platform: 'web',
        });
        
        // Success feedback
        triggerSuccess();
        confettiService.fireUpgrade();
        
        toast.success('Welcome to Pro! 🎉');
        onClose();
      } else {
        toast.info('Subscription cancelled');
      }
    } catch (err) {
      triggerError();
      toast.error('Subscription failed. Please try again.');
      console.error('Subscription error:', err);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        toast.success('Purchases restored!');
      } else {
        toast.info('No purchases to restore');
      }
    } catch (err) {
      toast.error('Failed to restore purchases');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-semibold text-foreground">
            {t('pro_title') || 'Upgrade to Pro'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Features List */}
          <div className="space-y-3">
            {PRO_FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-full bg-yellow-100">
                  <feature.icon className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="font-medium">
                  {feature.fallback}
                </span>
                <Check className="h-4 w-4 text-green-500 ml-auto" />
              </div>
            ))}
          </div>

          {/* Plan Selection */}
          {!isPro && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-muted hover:border-yellow-300'
                }`}
              >
                <div className="text-sm text-muted-foreground">Monthly</div>
                <div className="font-bold">{prices.monthly}</div>
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`p-3 rounded-lg border-2 transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-muted hover:border-yellow-300'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  Save 50%
                </div>
                <div className="text-sm text-muted-foreground">Yearly</div>
                <div className="font-bold">{prices.yearly}</div>
              </button>
            </div>
          )}

          {/* Subscribe Button */}
          {isPro ? (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Crown className="h-5 w-5" />
                <span className="font-semibold">You're a Pro member!</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {daysRemaining} days remaining
              </div>
            </div>
          ) : (
            <>
              <Button
                className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                onClick={handleSubscribe}
                disabled={isSubscribing || rcLoading}
              >
                {isSubscribing || rcLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Crown className="h-5 w-5 mr-2" />
                )}
                {isSubscribing ? 'Processing...' : t('pro_subscribe') || 'Subscribe Now'}
              </Button>
              
              {/* Restore Purchases */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleRestore}
                disabled={isRestoring}
              >
                {isRestoring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Restore Purchases
              </Button>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Subscription auto-renews unless cancelled.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
