import { useState } from 'react';
import { Gem, Play, ShoppingCart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useUserGems } from '@/hooks/useUserGems';
import { useLanguage } from '@/contexts/LanguageContext';

export interface GemGateProps {
  /** Number of gems required for the action */
  requiredGems?: number;
  /** Current gem balance (optional, will use hook if not provided) */
  balance?: number;
  /** Whether the gate dialog is open */
  isOpen: boolean;
  /** Callback when user has sufficient gems and proceeds */
  onSufficientGems: () => void;
  /** Callback when user chooses to watch an ad */
  onWatchAd: () => void;
  /** Callback when user chooses to purchase gems */
  onPurchase: () => void;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * GemGate - Component for checking and handling gem balance
 * 
 * Displays:
 * - Current gem balance
 * - Scarcity message when gems are low (1 gem remaining)
 * - Options when insufficient gems (watch ad or purchase)
 * 
 * @requirements 3.3, 3.5, 6.1
 */
export const GemGate = ({
  requiredGems = 1,
  balance: propBalance,
  isOpen,
  onSufficientGems,
  onWatchAd,
  onPurchase,
  onClose,
  className,
}: GemGateProps) => {
  const { t } = useLanguage();
  const { balance: hookBalance, isLoading } = useUserGems();
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Use prop balance if provided, otherwise use hook balance
  const balance = propBalance ?? hookBalance;
  const hasSufficientGems = balance >= requiredGems;
  const isLastGem = balance === 1 && requiredGems === 1;

  const handleProceed = () => {
    if (hasSufficientGems) {
      onSufficientGems();
    }
  };

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    try {
      await onWatchAd();
    } finally {
      setIsWatchingAd(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-gem" />
            {hasSufficientGems
              ? t('gems_cost')?.replace('{count}', String(requiredGems)) ||
                `Chi phí: ${requiredGems} Gem`
              : t('gems_insufficient') || 'Không đủ Gems'}
          </DialogTitle>
          <DialogDescription>
            {hasSufficientGems
              ? 'Xác nhận sử dụng gem để thử đồ'
              : `Bạn cần ${requiredGems} gem để thử đồ`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Balance display */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Số dư hiện tại</div>
            <div className="text-2xl font-bold flex items-center justify-center gap-2">
              <Gem className="h-6 w-6 text-gem" />
              {isLoading ? '...' : balance}
            </div>
          </div>

          {/* Scarcity message - Requirement 6.1 */}
          {isLastGem && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
              data-testid="scarcity-message"
            >
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Bạn còn 1 lượt thử miễn phí cuối cùng. Hãy chọn bộ đẹp nhất nhé!
              </p>
            </div>
          )}

          {/* Actions based on gem balance */}
          {hasSufficientGems ? (
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent hover:brightness-110"
              onClick={handleProceed}
              data-testid="proceed-button"
            >
              <Gem className="h-4 w-4 mr-2" />
              Sử dụng {requiredGems} Gem để thử đồ
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Watch ad option - Requirement 3.5 */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleWatchAd}
                disabled={isWatchingAd}
                data-testid="watch-ad-button"
              >
                <Play className="h-4 w-4 mr-2" />
                {isWatchingAd
                  ? 'Đang tải quảng cáo...'
                  : t('gems_watch_ad') || 'Xem quảng cáo để nhận 1 Gem'}
              </Button>

              {/* Purchase option - Requirement 3.5 */}
              <Button
                className="w-full bg-gradient-to-r from-gem-dark to-gem hover:brightness-110"
                onClick={onPurchase}
                data-testid="purchase-button"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t('gems_buy_title') || 'Mua thêm Gems'}
              </Button>
            </div>
          )}

          {/* Cancel button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            Hủy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GemGate;
