import { Plus, Search } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ClothingItem } from '@/types/clothing';
import { ClothingItemInfo } from '@/hooks/useOutfitTryOn';
import { cn } from '@/lib/utils';

interface SimilarItemsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceItem: ClothingItemInfo | null;
  similarItems: ClothingItem[];
  onSelectItem?: (item: ClothingItem) => void;
  isSearching?: boolean;
}

/**
 * Bottom sheet displaying similar items from user's wardrobe
 * Shows empty state when no matches found
 * Allows selecting item to add to try-on
 * 
 * Requirements: 3.3, 3.4
 */
export const SimilarItemsSheet = ({
  open,
  onOpenChange,
  sourceItem,
  similarItems,
  onSelectItem,
  isSearching = false,
}: SimilarItemsSheetProps) => {
  const hasItems = similarItems.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Search size={20} />
            Đồ tương tự trong tủ đồ
          </SheetTitle>
          {sourceItem && (
            <SheetDescription>
              Tìm kiếm đồ giống với "{sourceItem.name}"
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Drag handle */}
        <div className="flex justify-center my-4">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="pb-6">
          {isSearching ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-4" />
              <p className="text-sm">Đang tìm kiếm...</p>
            </div>
          ) : hasItems ? (
            /* Results Grid (Requirement 3.3) */
            <div className="grid grid-cols-3 gap-3">
              {similarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectItem?.(item)}
                  className={cn(
                    "bg-muted rounded-xl overflow-hidden",
                    "transition-all duration-200 hover:ring-2 hover:ring-primary/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary"
                  )}
                >
                  <div className="aspect-square relative bg-background">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                    {/* Selection indicator */}
                    <div className="absolute inset-0 bg-primary/0 hover:bg-primary/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity">
                        <Plus size={24} className="text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="text-xs font-medium truncate text-foreground">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {item.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Empty State (Requirement 3.4) */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h4 className="font-medium text-foreground mb-2">
                Không tìm thấy đồ tương tự
              </h4>
              <p className="text-sm text-muted-foreground max-w-xs">
                Bạn chưa có món đồ nào trong danh mục này. Hãy thêm đồ vào tủ đồ để dễ dàng tìm kiếm sau này!
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
