import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProSubscription } from './useProSubscription';

export interface UserQuota {
  daily_count: number;
  last_reset_date: string;
}

const DAILY_LIMIT = 3;

export function useUserQuota() {
  const { user } = useAuth();
  const { isPro } = useProSubscription();
  const queryClient = useQueryClient();

  // Fetch user's quota using raw SQL since RPC types may not be generated yet
  const { data: quota, isLoading, error, refetch } = useQuery({
    queryKey: ['user-quota', user?.id],
    queryFn: async (): Promise<UserQuota> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Call the RPC function using raw invoke
      const { data, error } = await supabase
        .rpc('get_user_quota' as any, { p_user_id: user.id });

      if (error) {
        // If function doesn't exist yet, return default
        if (error.code === '42883') {
          return { daily_count: 0, last_reset_date: new Date().toISOString().split('T')[0] };
        }
        throw error;
      }
      
      // Handle the response - it returns a single row
      const result = Array.isArray(data) ? data[0] : data;
      return {
        daily_count: result?.daily_count ?? 0,
        last_reset_date: result?.last_reset_date ?? new Date().toISOString().split('T')[0],
      };
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
  };
}
