# Design Document

## Overview

Trang Search & Shop được thiết kế để tối ưu doanh thu affiliate bằng cách kết hợp tìm kiếm sản phẩm, danh mục trực quan, và các bộ sưu tập được curate. Mỗi sản phẩm có hai CTA chính: "Try On" (thử đồ với AI) và "Buy" (mua qua affiliate link).

## Architecture

```
SearchShopPage
├── Header (reuse existing Header component)
├── SearchInput (new component)
├── VisualCategories (new component)
├── CuratedCollections (new component)
│   └── CollectionRow (new component)
│       └── ShopProductCard (new component)
└── SearchResults (conditional, when searching)
```

## Components and Interfaces

### SearchShopPage

Main page component that orchestrates all sections.

```typescript
interface SearchShopPageProps {
  // No props needed, uses hooks for state
}
```

### SearchInput

Search input with URL detection and keyword search.

```typescript
interface SearchInputProps {
  onSearch: (query: string) => void;
  onUrlDetected: (url: string) => void;
  isLoading: boolean;
  placeholder?: string;
}
```

### VisualCategories

Horizontal scrollable category buttons with icons.

```typescript
type ShopCategory = 'all' | 'dresses' | 'tops' | 'pants' | 'outerwear' | 'shoes' | 'accessories';

interface VisualCategoriesProps {
  selectedCategory: ShopCategory;
  onCategoryChange: (category: ShopCategory) => void;
}

const CATEGORY_CONFIG: Record<ShopCategory, { icon: string; label: string }> = {
  all: { icon: '✨', label: 'All' },
  dresses: { icon: '👗', label: 'Dresses' },
  tops: { icon: '👔', label: 'Tops' },
  pants: { icon: '👖', label: 'Pants' },
  outerwear: { icon: '🧥', label: 'Outerwear' },
  shoes: { icon: '👟', label: 'Shoes' },
  accessories: { icon: '👜', label: 'Accessories' },
};
```

### CuratedCollection

A single curated collection with title and products.

```typescript
interface CuratedCollection {
  id: string;
  title: string;
  subtitle?: string;
  products: ShopProduct[];
  source: 'amazon' | 'shopee' | 'lazada' | 'mixed';
}

interface CollectionRowProps {
  collection: CuratedCollection;
  onTryOn: (product: ShopProduct) => void;
  onBuy: (product: ShopProduct) => void;
}
```

### ShopProductCard

Product card with Try On and Buy buttons.

```typescript
interface ShopProduct {
  id: string;
  name: string;
  brand?: string;
  imageUrl: string;
  price: number;
  currency: string;
  affiliateUrl: string;
  platform: 'amazon' | 'shopee' | 'lazada' | 'zalora' | 'other';
  category: ShopCategory;
}

interface ShopProductCardProps {
  product: ShopProduct;
  onTryOn: () => void;
  onBuy: () => void;
  compact?: boolean; // For horizontal scroll view
}
```

## Data Models

### Curated Collections Data

Static data for MVP, can be moved to database later.

```typescript
const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    id: 'date-night',
    title: 'Top 10 Date Night Outfits',
    subtitle: 'from Amazon',
    source: 'amazon',
    products: [...],
  },
  {
    id: 'office-essentials',
    title: 'Office Essentials',
    subtitle: 'Professional looks',
    source: 'amazon',
    products: [...],
  },
  {
    id: 'summer-vibes',
    title: 'Summer Vibes 2024',
    subtitle: 'Trending on Shopee',
    source: 'shopee',
    products: [...],
  },
];
```

### Affiliate Click Tracking

```typescript
interface AffiliateClick {
  id: string;
  product_id: string;
  user_id?: string;
  source: 'search' | 'collection' | 'visual_search';
  collection_id?: string;
  clicked_at: string;
  affiliate_url: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Category Filter Correctness

*For any* selected category (except 'all'), all displayed products SHALL have a category matching the selected category.

**Validates: Requirements 3.3**

### Property 2: Affiliate URL Tracking

*For any* "Buy" button click, the system SHALL record a click event before opening the affiliate URL.

**Validates: Requirements 6.1**

### Property 3: Price Display Format

*For any* product with price and currency, the displayed price SHALL be formatted according to the currency locale (e.g., "$25.00" for USD, "250.000₫" for VND).

**Validates: Requirements 5.4**

## Error Handling

1. **Search Errors**: Display friendly message "Không tìm thấy sản phẩm. Thử từ khóa khác?" with retry option
2. **Image Load Errors**: Show placeholder image with product name
3. **Affiliate Link Errors**: Log error, still attempt to open URL
4. **Network Errors**: Show cached collections if available, indicate offline status

## Testing Strategy

### Unit Tests
- Test category filtering logic
- Test price formatting for different currencies
- Test URL detection in search input

### Property-Based Tests
- Property 1: Category filter correctness
- Property 2: Affiliate tracking completeness
- Property 3: Price format consistency

### Integration Tests
- Test search flow end-to-end
- Test try-on navigation from product card
- Test affiliate click tracking

