import { useState } from 'react';
import { Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SharedOutfit } from '@/hooks/useOutfitTryOn';
import { TryOutfitDialog } from './TryOutfitDialog';

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
 * Opens TryOutfitDialog when clicked.
 * 
 * Requirements: 1.1 - Display "Try this outfit" button on shared outfits
 */
export const TryOutfitButton = ({
  outfit,
  variant = 'icon',
  onTryOn,
  className,
}: TryOutfitButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    setDialogOpen(true);
    onTryOn?.();
  };

  const handleSuccess = (resultImageUrl: string) => {
    console.log('Try-on completed:', resultImageUrl);
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={cn(
            "text-foreground hover:text-primary transition-colors active:scale-90",
            className
          )}
          title="Mặc thử outfit này"
        >
          <Shirt size={24} />
        </button>
        <TryOutfitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          outfit={outfit}
          onSuccess={handleSuccess}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        className={cn("gap-2", className)}
        variant="default"
      >
        <Shirt size={18} />
        Mặc thử outfit này
      </Button>
      <TryOutfitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        outfit={outfit}
        onSuccess={handleSuccess}
      />
    </>
  );
};
