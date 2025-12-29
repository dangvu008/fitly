import { useState, useCallback } from 'react';
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

/**
 * Stub implementation for user gems functionality.
 * Database tables (user_gems, gem_transactions) need to be created for full functionality.
 */
export function useUserGems() {
  const { user } = useAuth();
  const [isSpending, setIsSpending] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Stub: Always returns 0 balance
  const balance = 0;
  const isLoading = false;
  const error = null;

  // Stub spend gems function
  const spendGems = useCallback(async ({ amount, description, referenceId }: { 
    amount: number; 
    description?: string; 
    referenceId?: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');
    setIsSpending(true);
    
    // TODO: Implement when user_gems table is created
    console.log('Spend gems not yet implemented', { amount, description, referenceId });
    
    setIsSpending(false);
    throw new Error('Gems feature coming soon');
  }, [user?.id]);

  // Stub add gems function
  const addGems = useCallback(async ({ amount, type, description, referenceId }: {
    amount: number;
    type: 'purchase' | 'ad_reward' | 'bonus' | 'refund';
    description?: string;
    referenceId?: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');
    setIsAdding(true);
    
    // TODO: Implement when user_gems table is created
    console.log('Add gems not yet implemented', { amount, type, description, referenceId });
    
    setIsAdding(false);
    return 0;
  }, [user?.id]);

  // Check if user has enough gems
  const hasEnoughGems = (amount: number): boolean => {
    return balance >= amount;
  };

  return {
    balance,
    isLoading,
    error,
    spendGems,
    addGems,
    isSpending,
    isAdding,
    hasEnoughGems,
  };
}

/**
 * Stub hook for fetching gem transaction history
 */
export function useGemTransactions(limit = 20) {
  const { user } = useAuth();

  // Stub: Always returns empty array
  return {
    data: [] as GemTransaction[],
    isLoading: false,
    error: null,
  };
}
