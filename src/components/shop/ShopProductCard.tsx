/**
 * ShopProductCard - Product card with Try On and Buy buttons
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { Zap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ShopProduct,
  formatShopPrice,
  PLATFORM_COLORS,
  PLATFORM_NAMES,
} from '@/types/shop';

interface ShopProductCardProps {
  product: ShopProduct;
  onTryOn: (product: ShopProduct) => void;
  onBuy: (product: ShopProduct) => void;
  compact?: boolean; // For horizontal scroll view
  className?: string;
}

export function ShopProductCard({
  product,
  onTryOn,
  onBuy,
  compact = false,
  className,
}: ShopProductCardProps) {
  const formattedPrice = formatShopPrice(product.price, product.currency);

  if (compact) {
    // Compact variant for horizontal scroll - optimized for mobile
    return (
      <div
        className={cn(
          'flex-shrink-0 w-[140px] bg-card rounded-lg border overflow-hidden shadow-sm',
          className
        )}
      >
        {/* Product Image - taller aspect ratio for fashion */}
        <div className="aspect-[3/4] relative overflow-hidden bg-muted">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Platform badge - smaller */}
          <div
            className={cn(
              'absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] text-white font-medium',
              PLATFORM_COLORS[product.platform]
            )}
          >
            {PLATFORM_NAMES[product.platform]}
          </div>
        </div>

        {/* Product Info - more compact */}
        <div className="p-1.5 space-y-1">
          <p className="text-[11px] font-semibold line-clamp-1">{product.brand || product.name}</p>
          <p className="text-[9px] text-muted-foreground line-clamp-1">{product.name}</p>

          {/* Action Buttons - stacked */}
          <div className="flex flex-col gap-0.5 pt-0.5">
            <Button
              size="sm"
              variant="default"
              className="w-full h-6 text-[10px] bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 px-2"
              onClick={() => onTryOn(product)}
            >
              <Zap className="h-2.5 w-2.5 mr-0.5" />
              Try On
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-6 text-[10px] px-2"
              onClick={() => onBuy(product)}
            >
              <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
              {formattedPrice}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full variant for grid view - optimized for mobile
  return (
    <div
      className={cn(
        'flex flex-col bg-card rounded-lg border overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Product Image - taller for fashion */}
      <div className="aspect-[3/4] relative overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Platform badge */}
        <div
          className={cn(
            'absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] text-white font-medium',
            PLATFORM_COLORS[product.platform]
          )}
        >
          {PLATFORM_NAMES[product.platform]}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-2 flex-1 flex flex-col">
        {product.brand && (
          <p className="text-[10px] font-semibold text-foreground mb-0.5">{product.brand}</p>
        )}
        <h3 className="text-[11px] text-muted-foreground line-clamp-2 mb-1.5">{product.name}</h3>

        {/* Action Buttons */}
        <div className="mt-auto space-y-1">
          <Button
            size="sm"
            className="w-full h-7 text-[11px] bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            onClick={() => onTryOn(product)}
          >
            <Zap className="h-3 w-3 mr-1" />
            Try On
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-[11px]"
            onClick={() => onBuy(product)}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {formattedPrice}
          </Button>
        </div>
      </div>
    </div>
  );
}
