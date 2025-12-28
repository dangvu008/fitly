import { Crown, Check, Sparkles, Gem, Image } from 'lucide-react';
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

  const handleSubscribe = async () => {
    // TODO: Integrate with actual IAP (App Store / Play Store)
    toast.info('Processing subscription...');
    
    try {
      await subscribe({
        plan: 'pro_weekly',
        platform: 'web', // Detect platform in real implementation
      });
      toast.success('Welcome to Pro! 🎉');
      onClose();
    } catch {
      toast.error('Subscription failed. Please try again.');
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
                  {t(feature.label) || feature.fallback}
                </span>
                <Check className="h-4 w-4 text-green-500 ml-auto" />
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center gap-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Special Price</span>
            </div>
            <div className="text-3xl font-bold text-foreground mt-1">
              {t('pro_price') || '$4.99/week'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Cancel anytime
            </div>
          </div>

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
            <Button
              className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
              onClick={handleSubscribe}
              disabled={isSubscribing}
            >
              <Crown className="h-5 w-5 mr-2" />
              {isSubscribing ? 'Processing...' : t('pro_subscribe') || 'Subscribe Now'}
            </Button>
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
