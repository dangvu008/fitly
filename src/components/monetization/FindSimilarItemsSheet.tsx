import { ShoppingBag, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AffiliateProductCard, AffiliateProduct } from './AffiliateProductCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FindSimilarItemsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: AffiliateProduct[];
  tryOnResultId?: string;
  isLoading?: boolean;
}

export function FindSimilarItemsSheet({
  isOpen,
  onClose,
  products,
  tryOnResultId,
  isLoading = false,
}: FindSimilarItemsSheetProps) {
  const { t } = useLanguage();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {t('affiliate_find_similar') || 'Find Similar Items'}
          </SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <ScrollArea className="h-full py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No similar items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-8">
              {products.map((product) => (
                <AffiliateProductCard
                  key={product.id}
                  product={product}
                  source="try_on_result"
                  tryOnResultId={tryOnResultId}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Sample products for demo/testing
export const SAMPLE_AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: '1',
    name: 'Classic White T-Shirt Cotton Blend',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
    price: '29.99',
    currency: '$',
    shopUrl: 'https://amazon.com/dp/example1?tag=vton-20',
    platform: 'amazon',
  },
  {
    id: '2',
    name: 'Slim Fit Blue Denim Jeans',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300',
    price: '49.99',
    currency: '$',
    shopUrl: 'https://amazon.com/dp/example2?tag=vton-20',
    platform: 'amazon',
  },
  {
    id: '3',
    name: 'Casual Summer Dress Floral',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300',
    price: '199000',
    currency: '₫',
    shopUrl: 'https://shopee.vn/product/example3',
    platform: 'shopee',
  },
  {
    id: '4',
    name: 'Elegant Black Blazer',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
    price: '89.99',
    currency: '$',
    shopUrl: 'https://zalora.com/product/example4',
    platform: 'zalora',
  },
];
