import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  revenueCatService, 
  CustomerInfo, 
  Offering, 
  Package,
  ENTITLEMENTS,
  PRODUCT_IDS 
} from '@/services/revenueCat';

interface UseRevenueCatReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  customerInfo: CustomerInfo | null;
  offerings: Offering[];
  
  // Pro status
  isPro: boolean;
  proExpirationDate: Date | null;
  
  // Actions
  purchase: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
  
  // Helpers
  getGemPackages: () => Package[];
  getSubscriptionPackages: () => Package[];
  getProductPrice: (productId: string) => string | null;
}

// RevenueCat API key from environment
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

export function useRevenueCat(): UseRevenueCatReturn {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (REVENUECAT_API_KEY) {
          await revenueCatService.initialize(REVENUECAT_API_KEY);
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize RevenueCat:', err);
        setError('Failed to initialize payment system');
      }
    };

    init();
  }, []);

  // Login user when authenticated
  useEffect(() => {
    const loginUser = async () => {
      if (!isInitialized) return;
      
      setIsLoading(true);
      try {
        if (user?.id) {
          const info = await revenueCatService.login(user.id);
          setCustomerInfo(info);
        } else {
          await revenueCatService.logout();
          setCustomerInfo(null);
        }
        
        // Fetch offerings
        const availableOfferings = await revenueCatService.getOfferings();
        setOfferings(availableOfferings);
        
        setError(null);
      } catch (err) {
        console.error('RevenueCat login error:', err);
        setError('Failed to load purchase options');
      } finally {
        setIsLoading(false);
      }
    };

    loginUser();
  }, [isInitialized, user?.id]);

  // Check Pro status
  const isPro = customerInfo?.entitlements.active[ENTITLEMENTS.PRO]?.isActive ?? false;
  
  const proExpirationDate = customerInfo?.entitlements.active[ENTITLEMENTS.PRO]?.expirationDate
    ? new Date(customerInfo.entitlements.active[ENTITLEMENTS.PRO].expirationDate)
    : null;

  // Purchase a product
  const purchase = useCallback(async (productId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await revenueCatService.purchase(productId);
      setCustomerInfo(result.customerInfo);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
      console.error('Purchase error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const info = await revenueCatService.restorePurchases();
      setCustomerInfo(info);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Restore failed';
      setError(errorMessage);
      console.error('Restore error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await revenueCatService.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error('Failed to refresh customer info:', err);
    }
  }, []);

  // Get gem packages
  const getGemPackages = useCallback((): Package[] => {
    const defaultOffering = offerings.find(o => o.identifier === 'default');
    if (!defaultOffering) return [];
    
    return defaultOffering.availablePackages.filter(
      pkg => pkg.product.identifier.startsWith('gems_')
    );
  }, [offerings]);

  // Get subscription packages
  const getSubscriptionPackages = useCallback((): Package[] => {
    const defaultOffering = offerings.find(o => o.identifier === 'default');
    if (!defaultOffering) return [];
    
    return defaultOffering.availablePackages.filter(
      pkg => pkg.product.identifier.startsWith('pro_')
    );
  }, [offerings]);

  // Get product price string
  const getProductPrice = useCallback((productId: string): string | null => {
    for (const offering of offerings) {
      const pkg = offering.availablePackages.find(
        p => p.product.identifier === productId
      );
      if (pkg) {
        return pkg.product.priceString;
      }
    }
    return null;
  }, [offerings]);

  return {
    isInitialized,
    isLoading,
    error,
    customerInfo,
    offerings,
    isPro,
    proExpirationDate,
    purchase,
    restorePurchases,
    refreshCustomerInfo,
    getGemPackages,
    getSubscriptionPackages,
    getProductPrice,
  };
}

// Re-export product IDs for convenience
export { PRODUCT_IDS, ENTITLEMENTS };
