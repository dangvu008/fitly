import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MAX_ADS_PER_DAY = 5;

interface AdState {
  adsWatchedToday: number;
  lastAdDate: string | null;
  canWatchAd: boolean;
  remainingAds: number;
}

export function useRewardedAds() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);

  // Get today's date string
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Fetch ad watch count for today
  const { data: adState, isLoading } = useQuery({
    queryKey: ['ad-watch-count', user?.id],
    queryFn: async (): Promise<AdState> => {
      if (!user?.id) {
        return {
          adsWatchedToday: 0,
          lastAdDate: null,
          canWatchAd: true,
          remainingAds: MAX_ADS_PER_DAY,
        };
      }

      const today = getTodayString();
      
      // Count ads watched today
      const { count, error } = await supabase
        .from('gem_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'ad_reward')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`);

      if (error) {
        console.error('Error fetching ad count:', error);
        return {
          adsWatchedToday: 0,
          lastAdDate: null,
          canWatchAd: true,
          remainingAds: MAX_ADS_PER_DAY,
        };
      }

      const adsWatchedToday = count || 0;
      const canWatchAd = adsWatchedToday < MAX_ADS_PER_DAY;
      const remainingAds = Math.max(0, MAX_ADS_PER_DAY - adsWatchedToday);

      return {
        adsWatchedToday,
        lastAdDate: today,
        canWatchAd,
        remainingAds,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  // Watch ad and earn gem mutation
  const watchAdMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!adState?.canWatchAd) throw new Error('Daily ad limit reached');

      // Simulate ad loading and playing
      // In real implementation, this would integrate with AdMob/Unity Ads SDK
      setIsAdLoading(true);
      
      // Simulate ad load time (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsAdLoading(false);
      setIsAdPlaying(true);
      
      // Simulate ad play time (5-15 seconds for rewarded video)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setIsAdPlaying(false);

      // Award gem after successful ad watch
      const { data, error } = await supabase.rpc('add_gems', {
        p_user_id: user.id,
        p_amount: 1,
        p_type: 'ad_reward',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ad-watch-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-gems', user?.id] });
      toast.success('🎉 +1 Gem earned!');
    },
    onError: (error: Error) => {
      setIsAdLoading(false);
      setIsAdPlaying(false);
      
      if (error.message === 'Daily ad limit reached') {
        toast.error('You\'ve reached the daily ad limit. Come back tomorrow!');
      } else {
        toast.error('Failed to load ad. Please try again.');
      }
    },
  });

  const watchAd = useCallback(async () => {
    if (!user) {
      toast.error('Please login to watch ads');
      return false;
    }

    if (!adState?.canWatchAd) {
      toast.error('Daily ad limit reached (5/day)');
      return false;
    }

    try {
      await watchAdMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [user, adState?.canWatchAd, watchAdMutation]);

  return {
    adState: adState || {
      adsWatchedToday: 0,
      lastAdDate: null,
      canWatchAd: true,
      remainingAds: MAX_ADS_PER_DAY,
    },
    isLoading,
    isAdLoading,
    isAdPlaying,
    watchAd,
    maxAdsPerDay: MAX_ADS_PER_DAY,
  };
}
