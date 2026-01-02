import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Supported shopping platforms for clipboard detection
 */
export const SUPPORTED_PLATFORMS = {
  shopee: {
    name: 'Shopee',
    patterns: [
      /shopee\.vn/i,
      /shopee\.co\.th/i,
      /shopee\.sg/i,
      /shopee\.com\.my/i,
      /shopee\.co\.id/i,
    ],
    icon: '🛒',
  },
  lazada: {
    name: 'Lazada',
    patterns: [
      /lazada\.vn/i,
      /lazada\.co\.th/i,
      /lazada\.sg/i,
      /lazada\.com\.my/i,
      /lazada\.co\.id/i,
    ],
    icon: '🛍️',
  },
  tiktok: {
    name: 'TikTok Shop',
    patterns: [
      /tiktok\.com.*\/product/i,
      /tiktokshop\.com/i,
    ],
    icon: '🎵',
  },
  zara: {
    name: 'Zara',
    patterns: [/zara\.com/i],
    icon: '👗',
  },
  amazon: {
    name: 'Amazon',
    patterns: [
      /amazon\.com/i,
      /amazon\.vn/i,
      /amazon\.co\.jp/i,
      /amzn\.to/i,
    ],
    icon: '📦',
  },
  hm: {
    name: 'H&M',
    patterns: [/hm\.com/i, /www2\.hm\.com/i],
    icon: '👔',
  },
  uniqlo: {
    name: 'Uniqlo',
    patterns: [/uniqlo\.com/i],
    icon: '🧥',
  },
} as const;

export type SupportedPlatform = keyof typeof SUPPORTED_PLATFORMS;

export interface DetectedLink {
  url: string;
  platform: SupportedPlatform;
  platformName: string;
  platformIcon: string;
  detectedAt: number;
}

const PROCESSED_LINKS_KEY = 'smart_paste_processed_links';
const CLIPBOARD_ENABLED_KEY = 'smart_paste_clipboard_enabled';
const MAX_PROCESSED_LINKS = 50;

/**
 * Check if a URL is a valid shopping link from supported platforms
 */
export function detectShoppingPlatform(url: string): { platform: SupportedPlatform; name: string; icon: string } | null {
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return null;
  }

  for (const [key, config] of Object.entries(SUPPORTED_PLATFORMS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(url)) {
        return {
          platform: key as SupportedPlatform,
          name: config.name,
          icon: config.icon,
        };
      }
    }
  }

  return null;
}

/**
 * Get processed links from localStorage
 */
function getProcessedLinks(): string[] {
  try {
    const stored = localStorage.getItem(PROCESSED_LINKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save processed link to localStorage
 */
function saveProcessedLink(url: string): void {
  try {
    const links = getProcessedLinks();
    if (!links.includes(url)) {
      links.unshift(url);
      // Keep only recent links
      const trimmed = links.slice(0, MAX_PROCESSED_LINKS);
      localStorage.setItem(PROCESSED_LINKS_KEY, JSON.stringify(trimmed));
    }
  } catch (e) {
    console.warn('[useClipboardDetection] Could not save processed link:', e);
  }
}

/**
 * Check if clipboard detection is enabled
 */
function isClipboardEnabled(): boolean {
  try {
    const stored = localStorage.getItem(CLIPBOARD_ENABLED_KEY);
    return stored !== 'false'; // Default to enabled
  } catch {
    return true;
  }
}

/**
 * Hook for detecting shopping links in clipboard
 * 
 * @requirements REQ-1.1, REQ-1.2, REQ-1.5, REQ-13.1
 */
export function useClipboardDetection() {
  const [detectedLink, setDetectedLink] = useState<DetectedLink | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(isClipboardEnabled);
  const [error, setError] = useState<Error | null>(null);
  const lastCheckedRef = useRef<string | null>(null);

  /**
   * Check clipboard for shopping links
   */
  const checkClipboard = useCallback(async (): Promise<DetectedLink | null> => {
    if (!isEnabled) {
      return null;
    }

    // Check if Clipboard API is available
    if (!navigator.clipboard?.readText) {
      console.warn('[useClipboardDetection] Clipboard API not available');
      return null;
    }

    setIsChecking(true);
    setError(null);

    try {
      const text = await navigator.clipboard.readText();
      
      // Skip if same as last checked
      if (text === lastCheckedRef.current) {
        setIsChecking(false);
        return null;
      }
      lastCheckedRef.current = text;

      // Skip if empty or too long (not a URL)
      if (!text || text.length > 2000) {
        setIsChecking(false);
        return null;
      }

      // Try to extract URL from text
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : text.trim();

      // Check if it's a shopping link
      const platformInfo = detectShoppingPlatform(url);
      if (!platformInfo) {
        setIsChecking(false);
        return null;
      }

      // Check if already processed
      const processedLinks = getProcessedLinks();
      if (processedLinks.includes(url)) {
        setIsChecking(false);
        return null;
      }

      const detected: DetectedLink = {
        url,
        platform: platformInfo.platform,
        platformName: platformInfo.name,
        platformIcon: platformInfo.icon,
        detectedAt: Date.now(),
      };

      setDetectedLink(detected);
      setIsChecking(false);
      return detected;
    } catch (err) {
      // Permission denied or other error
      console.warn('[useClipboardDetection] Could not read clipboard:', err);
      setError(err instanceof Error ? err : new Error('Could not read clipboard'));
      setIsChecking(false);
      return null;
    }
  }, [isEnabled]);

  /**
   * Dismiss detected link and mark as processed
   */
  const dismissLink = useCallback(() => {
    if (detectedLink) {
      saveProcessedLink(detectedLink.url);
    }
    setDetectedLink(null);
  }, [detectedLink]);

  /**
   * Clear detected link without marking as processed
   */
  const clearLink = useCallback(() => {
    setDetectedLink(null);
  }, []);

  /**
   * Toggle clipboard detection
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    try {
      localStorage.setItem(CLIPBOARD_ENABLED_KEY, String(enabled));
    } catch (e) {
      console.warn('[useClipboardDetection] Could not save setting:', e);
    }
  }, []);

  /**
   * Mark a URL as processed (used after successful try-on)
   */
  const markAsProcessed = useCallback((url: string) => {
    saveProcessedLink(url);
    if (detectedLink?.url === url) {
      setDetectedLink(null);
    }
  }, [detectedLink]);

  // Check clipboard on window focus
  useEffect(() => {
    if (!isEnabled) return;

    const handleFocus = () => {
      // Debounce: only check if last check was > 1 second ago
      checkClipboard();
    };

    window.addEventListener('focus', handleFocus);
    
    // Initial check when hook mounts
    checkClipboard();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isEnabled, checkClipboard]);

  return {
    // State
    detectedLink,
    isChecking,
    isEnabled,
    error,

    // Actions
    checkClipboard,
    dismissLink,
    clearLink,
    setEnabled,
    markAsProcessed,
  };
}
