/**
 * CuratedCollections - Render multiple CollectionRow vertically
 * Requirements: 4.1, 4.4
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ShopCategory, ShopProduct, CuratedCollection } from '@/types/shop';
import { CURATED_COLLECTIONS, filterProductsByCategory } from '@/data/curatedCollections';
import { CollectionRow } from './CollectionRow';

interface CuratedCollectionsProps {
  selectedCategory: ShopCategory;
  onTryOn: (product: ShopProduct) => void;
  onBuy: (product: ShopProduct) => void;
  className?: string;
}

export function CuratedCollections({
  selectedCategory,
  onTryOn,
  onBuy,
  className,
}: CuratedCollectionsProps) {
  // Filter collections based on selected category
  const filteredCollections = useMemo(() => {
    if (selectedCategory === 'all') {
      return CURATED_COLLECTIONS;
    }

    // Filter products within each collection by category
    return CURATED_COLLECTIONS.map((collection) => ({
      ...collection,
      products: filterProductsByCategory(collection.products, selectedCategory),
    })).filter((collection) => collection.products.length > 0);
  }, [selectedCategory]);

  if (filteredCollections.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <p className="text-sm">Không có sản phẩm trong danh mục này</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 py-3', className)}>
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4">
        Curated Collections
      </h3>
      {filteredCollections.map((collection) => (
        <CollectionRow
          key={collection.id}
          collection={collection}
          onTryOn={onTryOn}
          onBuy={onBuy}
        />
      ))}
    </div>
  );
}
