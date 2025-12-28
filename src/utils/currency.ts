/**
 * Currency Localization Utilities
 * Handles price formatting for different currencies and locales
 */

export type SupportedCurrency = 'USD' | 'VND' | 'EUR' | 'GBP' | 'JPY' | 'KRW' | 'THB' | 'CNY';

interface CurrencyConfig {
  symbol: string;
  code: string;
  locale: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
}

const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  USD: { symbol: '$', code: 'USD', locale: 'en-US', decimals: 2, symbolPosition: 'before' },
  VND: { symbol: '₫', code: 'VND', locale: 'vi-VN', decimals: 0, symbolPosition: 'after' },
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE', decimals: 2, symbolPosition: 'after' },
  GBP: { symbol: '£', code: 'GBP', locale: 'en-GB', decimals: 2, symbolPosition: 'before' },
  JPY: { symbol: '¥', code: 'JPY', locale: 'ja-JP', decimals: 0, symbolPosition: 'before' },
  KRW: { symbol: '₩', code: 'KRW', locale: 'ko-KR', decimals: 0, symbolPosition: 'before' },
  THB: { symbol: '฿', code: 'THB', locale: 'th-TH', decimals: 2, symbolPosition: 'before' },
  CNY: { symbol: '¥', code: 'CNY', locale: 'zh-CN', decimals: 2, symbolPosition: 'before' },
};

// Regional price tiers (multipliers relative to USD)
const REGIONAL_PRICE_TIERS: Record<string, number> = {
  US: 1.0,      // Base price
  VN: 0.4,     // 40% of US price (PPP adjusted)
  TH: 0.5,     // 50% of US price
  ID: 0.4,     // 40% of US price
  PH: 0.5,     // 50% of US price
  MY: 0.6,     // 60% of US price
  IN: 0.3,     // 30% of US price
  BR: 0.5,     // 50% of US price
  MX: 0.6,     // 60% of US price
  // Default for unlisted countries
  DEFAULT: 1.0,
};

// Country to currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, SupportedCurrency> = {
  US: 'USD',
  VN: 'VND',
  TH: 'THB',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
};

/**
 * Format a price with proper currency symbol and locale
 */
export function formatPrice(
  amount: number,
  currency: SupportedCurrency | string,
  locale?: string
): string {
  const config = CURRENCY_CONFIGS[currency as SupportedCurrency];
  
  if (!config) {
    // Fallback for unknown currencies
    return `${currency} ${amount.toFixed(2)}`;
  }

  const useLocale = locale || config.locale;
  
  try {
    return new Intl.NumberFormat(useLocale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(amount);
  } catch {
    // Fallback formatting
    const formattedNumber = amount.toLocaleString(useLocale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
    
    return config.symbolPosition === 'before'
      ? `${config.symbol}${formattedNumber}`
      : `${formattedNumber}${config.symbol}`;
  }
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: SupportedCurrency | string): string {
  const config = CURRENCY_CONFIGS[currency as SupportedCurrency];
  return config?.symbol || currency;
}

/**
 * Get currency config
 */
export function getCurrencyConfig(currency: SupportedCurrency | string): CurrencyConfig | null {
  return CURRENCY_CONFIGS[currency as SupportedCurrency] || null;
}

/**
 * Convert price from USD to local currency
 */
export function convertFromUSD(
  usdAmount: number,
  targetCurrency: SupportedCurrency,
  exchangeRate?: number
): number {
  // Use provided exchange rate or estimate based on common rates
  const defaultRates: Record<SupportedCurrency, number> = {
    USD: 1,
    VND: 24500,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149,
    KRW: 1320,
    THB: 35,
    CNY: 7.2,
  };

  const rate = exchangeRate || defaultRates[targetCurrency] || 1;
  return usdAmount * rate;
}

/**
 * Get regional price based on country
 */
export function getRegionalPrice(
  baseUsdPrice: number,
  countryCode: string
): { price: number; currency: SupportedCurrency } {
  const tier = REGIONAL_PRICE_TIERS[countryCode] || REGIONAL_PRICE_TIERS.DEFAULT;
  const currency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
  
  // Apply regional tier discount
  const adjustedUsdPrice = baseUsdPrice * tier;
  
  // Convert to local currency
  const localPrice = convertFromUSD(adjustedUsdPrice, currency);
  
  // Round to nice numbers based on currency
  const roundedPrice = roundToNicePrice(localPrice, currency);
  
  return {
    price: roundedPrice,
    currency,
  };
}

/**
 * Round price to a "nice" number for the currency
 */
function roundToNicePrice(price: number, currency: SupportedCurrency): number {
  const config = CURRENCY_CONFIGS[currency];
  
  if (!config) return Math.round(price * 100) / 100;
  
  if (config.decimals === 0) {
    // Round to nearest 1000 for VND, JPY, KRW
    if (currency === 'VND') {
      return Math.round(price / 1000) * 1000;
    }
    if (currency === 'JPY' || currency === 'KRW') {
      return Math.round(price / 100) * 100;
    }
    return Math.round(price);
  }
  
  // Round to .99 for USD, EUR, GBP
  return Math.floor(price) + 0.99;
}

/**
 * Detect user's likely currency based on locale
 */
export function detectUserCurrency(): SupportedCurrency {
  try {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1]?.toUpperCase();
    
    if (region && COUNTRY_CURRENCY_MAP[region]) {
      return COUNTRY_CURRENCY_MAP[region];
    }
    
    // Try to detect from timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Asia/Ho_Chi_Minh') || timezone.includes('Asia/Saigon')) {
      return 'VND';
    }
    if (timezone.includes('Asia/Bangkok')) {
      return 'THB';
    }
    if (timezone.includes('Asia/Tokyo')) {
      return 'JPY';
    }
    if (timezone.includes('Asia/Seoul')) {
      return 'KRW';
    }
    if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Beijing')) {
      return 'CNY';
    }
    if (timezone.includes('Europe/London')) {
      return 'GBP';
    }
    if (timezone.includes('Europe/')) {
      return 'EUR';
    }
  } catch {
    // Fallback to USD
  }
  
  return 'USD';
}

/**
 * Format price for display with optional period suffix
 */
export function formatSubscriptionPrice(
  amount: number,
  currency: SupportedCurrency,
  period: 'week' | 'month' | 'year'
): string {
  const formattedPrice = formatPrice(amount, currency);
  
  const periodLabels: Record<string, string> = {
    week: '/week',
    month: '/month',
    year: '/year',
  };
  
  return `${formattedPrice}${periodLabels[period]}`;
}
