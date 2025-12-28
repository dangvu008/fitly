import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserGems {
  balance: number;
  updated_at: string;
}

export interface GemTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'ad_reward' | 'spend' | 'bonus' | 'refund';
  description: string | null;
  created_at: string;
}

export function useUserGems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's gem balance
  const { data: gems, isLoading, error } = useQuery({
    queryKey: ['user-gems', user?.id],
    queryFn: async (): Promise<UserGems> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_gems')
        .select('balance, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no record exists, initialize with 0
        if (error.code === 'PGRST116') {
          return { balance: 0, updated_at: new Date().toISOString() };
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  // Spend gems mutation
  const spendGemsMutation = useMutation({
    mutationFn: async ({ amount, description, referenceId }: { 
      amount: number; 
      description?: string; 
      referenceId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('spend_gems', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description,
        p_reference_id: referenceId,
      });

      if (error) throw error;
      if (!data) throw new Error('Insufficient gems');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gems', user?.id] });
    },
  });

  // Add gems mutation (for purchases, ad rewards)
  const addGemsMutation = useMutation({
    mutationFn: async ({ amount, type, description, referenceId }: {
      amount: number;
      type: 'purchase' | 'ad_reward' | 'bonus' | 'refund';
      description?: string;
      referenceId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('add_gems', {
        p_user_id: user.id,
        p_amount: amount,
        p_type: type,
        p_description: description,
        p_reference_id: referenceId,
      });

      if (error) throw error;
      return data as number; // Returns new balance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gems', user?.id] });
    },
  });

  // Check if user has enough gems
  const hasEnoughGems = (amount: number): boolean => {
    return (gems?.balance ?? 0) >= amount;
  };

  return {
    balance: gems?.balance ?? 0,
    isLoading,
    error,
    spendGems: spendGemsMutation.mutateAsync,
    addGems: addGemsMutation.mutateAsync,
    isSpending: spendGemsMutation.isPending,
    isAdding: addGemsMutation.isPending,
    hasEnoughGems,
  };
}

// Hook for fetching gem transaction history
export function useGemTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gem-transactions', user?.id, limit],
    queryFn: async (): Promise<GemTransaction[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('gem_transactions')
        .select('id, amount, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as GemTransaction[];
    },
    enabled: !!user?.id,
  });
}
