import { Shirt, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SharedOutfit } from '@/hooks/useOutfitTryOn';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserGems } from '@/hooks/useUserGems';
import { useAuth } from '@/contexts/AuthContext';
import { useProSubscription } from '@/hooks/useProSubscription';
import { useTryOnDialog } from '@/contexts/TryOnDialogContext';
import { toast } from 'sonner';
import { TRY_OUTFIT_COST } from '@/lib/pricing';

// Cost in gems to try on an outfit from the feed (from pricing constants)
export const TRY_OUTFIT_GEM_COST = TRY_OUTFIT_COST;

interface TryOutfitButtonProps {
  outfit: SharedOutfit;
  variant?: 'icon' | 'full';
  onTryOn?: () => void;
  className?: string;
}

/**
 * TryOutfitButton - Button to trigger try-on flow for a shared outfit
 * 
 * Displays as icon-only for feed cards, or full button with text for detail pages.
 * Opens TryOnDialog when clicked.
 * 
 * Requirements: 1.1 - Display "Try this outfit" button on shared outfits
 */
export const TryOutfitButton = ({
  outfit,
  variant = 'icon',
  onTryOn,
  className,
}: TryOutfitButtonProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasEnoughGems, spendGems, isSpending } = useUserGems();
  const { isPro } = useProSubscription();
  const { openDialog } = useTryOnDialog();

  const handleClick = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error('Vui lòng đăng nhập để thử outfit');
      return;
    }

    // Pro users don't need to spend gems
    if (isPro) {
      openTryOnDialog();
      onTryOn?.();
      return;
    }

    // Check if user has enough gems
    if (!hasEnoughGems(TRY_OUTFIT_GEM_COST)) {
      toast.error(`Bạn cần ${TRY_OUTFIT_GEM_COST}💎 để thử outfit này. Hãy mua thêm gems!`);
      return;
    }

    // Spend gems before opening dialog
    try {
      await spendGems({
        amount: TRY_OUTFIT_GEM_COST,
        description: `Thử outfit: ${outfit.title}`,
        referenceId: outfit.id,
      });
      
      openTryOnDialog();
      onTryOn?.();
    } catch (error) {
      console.error('Failed to spend gems:', error);
      toast.error('Không thể trừ gems. Vui lòng thử lại.');
    }
  };

  const openTryOnDialog = () => {
    // Convert outfit clothing items to ClothingItem format
    const clothingItems = outfit.clothing_items?.map((item, index) => ({
      id: `outfit-${outfit.id}-${index}`,
      name: item.name,
      imageUrl: item.imageUrl,
      category: 'all' as const,
      shopUrl: item.shopUrl,
      price: item.price,
    })) || [];

    openDialog({
      reuseClothingItems: clothingItems,
    });
  };

  // Render gem cost badge
  const GemCostBadge = () => (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-500">
      {TRY_OUTFIT_GEM_COST}<Gem size={12} className="fill-amber-500" />
    </span>
  );

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isSpending}
        className={cn(
          "relative text-foreground hover:text-primary transition-colors active:scale-90",
          isSpending && "opacity-50 cursor-not-allowed",
          className
        )}
        title={isPro ? t('feed_try_this_outfit') : `${t('feed_try_this_outfit')} (${TRY_OUTFIT_GEM_COST}💎)`}
      >
        <Shirt size={24} />
        {/* Gem cost indicator for non-Pro users */}
        {!isPro && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
            {TRY_OUTFIT_GEM_COST}
          </span>
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isSpending}
      className={cn("gap-2", className)}
      variant="default"
    >
      <Shirt size={18} />
      {t('feed_try_this_outfit')}
      {!isPro && <GemCostBadge />}
    </Button>
  );
};
