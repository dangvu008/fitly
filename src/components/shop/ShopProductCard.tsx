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
    // Compact variant for horizontal scroll
    return (
      <div
        className={cn(
          'flex-shrink-0 w-36 bg-card rounded-xl border overflow-hidden shadow-sm',
          className
        )}
      >
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-muted">
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
        <div className="p-2 space-y-1.5">
          <p className="text-xs font-medium line-clamp-1">{product.brand || product.name}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{product.name}</p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="default"
              className="w-full h-7 text-[10px] bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              onClick={() => onTryOn(product)}
            >
              <Zap className="h-3 w-3 mr-0.5" />
              Try On
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-[10px]"
              onClick={() => onBuy(product)}
            >
              <ShoppingCart className="h-3 w-3 mr-0.5" />
              {formattedPrice}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full variant for grid view
  return (
    <div
      className={cn(
        'flex flex-col bg-card rounded-xl border overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Platform badge */}
        <div
          className={cn(
            'absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white font-medium',
            PLATFORM_COLORS[product.platform]
          )}
        >
          {PLATFORM_NAMES[product.platform]}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col">
        {product.brand && (
          <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
        )}
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>

        {/* Action Buttons */}
        <div className="mt-auto space-y-2">
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            onClick={() => onTryOn(product)}
          >
            <Zap className="h-4 w-4 mr-1" />
            Try On
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onBuy(product)}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Buy {formattedPrice}
          </Button>
        </div>
      </div>
    </div>
  );
}
