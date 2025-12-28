/**
 * Shop types for Search & Shop page (Affiliate Monetization)
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

export type ShopCategory = 
  | 'all' 
  | 'dresses' 
  | 'tops' 
  | 'pants' 
  | 'outerwear' 
  | 'shoes' 
  | 'accessories';

export type ShopPlatform = 'amazon' | 'shopee' | 'lazada' | 'zalora' | 'other';

export interface ShopProduct {
  id: string;
  name: string;
  brand?: string;
  imageUrl: string;
  price: number;
  currency: string;
  affiliateUrl: string;
  platform: ShopPlatform;
  category: ShopCategory;
}

export interface CuratedCollection {
  id: string;
  title: string;
  subtitle?: string;
  products: ShopProduct[];
  source: ShopPlatform | 'mixed';
}

export interface AffiliateClick {
  id: string;
  product_id: string;
  user_id?: string;
  source: 'search' | 'collection' | 'visual_search' | 'category';
  collection_id?: string;
  clicked_at: string;
  affiliate_url: string;
}

// Category configuration with icons and labels
export const SHOP_CATEGORY_CONFIG: Record<ShopCategory, { icon: string; label: string; labelVi: string }> = {
  all: { icon: '✨', label: 'All', labelVi: 'Tất cả' },
  dresses: { icon: '👗', label: 'Dresses', labelVi: 'Váy' },
  tops: { icon: '👔', label: 'Tops', labelVi: 'Áo' },
  pants: { icon: '👖', label: 'Pants', labelVi: 'Quần' },
  outerwear: { icon: '🧥', label: 'Outerwear', labelVi: 'Áo khoác' },
  shoes: { icon: '👟', label: 'Shoes', labelVi: 'Giày' },
  accessories: { icon: '👜', label: 'Accessories', labelVi: 'Phụ kiện' },
};

// Platform colors for badges
export const PLATFORM_COLORS: Record<ShopPlatform, string> = {
  amazon: 'bg-orange-500',
  shopee: 'bg-orange-600',
  lazada: 'bg-purple-600',
  zalora: 'bg-black',
  other: 'bg-gray-600',
};

export const PLATFORM_NAMES: Record<ShopPlatform, string> = {
  amazon: 'Amazon',
  shopee: 'Shopee',
  lazada: 'Lazada',
  zalora: 'Zalora',
  other: 'Shop',
};

/**
 * Format price based on currency
 * Requirements: 5.4
 */
export function formatShopPrice(price: number, currency: string): string {
  if (currency === 'VND' || currency === '₫') {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  }
  if (currency === 'USD' || currency === '$') {
    return '$' + price.toFixed(2);
  }
  return `${currency} ${price}`;
}
