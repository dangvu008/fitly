/**
 * RevenueCat Service
 * Handles in-app purchases for both iOS and Android
 * Manages subscriptions (Pro) and consumables (Gems)
 * 
 * PRICING STRATEGY (Updated):
 * - Standard try-on: 2 gems
 * - 4K try-on: 4 gems
 * - Pro Monthly: $9.99/month with 500 fast-pass try-ons
 * - Pro Yearly: $79.99/year with 800 fast-pass try-ons
 */

import { 
  GEM_PACKAGES, 
  SUBSCRIPTION_PLANS,
  type GemPackage,
  type SubscriptionPlan 
} from '@/lib/pricing';

// RevenueCat product identifiers
export const PRODUCT_IDS = {
  // Gem packages
  GEMS_50: 'gems_50',
  GEMS_150: 'gems_150',
  GEMS_500: 'gems_500',
  
  // Subscriptions - Updated pricing
  PRO_MONTHLY: 'pro_monthly',  // $9.99/month
  PRO_YEARLY: 'pro_yearly',    // $79.99/year
} as const;

// Entitlement identifiers
export const ENTITLEMENTS = {
  PRO: 'pro_access',
} as const;

export interface Product {
  identifier: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: number;
    priceString: string;
    period: string;
  };
}

export interface Package {
  identifier: string;
  product: Product;
  packageType: 'LIFETIME' | 'ANNUAL' | 'SIX_MONTH' | 'THREE_MONTH' | 'TWO_MONTH' | 'MONTHLY' | 'WEEKLY' | 'CUSTOM';
}

export interface Offering {
  identifier: string;
  serverDescription: string;
  availablePackages: Package[];
  lifetime?: Package;
  annual?: Package;
  sixMonth?: Package;
  threeMonth?: Package;
  twoMonth?: Package;
  monthly?: Package;
  weekly?: Package;
}

export interface CustomerInfo {
  entitlements: {
    active: Record<string, {
      identifier: string;
      isActive: boolean;
      willRenew: boolean;
      expirationDate: string | null;
      productIdentifier: string;
    }>;
    all: Record<string, any>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  originalAppUserId: string;
  managementURL: string | null;
}

export interface PurchaseResult {
  customerInfo: CustomerInfo;
  productIdentifier: string;
}

// Helper to convert GemPackage to RevenueCat Package
function gemPackageToRCPackage(pkg: GemPackage): Package {
  const totalGems = pkg.gems + (pkg.bonusGems || 0);
  return {
    identifier: pkg.productId,
    packageType: 'CUSTOM',
    product: {
      identifier: pkg.productId,
      title: `${pkg.gems} Gems${pkg.bonusGems ? ` + ${pkg.bonusGems} Bonus` : ''}`,
      description: pkg.isBestValue 
        ? `Get ${totalGems} gems for try-ons (Best Value!)`
        : `Get ${totalGems} gems for try-ons`,
      price: pkg.price,
      priceString: pkg.priceString,
      currencyCode: 'USD',
    },
  };
}

// Helper to convert SubscriptionPlan to RevenueCat Package
function subscriptionToRCPackage(plan: SubscriptionPlan): Package {
  return {
    identifier: plan.productId,
    packageType: plan.period === 'yearly' ? 'ANNUAL' : 'MONTHLY',
    product: {
      identifier: plan.productId,
      title: plan.name,
      description: `${plan.fastPassTryOns} fast-pass try-ons/tháng, ${plan.bonusGemsPerMonth} bonus gems`,
      price: plan.price,
      priceString: plan.priceString,
      currencyCode: 'USD',
      ...(plan.period === 'yearly' ? {
        introPrice: {
          price: 0,
          priceString: 'Free',
          period: '7 days',
        },
      } : {}),
    },
  };
}

class RevenueCatService {
  private initialized = false;
  private apiKey: string | null = null;
  private userId: string | null = null;
  private customerInfo: CustomerInfo | null = null;
  private offerings: Offering[] = [];

  /**
   * Initialize RevenueCat SDK
   * Should be called once when app starts
   */
  async initialize(apiKey: string): Promise<void> {
    if (this.initialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    this.apiKey = apiKey;
    
    // In a real implementation, this would initialize the native SDK
    // For web, we'll use the RevenueCat REST API or a web SDK
    console.log('RevenueCat initialized with API key');
    this.initialized = true;
  }

  /**
   * Identify user for RevenueCat
   * Links purchases to user account
   */
  async login(userId: string): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    this.userId = userId;
    
    // Fetch customer info from RevenueCat
    const customerInfo = await this.fetchCustomerInfo();
    this.customerInfo = customerInfo;
    
    return customerInfo;
  }

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    this.userId = null;
    this.customerInfo = null;
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    if (this.customerInfo) {
      return this.customerInfo;
    }

    return this.fetchCustomerInfo();
  }

  /**
   * Fetch customer info from RevenueCat API
   */
  private async fetchCustomerInfo(): Promise<CustomerInfo> {
    // Mock customer info for development
    // In production, this would call RevenueCat REST API
    return {
      entitlements: {
        active: {},
        all: {},
      },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
      latestExpirationDate: null,
      originalAppUserId: this.userId || 'anonymous',
      managementURL: null,
    };
  }

  /**
   * Get available offerings (products)
   * Uses pricing constants from @/lib/pricing
   */
  async getOfferings(): Promise<Offering[]> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    // Return cached offerings if available
    if (this.offerings.length > 0) {
      return this.offerings;
    }

    // Build offerings from pricing constants
    const gemPackages = GEM_PACKAGES.map(gemPackageToRCPackage);
    const subscriptionPackages = SUBSCRIPTION_PLANS.map(subscriptionToRCPackage);

    this.offerings = [
      {
        identifier: 'default',
        serverDescription: 'Default Offering',
        availablePackages: [...gemPackages, ...subscriptionPackages],
        monthly: subscriptionPackages.find(p => p.packageType === 'MONTHLY'),
        annual: subscriptionPackages.find(p => p.packageType === 'ANNUAL'),
      },
    ];

    return this.offerings;
  }

  /**
   * Purchase a product
   */
  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    console.log('Purchasing product:', productId);

    // In production, this would trigger native purchase flow
    // For web, we'd use Stripe or another payment processor
    
    // Simulate purchase delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock successful purchase
    const customerInfo = await this.fetchCustomerInfo();
    
    // Add the purchased product to customer info
    if (productId.startsWith('pro_')) {
      customerInfo.activeSubscriptions.push(productId);
      
      // Set expiration based on plan
      const isYearly = productId === 'pro_yearly';
      const expirationDays = isYearly ? 365 : 30;
      
      customerInfo.entitlements.active[ENTITLEMENTS.PRO] = {
        identifier: ENTITLEMENTS.PRO,
        isActive: true,
        willRenew: true,
        expirationDate: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
        productIdentifier: productId,
      };
    }
    
    customerInfo.allPurchasedProductIdentifiers.push(productId);
    this.customerInfo = customerInfo;

    return {
      customerInfo,
      productIdentifier: productId,
    };
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    console.log('Restoring purchases...');

    // Simulate restore delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch latest customer info
    const customerInfo = await this.fetchCustomerInfo();
    this.customerInfo = customerInfo;

    return customerInfo;
  }

  /**
   * Check if user has Pro entitlement
   */
  async hasProAccess(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENTS.PRO];
  }

  /**
   * Get Pro subscription expiration date
   */
  async getProExpirationDate(): Promise<Date | null> {
    const customerInfo = await this.getCustomerInfo();
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    
    if (proEntitlement?.expirationDate) {
      return new Date(proEntitlement.expirationDate);
    }
    
    return null;
  }

  /**
   * Get the current subscription plan details
   */
  getSubscriptionPlan(productId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(p => p.productId === productId);
  }

  /**
   * Get gem package details
   */
  getGemPackage(productId: string): GemPackage | undefined {
    return GEM_PACKAGES.find(p => p.productId === productId);
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();

// Re-export pricing types
export type { GemPackage, SubscriptionPlan } from '@/lib/pricing';
