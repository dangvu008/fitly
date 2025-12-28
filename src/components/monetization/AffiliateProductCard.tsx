import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useVisualSearch, AffiliateProduct } from '@/hooks/useVisualSearch';

// Re-export the type for backward compatibility
export type { AffiliateProduct };

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  source?: string;
  tryOnResultId?: string;
  className?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  amazon: 'bg-orange-500',
  shopee: 'bg-orange-600',
  lazada: 'bg-purple-600',
  zalora: 'bg-black',
  other: 'bg-gray-600',
};

const PLATFORM_NAMES: Record<string, string> = {
  amazon: 'Amazon',
  shopee: 'Shopee',
  lazada: 'Lazada',
  zalora: 'Zalora',
  other: 'Shop',
};

// Format price based on currency
function formatPrice(price: number, currency: string): string {
  if (currency === 'VND' || currency === '₫') {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  }
  if (currency === 'USD' || currency === '$') {
    return '$' + price.toFixed(2);
  }
  return `${currency} ${price}`;
}

export function AffiliateProductCard({
  product,
  source = 'search',
  tryOnResultId,
  className,
}: AffiliateProductCardProps) {
  const { t } = useLanguage();
  const { trackClick } = useVisualSearch();

  const handleShopNow = async () => {
    // Track the click
    await trackClick(product.id, product.productUrl);

    // Open the affiliate link
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const platformLabel = PLATFORM_NAMES[product.platform] 
    ? `on ${PLATFORM_NAMES[product.platform]}`
    : 'Shop';

  return (
    <div className={cn(
      'flex flex-col bg-card rounded-lg border overflow-hidden',
      className
    )}>
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className={cn(
          'absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white font-medium',
          PLATFORM_COLORS[product.platform]
        )}>
          {PLATFORM_NAMES[product.platform]}
        </div>
        {/* Similarity badge */}
        {product.similarity > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white">
            {Math.round(product.similarity * 100)}% match
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="text-lg font-bold text-primary mb-2">
          {formatPrice(product.price, product.currency)}
        </div>
        
        <Button
          size="sm"
          className="w-full mt-auto"
          onClick={handleShopNow}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          {t('affiliate_shop_now') || 'Shop Now'}
        </Button>
        <span className="text-xs text-muted-foreground text-center mt-1">
          {platformLabel}
        </span>
      </div>
    </div>
  );
}
