/**
 * CollectionRow - A single curated collection with title and horizontal scrollable products
 * Requirements: 4.2, 4.3
 */

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CuratedCollection, ShopProduct, PLATFORM_NAMES } from '@/types/shop';
import { ShopProductCard } from './ShopProductCard';

interface CollectionRowProps {
  collection: CuratedCollection;
  onTryOn: (product: ShopProduct) => void;
  onBuy: (product: ShopProduct) => void;
  className?: string;
}

export function CollectionRow({
  collection,
  onTryOn,
  onBuy,
  className,
}: CollectionRowProps) {
  const sourceLabel = collection.source !== 'mixed' 
    ? PLATFORM_NAMES[collection.source] 
    : 'Various';

  return (
    <div className={cn('py-3', className)}>
      {/* Collection Header */}
      <div className="px-4 mb-3">
        <h3 className="text-base font-semibold text-foreground">
          {collection.title}
        </h3>
        {collection.subtitle && (
          <p className="text-xs text-muted-foreground">
            {collection.subtitle}
          </p>
        )}
      </div>

      {/* Horizontal Scrollable Products */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4 pb-2">
          {collection.products.map((product) => (
            <ShopProductCard
              key={product.id}
              product={product}
              onTryOn={onTryOn}
              onBuy={onBuy}
              compact
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
