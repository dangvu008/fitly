import { ShoppingBag, X, Search, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AffiliateProductCard } from './AffiliateProductCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVisualSearch, AffiliateProduct } from '@/hooks/useVisualSearch';
import { useEffect } from 'react';

interface FindSimilarItemsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  tryOnResultId?: string;
}

export function FindSimilarItemsSheet({
  isOpen,
  onClose,
  imageUrl,
  tryOnResultId,
}: FindSimilarItemsSheetProps) {
  const { t } = useLanguage();
  const { search, products, isLoading, error, searchProvider } = useVisualSearch();

  // Trigger search when sheet opens with an image
  useEffect(() => {
    if (isOpen && imageUrl) {
      search(imageUrl);
    }
  }, [isOpen, imageUrl, search]);

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
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Searching for similar items...
              </p>
              <div className="flex gap-2 mt-4">
                {['Scanning', 'Matching', 'Finding'].map((step, i) => (
                  <div
                    key={step}
                    className="px-3 py-1 rounded-full bg-muted text-xs animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    {step}...
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-destructive mb-2">{error}</p>
              <p className="text-sm">Showing sample products instead</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No similar items found</p>
            </div>
          ) : (
            <>
              {/* Search provider badge */}
              {searchProvider && searchProvider !== 'fallback' && (
                <div className="flex justify-center mb-4">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    Powered by {searchProvider === 'google' ? 'Google Vision' : 'Bing Visual Search'}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 pb-8">
                {products.map((product) => (
                  <AffiliateProductCard
                    key={product.id}
                    product={product}
                    source="visual_search"
                    tryOnResultId={tryOnResultId}
                  />
                ))}
              </div>
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Sample products for demo/testing (kept for backward compatibility)
export const SAMPLE_AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: '1',
    name: 'Classic White T-Shirt Cotton Blend',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
    price: 29.99,
    currency: 'USD',
    productUrl: 'https://amazon.com/dp/example1?tag=vton-20',
    platform: 'amazon',
    similarity: 0.85,
  },
  {
    id: '2',
    name: 'Slim Fit Blue Denim Jeans',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300',
    price: 49.99,
    currency: 'USD',
    productUrl: 'https://amazon.com/dp/example2?tag=vton-20',
    platform: 'amazon',
    similarity: 0.80,
  },
  {
    id: '3',
    name: 'Casual Summer Dress Floral',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300',
    price: 199000,
    currency: 'VND',
    productUrl: 'https://shopee.vn/product/example3',
    platform: 'shopee',
    similarity: 0.75,
  },
  {
    id: '4',
    name: 'Elegant Black Blazer',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
    price: 89.99,
    currency: 'USD',
    productUrl: 'https://amazon.com/dp/example4?tag=vton-20',
    platform: 'amazon',
    similarity: 0.70,
  },
];
