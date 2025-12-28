import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSubscription {
  id: string;
  plan: 'pro_weekly' | 'pro_monthly' | 'pro_yearly';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  platform: 'ios' | 'android' | 'web' | 'stripe' | null;
  starts_at: string;
  expires_at: string;
  cancelled_at: string | null;
}

export function useProSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's subscription status
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No subscription found
        throw error;
      }

      return data as UserSubscription;
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Check if user is Pro using RPC function
  const { data: isPro = false } = useQuery({
    queryKey: ['is-user-pro', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc('is_user_pro', {
        p_user_id: user.id,
      });

      if (error) return false;
      return data ?? false;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async ({ plan, platform }: {
      plan: 'pro_weekly' | 'pro_monthly' | 'pro_yearly';
      platform: 'ios' | 'android' | 'web' | 'stripe';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Calculate expiration based on plan
      const now = new Date();
      let expiresAt: Date;
      switch (plan) {
        case 'pro_weekly':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'pro_monthly':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'pro_yearly':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan,
          status: 'active',
          platform,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'user_id,plan',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-user-pro', user?.id] });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !subscription?.id) throw new Error('No active subscription');

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-user-pro', user?.id] });
    },
  });

  // Calculate days remaining
  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    subscription,
    isPro,
    isLoading,
    error,
    daysRemaining,
    subscribe: subscribeMutation.mutateAsync,
    cancel: cancelMutation.mutateAsync,
    isSubscribing: subscribeMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
