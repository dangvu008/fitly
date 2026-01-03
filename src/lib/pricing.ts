/**
 * Pricing & Monetization Constants
 * 
 * CHIẾN LƯỢC ĐỊNH GIÁ - DỰA TRÊN PHÂN TÍCH CHI PHÍ:
 * 
 * Chi phí thực tế cho mỗi lần thử đồ:
 * - AI API call (Gemini Flash): ~$0.005-0.01/lần
 * - Storage (ảnh kết quả): ~$0.0002/ảnh
 * - Edge functions: ~$0.0001/call
 * - Tổng chi phí: ~$0.01-0.015/lần thử
 * 
 * Định giá gems:
 * - Gói 50 gems = $0.99 → $0.0198/gem
 * - Gói 150 gems = $2.99 → $0.0199/gem (best value)
 * - Gói 500 gems = $7.99 → $0.016/gem
 * 
 * Chi phí mỗi lần thử với giá gems mới:
 * - Thử thường (2 gems): $0.032 - margin 220%
 * - Thử 4K (4 gems): $0.064 - margin 326% (cover higher AI cost)
 * 
 * Gói Pro ($9.99/tháng):
 * - 500 Fast-Pass try-ons/tháng
 * - Chi phí tối đa: 500 × $0.015 = $7.50
 * - Margin: 33%
 * - Sau 500 lượt: chuyển sang hàng đợi ưu tiên thấp
 */

// ============== GEM COSTS ==============

/** Cost in gems for standard quality try-on */
export const TRY_ON_COST_STANDARD = 2;

/** Cost in gems for 4K/HD quality try-on */
export const TRY_ON_COST_4K = 4;

/** Cost in gems for outfit try-on from feed */
export const TRY_OUTFIT_COST = 2;

/** Gems rewarded for watching an ad */
export const AD_REWARD_GEMS = 1;

/** Maximum ads user can watch per day */
export const MAX_ADS_PER_DAY = 5;

// ============== GEM PACKAGES ==============

export interface GemPackage {
  id: string;
  productId: string;
  gems: number;
  price: number;
  priceString: string;
  pricePerGem: number;
  isBestValue?: boolean;
  bonusGems?: number;
  stripePriceId?: string;
}

export const GEM_PACKAGES: GemPackage[] = [
  {
    id: 'starter',
    productId: 'gems_50',
    gems: 50,
    price: 0.99,
    priceString: '$0.99',
    pricePerGem: 0.0198,
  },
  {
    id: 'popular',
    productId: 'gems_150',
    gems: 150,
    bonusGems: 15, // 10% bonus
    price: 2.99,
    priceString: '$2.99',
    pricePerGem: 0.0181, // After bonus
    isBestValue: true,
  },
  {
    id: 'value',
    productId: 'gems_500',
    gems: 500,
    bonusGems: 100, // 20% bonus
    price: 7.99,
    priceString: '$7.99',
    pricePerGem: 0.0133, // After bonus
  },
];

// ============== SUBSCRIPTION PLANS ==============

export interface SubscriptionPlan {
  id: string;
  productId: string;
  name: string;
  price: number;
  priceString: string;
  period: 'monthly' | 'yearly';
  monthlyPrice?: number;
  features: string[];
  fastPassTryOns: number;
  bonusGemsPerMonth: number;
  stripePriceId?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro_monthly',
    productId: 'pro_monthly',
    name: 'Pro Monthly',
    price: 9.99,
    priceString: '$9.99/month',
    period: 'monthly',
    fastPassTryOns: 500, // 500 fast-pass try-ons per month
    bonusGemsPerMonth: 100, // 100 bonus gems per month
    features: [
      '500 Fast-Pass try-ons/tháng',
      '100 bonus gems mỗi tháng',
      'Ưu tiên xử lý cao',
      'Không quảng cáo',
      'Xuất ảnh 4K miễn phí',
      'Hỗ trợ ưu tiên',
    ],
  },
  {
    id: 'pro_yearly',
    productId: 'pro_yearly',
    name: 'Pro Yearly',
    price: 79.99,
    priceString: '$79.99/year',
    period: 'yearly',
    monthlyPrice: 6.67, // $79.99 / 12 = ~$6.67
    fastPassTryOns: 800, // 800 fast-pass try-ons per month (higher limit)
    bonusGemsPerMonth: 200, // 200 bonus gems per month
    features: [
      '800 Fast-Pass try-ons/tháng',
      '200 bonus gems mỗi tháng',
      'Ưu tiên xử lý cao nhất',
      'Không quảng cáo',
      'Xuất ảnh 4K miễn phí',
      'Hỗ trợ VIP 24/7',
      'Tiết kiệm 33%',
      '7 ngày dùng thử miễn phí',
    ],
  },
];

// ============== PRO LIMITS ==============

/** Monthly fast-pass limit for Pro Monthly users */
export const PRO_MONTHLY_FAST_PASS_LIMIT = 500;

/** Monthly fast-pass limit for Pro Yearly users */
export const PRO_YEARLY_FAST_PASS_LIMIT = 800;

/** When Pro user exceeds limit, they go to low priority queue */
export const PRO_EXCEEDED_QUEUE_PRIORITY = 'low';

// ============== PRICING HELPERS ==============

/**
 * Calculate gems needed for a try-on based on quality
 */
export function getTryOnCost(quality: 'standard' | '4k' = 'standard'): number {
  return quality === '4k' ? TRY_ON_COST_4K : TRY_ON_COST_STANDARD;
}

/**
 * Calculate total gems including any bonus
 */
export function getTotalGems(pkg: GemPackage): number {
  return pkg.gems + (pkg.bonusGems || 0);
}

/**
 * Get the best value package
 */
export function getBestValuePackage(): GemPackage | undefined {
  return GEM_PACKAGES.find(pkg => pkg.isBestValue);
}

/**
 * Calculate how many try-ons user can do with gems
 */
export function calculateTryOns(gems: number, quality: 'standard' | '4k' = 'standard'): number {
  const cost = getTryOnCost(quality);
  return Math.floor(gems / cost);
}

/**
 * Format gem amount for display
 */
export function formatGems(amount: number): string {
  return `${amount}💎`;
}

// ============== REVENUE PROJECTIONS ==============

/**
 * Dự báo doanh thu cho mô hình này:
 * 
 * Giả định:
 * - 10,000 MAU (Monthly Active Users)
 * - 5% conversion to paid (500 users)
 * - 20% Pro, 80% gems-only
 * 
 * Doanh thu:
 * - Pro users: 100 × $9.99 = $999/month
 * - Gem purchases: 400 × $2.99 avg = $1,196/month
 * - Total: ~$2,195/month
 * 
 * Chi phí:
 * - Pro users: 100 × 500 × $0.015 = $750/month (max)
 * - Gem users: 400 × 25 try-ons × $0.015 = $150/month
 * - Lovable Cloud: ~$50/month
 * - Total: ~$950/month
 * 
 * Margin: ~57%
 */
