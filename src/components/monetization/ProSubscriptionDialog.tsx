import { useState, useEffect } from 'react';
import { Crown, Check, Gem, Image, Loader2, RotateCcw, Zap, Sparkles, Clock } from 'lucide-react';
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
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/pricing';

interface ProSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Updated Pro features matching new pricing strategy
const PRO_FEATURES_MONTHLY = [
  { icon: Zap, label: '500 Fast-Pass try-ons/tháng' },
  { icon: Gem, label: '100 bonus gems mỗi tháng' },
  { icon: Image, label: 'Xuất ảnh 4K miễn phí' },
  { icon: Crown, label: 'Ưu tiên xử lý cao' },
  { icon: Clock, label: 'Không quảng cáo' },
];

const PRO_FEATURES_YEARLY = [
  { icon: Zap, label: '800 Fast-Pass try-ons/tháng' },
  { icon: Gem, label: '200 bonus gems mỗi tháng' },
  { icon: Image, label: 'Xuất ảnh 4K miễn phí' },
  { icon: Crown, label: 'Ưu tiên xử lý cao nhất' },
  { icon: Clock, label: 'Hỗ trợ VIP 24/7' },
  { icon: Sparkles, label: '7 ngày dùng thử miễn phí' },
];

export function ProSubscriptionDialog({ isOpen, onClose }: ProSubscriptionDialogProps) {
  const { t } = useLanguage();
  const { subscribe, isSubscribing, isPro, daysRemaining } = useProSubscription();
  const { triggerSuccess, triggerError } = useHaptics();
  const { 
    purchase, 
    restorePurchases,
    isLoading: rcLoading,
  } = useRevenueCat();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isRestoring, setIsRestoring] = useState(false);

  // Get plan details from pricing constants
  const monthlyPlan = SUBSCRIPTION_PLANS.find(p => p.period === 'monthly');
  const yearlyPlan = SUBSCRIPTION_PLANS.find(p => p.period === 'yearly');

  const currentFeatures = selectedPlan === 'yearly' ? PRO_FEATURES_YEARLY : PRO_FEATURES_MONTHLY;
  const savingsPercent = yearlyPlan && monthlyPlan 
    ? Math.round((1 - (yearlyPlan.price / 12) / monthlyPlan.price) * 100)
    : 33;

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
        
        toast.success('Chào mừng đến với Pro! 🎉');
        onClose();
      } else {
        toast.info('Đã hủy đăng ký');
      }
    } catch (err) {
      triggerError();
      toast.error('Đăng ký thất bại. Vui lòng thử lại.');
      console.error('Subscription error:', err);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        toast.success('Đã khôi phục giao dịch!');
      } else {
        toast.info('Không có giao dịch để khôi phục');
      }
    } catch (err) {
      toast.error('Không thể khôi phục giao dịch');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-semibold text-foreground">
            {t('pro_title') || 'Nâng cấp lên Pro'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Plan Selection */}
          {!isPro && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedPlan === 'monthly'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
                    : 'border-muted hover:border-yellow-300'
                }`}
              >
                <div className="text-xs text-muted-foreground">Hàng tháng</div>
                <div className="font-bold text-lg">{monthlyPlan?.priceString || '$9.99/month'}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {monthlyPlan?.fastPassTryOns || 500} try-ons
                </div>
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`p-3 rounded-lg border-2 transition-all relative text-left ${
                  selectedPlan === 'yearly'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
                    : 'border-muted hover:border-yellow-300'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full whitespace-nowrap">
                  Tiết kiệm {savingsPercent}%
                </div>
                <div className="text-xs text-muted-foreground">Hàng năm</div>
                <div className="font-bold text-lg">{yearlyPlan?.priceString || '$79.99/year'}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ~${yearlyPlan?.monthlyPrice?.toFixed(2) || '6.67'}/tháng • {yearlyPlan?.fastPassTryOns || 800} try-ons
                </div>
              </button>
            </div>
          )}

          {/* Features List */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              {selectedPlan === 'yearly' ? 'Quyền lợi Pro Yearly:' : 'Quyền lợi Pro Monthly:'}
            </div>
            {currentFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg">
                <div className="p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <feature.icon className="h-3.5 w-3.5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium flex-1">
                  {feature.label}
                </span>
                <Check className="h-4 w-4 text-green-500" />
              </div>
            ))}
          </div>

          {/* Important Note */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <strong>Lưu ý:</strong> Sau khi hết lượt Fast-Pass trong tháng, bạn vẫn có thể thử đồ nhưng sẽ được xếp vào hàng đợi ưu tiên thấp hơn.
          </div>

          {/* Subscribe Button */}
          {isPro ? (
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Crown className="h-5 w-5" />
                <span className="font-semibold">Bạn đã là thành viên Pro!</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Còn {daysRemaining} ngày
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
                {isSubscribing ? 'Đang xử lý...' : selectedPlan === 'yearly' ? 'Bắt đầu dùng thử 7 ngày' : 'Đăng ký ngay'}
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
                Khôi phục giao dịch
              </Button>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
            Tự động gia hạn trừ khi bạn hủy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
