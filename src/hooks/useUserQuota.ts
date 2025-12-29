import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProSubscription } from './useProSubscription';

export interface UserQuota {
  daily_count: number;
  last_reset_date: string;
}

const DAILY_LIMIT = 3;

/**
 * Hook for managing user's daily try-on quota.
 * Uses local storage for now; can be upgraded to database when needed.
 */
export function useUserQuota() {
  const { user } = useAuth();
  const { isPro } = useProSubscription();
  const queryClient = useQueryClient();

  // Get today's date string
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Fetch user's quota from localStorage
  const { data: quota, isLoading, error, refetch } = useQuery({
    queryKey: ['user-quota', user?.id],
    queryFn: async (): Promise<UserQuota> => {
      if (!user?.id) {
        return { daily_count: 0, last_reset_date: getTodayString() };
      }

      // Use localStorage for quota tracking
      const storageKey = `quota_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const today = getTodayString();
          
          // Reset if it's a new day
          if (parsed.last_reset_date !== today) {
            const newQuota = { daily_count: 0, last_reset_date: today };
            localStorage.setItem(storageKey, JSON.stringify(newQuota));
            return newQuota;
          }
          
          return parsed;
        } catch {
          // Invalid stored data, reset
        }
      }
      
      const defaultQuota = { daily_count: 0, last_reset_date: getTodayString() };
      localStorage.setItem(storageKey, JSON.stringify(defaultQuota));
      return defaultQuota;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  // Calculate remaining tries
  const dailyCount = quota?.daily_count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - dailyCount);
  
  // Pro users have unlimited
  const hasQuotaRemaining = isPro || remaining > 0;
  const isUnlimited = isPro;

  // Refresh quota after a try-on
  const refreshQuota = () => {
    queryClient.invalidateQueries({ queryKey: ['user-quota', user?.id] });
  };

  // Increment quota (call after successful try-on)
  const incrementQuota = () => {
    if (!user?.id) return;
    
    const storageKey = `quota_${user.id}`;
    const today = getTodayString();
    const currentQuota = quota ?? { daily_count: 0, last_reset_date: today };
    
    const newQuota = {
      daily_count: currentQuota.daily_count + 1,
      last_reset_date: today,
    };
    
    localStorage.setItem(storageKey, JSON.stringify(newQuota));
    refreshQuota();
  };

  return {
    dailyCount,
    remaining,
    dailyLimit: DAILY_LIMIT,
    hasQuotaRemaining,
    isUnlimited,
    isLoading,
    error,
    refetch,
    refreshQuota,
    incrementQuota,
  };
}
