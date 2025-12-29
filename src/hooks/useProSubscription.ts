import { useState, useCallback } from 'react';
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

/**
 * Stub implementation for Pro subscription functionality.
 * Database tables (user_subscriptions) need to be created for full functionality.
 */
export function useProSubscription() {
  const { user } = useAuth();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Stub: Always returns no subscription (feature not yet enabled)
  const subscription: UserSubscription | null = null;
  const isPro = false;
  const isLoading = false;
  const error = null;
  const daysRemaining = 0;

  // Stub subscribe function
  const subscribe = useCallback(async ({ plan, platform }: {
    plan: 'pro_weekly' | 'pro_monthly' | 'pro_yearly';
    platform: 'ios' | 'android' | 'web' | 'stripe';
  }) => {
    if (!user?.id) throw new Error('User not authenticated');
    setIsSubscribing(true);
    
    // TODO: Implement when user_subscriptions table is created
    console.log('Pro subscription not yet implemented', { plan, platform });
    
    setIsSubscribing(false);
    throw new Error('Pro subscription feature coming soon');
  }, [user?.id]);

  // Stub cancel function
  const cancel = useCallback(async () => {
    if (!user?.id) throw new Error('No active subscription');
    setIsCancelling(true);
    
    // TODO: Implement when user_subscriptions table is created
    console.log('Cancel subscription not yet implemented');
    
    setIsCancelling(false);
    throw new Error('Cancel subscription feature coming soon');
  }, [user?.id]);

  return {
    subscription,
    isPro,
    isLoading,
    error,
    daysRemaining,
    subscribe,
    cancel,
    isSubscribing,
    isCancelling,
  };
}
