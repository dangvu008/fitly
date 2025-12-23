import { ExternalLink, Search, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ClothingItemInfo } from '@/hooks/useOutfitTryOn';

interface ClothingItemDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ClothingItemInfo | null;
  onFindSimilar?: (item: ClothingItemInfo) => void;
  onAddToWardrobe?: (item: ClothingItemInfo) => void;
}

/**
 * Bottom sheet displaying detailed information about a clothing item
 * Shows image, name, price, and purchase link
 * Includes "Shop" button (only when shopUrl exists) and "Find similar" button
 * 
 * Requirements: 2.2, 2.3, 3.1
 */
export const ClothingItemDetailSheet = ({
  open,
  onOpenChange,
  item,
  onFindSimilar,
  onAddToWardrobe,
}: ClothingItemDetailSheetProps) => {
  if (!item) return null;

  const hasShopUrl = Boolean(item.shopUrl && item.shopUrl.trim() !== '');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
        <SheetHeader className="sr-only">
          <SheetTitle>{item.name}</SheetTitle>
        </SheetHeader>

        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="space-y-4 pb-6">
          {/* Item Image */}
          <div className="aspect-square max-w-xs mx-auto bg-muted rounded-2xl overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Item Info */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {item.name}
            </h3>
            {item.price && (
              <p className="text-xl font-bold text-primary">
                {item.price}
              </p>
            )}
            {item.category && (
              <p className="text-sm text-muted-foreground capitalize">
                {item.category}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Shop Button - Only shown when shopUrl exists (Requirement 2.3) */}
            {hasShopUrl && (
              <Button
                asChild
                className="w-full gap-2"
                size="lg"
              >
                <a
                  href={item.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={18} />
                  Mua ngay
                </a>
              </Button>
            )}

            {/* Find Similar Button (Requirement 3.1) */}
            <Button
              variant="outline"
              className="w-full gap-2"
              size="lg"
              onClick={() => onFindSimilar?.(item)}
            >
              <Search size={18} />
              Tìm đồ tương tự
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
