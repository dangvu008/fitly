/**
 * Curated Collections for Search & Shop page
 * Sample data for MVP - can be moved to database later
 * Requirements: 4.1, 4.2, 4.3
 */

import { CuratedCollection, ShopProduct } from '@/types/shop';

// Date Night Collection - Amazon
const dateNightProducts: ShopProduct[] = [
  {
    id: 'dn-1',
    name: 'Elegant Black Midi Dress',
    brand: 'Amazon Essentials',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    price: 45.99,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09EXAMPLE1?tag=vton-20',
    platform: 'amazon',
    category: 'dresses',
  },
  {
    id: 'dn-2',
    name: 'Slim Fit Blazer',
    brand: 'Calvin Klein',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
    price: 89.99,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09EXAMPLE2?tag=vton-20',
    platform: 'amazon',
    category: 'outerwear',
  },
  {
    id: 'dn-3',
    name: 'Classic White Blouse',
    brand: 'Levi\'s',
    imageUrl: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=400',
    price: 35.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09EXAMPLE3?tag=vton-20',
    platform: 'amazon',
    category: 'tops',
  },
  {
    id: 'dn-4',
    name: 'High Waist Trousers',
    brand: 'Theory',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
    price: 65.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09EXAMPLE4?tag=vton-20',
    platform: 'amazon',
    category: 'pants',
  },
  {
    id: 'dn-5',
    name: 'Strappy Heels',
    brand: 'Steve Madden',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    price: 79.99,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09EXAMPLE5?tag=vton-20',
    platform: 'amazon',
    category: 'shoes',
  },
];

// Office Essentials Collection - Amazon
const officeProducts: ShopProduct[] = [
  {
    id: 'of-1',
    name: 'Professional Pencil Skirt',
    brand: 'Anne Klein',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400',
    price: 55.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09OFFICE1?tag=vton-20',
    platform: 'amazon',
    category: 'dresses',
  },
  {
    id: 'of-2',
    name: 'Button-Down Oxford Shirt',
    brand: 'Brooks Brothers',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
    price: 42.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09OFFICE2?tag=vton-20',
    platform: 'amazon',
    category: 'tops',
  },
  {
    id: 'of-3',
    name: 'Tailored Wool Pants',
    brand: 'Banana Republic',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
    price: 78.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09OFFICE3?tag=vton-20',
    platform: 'amazon',
    category: 'pants',
  },
  {
    id: 'of-4',
    name: 'Classic Trench Coat',
    brand: 'London Fog',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    price: 120.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09OFFICE4?tag=vton-20',
    platform: 'amazon',
    category: 'outerwear',
  },
];

// Summer Vibes Collection - Shopee
const summerProducts: ShopProduct[] = [
  {
    id: 'sm-1',
    name: 'Floral Maxi Dress',
    brand: 'Local Brand',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
    price: 299000,
    currency: 'VND',
    affiliateUrl: 'https://shopee.vn/product/summer1',
    platform: 'shopee',
    category: 'dresses',
  },
  {
    id: 'sm-2',
    name: 'Crop Top Linen',
    brand: 'Shopee Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400',
    price: 159000,
    currency: 'VND',
    affiliateUrl: 'https://shopee.vn/product/summer2',
    platform: 'shopee',
    category: 'tops',
  },
  {
    id: 'sm-3',
    name: 'Denim Shorts',
    brand: 'Shopee Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400',
    price: 189000,
    currency: 'VND',
    affiliateUrl: 'https://shopee.vn/product/summer3',
    platform: 'shopee',
    category: 'pants',
  },
  {
    id: 'sm-4',
    name: 'Straw Beach Hat',
    brand: 'Accessories VN',
    imageUrl: 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=400',
    price: 99000,
    currency: 'VND',
    affiliateUrl: 'https://shopee.vn/product/summer4',
    platform: 'shopee',
    category: 'accessories',
  },
  {
    id: 'sm-5',
    name: 'Sandals Flat',
    brand: 'Shoes VN',
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
    price: 249000,
    currency: 'VND',
    affiliateUrl: 'https://shopee.vn/product/summer5',
    platform: 'shopee',
    category: 'shoes',
  },
];

// Streetwear Collection - Mixed
const streetwearProducts: ShopProduct[] = [
  {
    id: 'st-1',
    name: 'Oversized Hoodie',
    brand: 'Champion',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    price: 55.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09STREET1?tag=vton-20',
    platform: 'amazon',
    category: 'outerwear',
  },
  {
    id: 'st-2',
    name: 'Cargo Pants',
    brand: 'Dickies',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
    price: 45.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09STREET2?tag=vton-20',
    platform: 'amazon',
    category: 'pants',
  },
  {
    id: 'st-3',
    name: 'Graphic Tee',
    brand: 'Urban Style',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    price: 25.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09STREET3?tag=vton-20',
    platform: 'amazon',
    category: 'tops',
  },
  {
    id: 'st-4',
    name: 'Sneakers White',
    brand: 'Nike',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    price: 110.00,
    currency: 'USD',
    affiliateUrl: 'https://amazon.com/dp/B09STREET4?tag=vton-20',
    platform: 'amazon',
    category: 'shoes',
  },
];

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    id: 'date-night',
    title: 'Top 10 Date Night Outfits',
    subtitle: 'from Amazon',
    source: 'amazon',
    products: dateNightProducts,
  },
  {
    id: 'office-essentials',
    title: 'Office Essentials',
    subtitle: 'Professional looks',
    source: 'amazon',
    products: officeProducts,
  },
  {
    id: 'summer-vibes',
    title: 'Summer Vibes 2024',
    subtitle: 'Trending on Shopee',
    source: 'shopee',
    products: summerProducts,
  },
  {
    id: 'streetwear',
    title: 'Streetwear Picks',
    subtitle: 'Urban style',
    source: 'mixed',
    products: streetwearProducts,
  },
];

// Get all products from all collections
export function getAllShopProducts(): ShopProduct[] {
  return CURATED_COLLECTIONS.flatMap(collection => collection.products);
}

// Filter products by category
export function filterProductsByCategory(
  products: ShopProduct[],
  category: string
): ShopProduct[] {
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
}
