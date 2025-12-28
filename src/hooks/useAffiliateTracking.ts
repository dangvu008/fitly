/**
 * useAffiliateTracking - Hook for tracking affiliate clicks
 * Requirements: 6.1, 6.2, 6.3
 */

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AffiliateClick } from '@/types/shop';

// Storage key for local tracking (MVP)
const AFFILIATE_CLICKS_KEY = 'affiliate_clicks';

// Get stored clicks from localStorage
function getStoredClicks(): AffiliateClick[] {
  try {
    const stored = localStorage.getItem(AFFILIATE_CLICKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save clicks to localStorage
function saveClicks(clicks: AffiliateClick[]): void {
  try {
    // Keep only last 100 clicks
    const trimmed = clicks.slice(-100);
    localStorage.setItem(AFFILIATE_CLICKS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save affiliate clicks:', e);
  }
}

export type AffiliateSource = 'search' | 'collection' | 'visual_search' | 'category';

interface TrackClickParams {
  productId: string;
  affiliateUrl: string;
  source: AffiliateSource;
  collectionId?: string;
}

export function useAffiliateTracking() {
  const { user } = useAuth();

  /**
   * Track an affiliate click
   * Requirements: 6.1, 6.2
   */
  const trackClick = useCallback(
    async ({ productId, affiliateUrl, source, collectionId }: TrackClickParams) => {
      const click: AffiliateClick = {
        id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product_id: productId,
        user_id: user?.id,
        source,
        collection_id: collectionId,
        clicked_at: new Date().toISOString(),
        affiliate_url: affiliateUrl,
      };

      // Log for debugging
      console.log('Affiliate click tracked:', click);

      // Save to localStorage (MVP)
      const clicks = getStoredClicks();
      clicks.push(click);
      saveClicks(clicks);

      // TODO: In production, send to Supabase
      // await supabase.from('affiliate_clicks').insert([click]);

      return click;
    },
    [user?.id]
  );

  /**
   * Track click and open affiliate URL
   * Combines tracking with navigation
   */
  const trackAndOpen = useCallback(
    async (params: TrackClickParams) => {
      // Track first
      await trackClick(params);

      // Then open URL
      window.open(params.affiliateUrl, '_blank', 'noopener,noreferrer');
    },
    [trackClick]
  );

  /**
   * Get click statistics (for analytics)
   */
  const getClickStats = useCallback(() => {
    const clicks = getStoredClicks();
    
    // Group by source
    const bySource = clicks.reduce((acc, click) => {
      acc[click.source] = (acc[click.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by product
    const byProduct = clicks.reduce((acc, click) => {
      acc[click.product_id] = (acc[click.product_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: clicks.length,
      bySource,
      byProduct,
      recentClicks: clicks.slice(-10),
    };
  }, []);

  /**
   * Clear all stored clicks (for testing)
   */
  const clearClicks = useCallback(() => {
    localStorage.removeItem(AFFILIATE_CLICKS_KEY);
  }, []);

  return {
    trackClick,
    trackAndOpen,
    getClickStats,
    clearClicks,
  };
}
