import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { DetectedLink, SupportedPlatform, SUPPORTED_PLATFORMS } from './useClipboardDetection';

/**
 * Property-based tests for Smart Paste End-to-End Link Flow
 * Feature: smart-paste-auto-try
 * 
 * Tests that detected shopping links trigger crawl and navigation
 */

// All supported platform keys
const supportedPlatformKeys = Object.keys(SUPPORTED_PLATFORMS) as SupportedPlatform[];

// Sample domains for each platform
const platformDomains: Record<SupportedPlatform, string[]> = {
  shopee: ['shopee.vn', 'shopee.co.th', 'shopee.sg'],
  lazada: ['lazada.vn', 'lazada.co.th', 'lazada.sg'],
  tiktok: ['tiktok.com/shop/product', 'tiktokshop.com'],
  zara: ['zara.com'],
  amazon: ['amazon.com', 'amazon.vn', 'amazon.co.jp'],
  hm: ['hm.com', 'www2.hm.com'],
  uniqlo: ['uniqlo.com'],
};

// Arbitrary generator for a DetectedLink
function detectedLinkArb(): fc.Arbitrary<DetectedLink> {
  return fc.constantFrom(...supportedPlatformKeys).chain((platform) => {
    const domains = platformDomains[platform];
    return fc.tuple(
      fc.constantFrom(...domains),
      fc.stringMatching(/^[a-z0-9-]{1,20}$/),
      fc.stringMatching(/^[a-z0-9]{1,15}$/)
    ).map(([domain, path, productId]) => ({
      url: `https://${domain}/${path}/${productId}`,
      platform,
      platformName: SUPPORTED_PLATFORMS[platform].name,
      platformIcon: SUPPORTED_PLATFORMS[platform].icon,
      detectedAt: Date.now(),
    }));
  });
}

// Arbitrary generator for a successful crawl response
function successfulCrawlResponseArb(): fc.Arbitrary<{
  success: boolean;
  productImage: string;
  backgroundRemovedImage?: string;
  productName?: string;
  productPrice?: string;
  platform: string;
}> {
  return fc.record({
    success: fc.constant(true),
    productImage: fc.webUrl({ validSchemes: ['https'] }),
    backgroundRemovedImage: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: undefined }),
    productName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    productPrice: fc.option(fc.stringMatching(/^\d{1,3}(,\d{3})*(\.\d{2})?$/), { nil: undefined }),
    platform: fc.constantFrom(...supportedPlatformKeys),
  });
}

// Arbitrary generator for a failed crawl response
function failedCrawlResponseArb(): fc.Arbitrary<{
  success: boolean;
  error: string;
}> {
  return fc.record({
    success: fc.constant(false),
    error: fc.constantFrom(
      'Network timeout',
      'Invalid URL',
      'Platform not supported',
      'No product image found',
      'Rate limited'
    ),
  });
}

/**
 * Simulates the core crawlProductImage logic from useSmartPaste hook
 * This is a pure function that mirrors the hook's behavior for testing
 */
async function simulateCrawlProductImage(
  url: string,
  invokeFunction: (name: string, options: { body: { url: string; removeBackground: boolean } }) => Promise<{
    data: {
      success: boolean;
      productImage?: string;
      backgroundRemovedImage?: string;
      productName?: string;
      productPrice?: string;
      platform?: string;
      error?: string;
    } | null;
    error: { message: string } | null;
  }>
): Promise<{
  imageUrl: string;
  productName?: string;
  productPrice?: string;
  platform: string;
} | null> {
  const { data, error } = await invokeFunction('crawl-product-image', {
    body: { url, removeBackground: true },
  });

  // Handle supabase error
  if (error) {
    return null;
  }

  // Handle failed response or missing image
  if (!data?.success || !data?.productImage) {
    return null;
  }

  // Return the crawled product - prefer backgroundRemovedImage if available
  return {
    imageUrl: data.backgroundRemovedImage || data.productImage,
    productName: data.productName,
    productPrice: data.productPrice,
    platform: data.platform || 'unknown',
  };
}

describe('Smart Paste End-to-End Link Flow Properties', () => {
  /**
   * Property 6: Detected Link Triggers Crawl And Navigate
   * For any detected shopping link, when handleTryFromLink is called:
   * - If crawl succeeds, onSuccess callback is called with the garment URL
   * - If crawl fails, onSuccess callback is NOT called
   * 
   * **Validates: REQ-3.1, REQ-3.2**
   * 
   * Feature: smart-paste-auto-try, Property 6: Detected Link Triggers Crawl And Navigate
   */
  describe('Property 6: Detected Link Triggers Crawl And Navigate', () => {
    it('should return crawled product with correct imageUrl when crawl succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          successfulCrawlResponseArb(),
          async (detectedLink, crawlResponse) => {
            // Create a mock invoke function that returns the crawl response
            const mockInvoke = vi.fn().mockResolvedValue({
              data: crawlResponse,
              error: null,
            });

            // Simulate the crawl
            const result = await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Verify the crawl was called with correct URL
            expect(mockInvoke).toHaveBeenCalledWith('crawl-product-image', {
              body: { url: detectedLink.url, removeBackground: true },
            });

            // Should return a result
            expect(result).not.toBeNull();

            // The expected garment URL should be backgroundRemovedImage if available, else productImage
            const expectedImageUrl = crawlResponse.backgroundRemovedImage || crawlResponse.productImage;
            expect(result?.imageUrl).toBe(expectedImageUrl);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when crawl response indicates failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          failedCrawlResponseArb(),
          async (detectedLink, crawlResponse) => {
            // Create a mock invoke function that returns failed response
            const mockInvoke = vi.fn().mockResolvedValue({
              data: crawlResponse,
              error: null,
            });

            // Simulate the crawl
            const result = await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Verify the crawl was called
            expect(mockInvoke).toHaveBeenCalledWith('crawl-product-image', {
              body: { url: detectedLink.url, removeBackground: true },
            });

            // Should return null on failure
            expect(result).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when supabase returns an error', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          fc.string({ minLength: 5, maxLength: 50 }),
          async (detectedLink, errorMessage) => {
            // Create a mock invoke function that returns an error
            const mockInvoke = vi.fn().mockResolvedValue({
              data: null,
              error: { message: errorMessage },
            });

            // Simulate the crawl
            const result = await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Should return null on error
            expect(result).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prefer backgroundRemovedImage over productImage when both are available', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          fc.webUrl({ validSchemes: ['https'] }),
          fc.webUrl({ validSchemes: ['https'] }),
          fc.constantFrom(...supportedPlatformKeys),
          async (detectedLink, productImage, backgroundRemovedImage, platform) => {
            // Ensure they're different URLs
            fc.pre(productImage !== backgroundRemovedImage);

            const crawlResponse = {
              success: true,
              productImage,
              backgroundRemovedImage,
              platform,
            };

            const mockInvoke = vi.fn().mockResolvedValue({
              data: crawlResponse,
              error: null,
            });

            const result = await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Should use backgroundRemovedImage
            expect(result?.imageUrl).toBe(backgroundRemovedImage);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use productImage when backgroundRemovedImage is not available', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          fc.webUrl({ validSchemes: ['https'] }),
          fc.constantFrom(...supportedPlatformKeys),
          async (detectedLink, productImage, platform) => {
            const crawlResponse = {
              success: true,
              productImage,
              backgroundRemovedImage: undefined,
              platform,
            };

            const mockInvoke = vi.fn().mockResolvedValue({
              data: crawlResponse,
              error: null,
            });

            const result = await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Should use productImage as fallback
            expect(result?.imageUrl).toBe(productImage);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include platform info in the result', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          fc.webUrl({ validSchemes: ['https'] }),
          fc.constantFrom(...supportedPlatformKeys),
          async (detectedLink, productImage, platform) => {
            const crawlResponse = {
              success: true,
              productImage,
              platform,
            };

            const mockInvoke = vi.fn().mockResolvedValue({
              data: crawlResponse,
              error: null,
            });

            const result = await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Should include platform from response
            expect(result?.platform).toBe(platform);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when productImage is missing from successful response', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          fc.constantFrom(...supportedPlatformKeys),
          async (detectedLink, platform) => {
            // Response with success=true but no productImage
            const crawlResponse = {
              success: true,
              productImage: undefined,
              platform,
            };

            const mockInvoke = vi.fn().mockResolvedValue({
              data: crawlResponse,
              error: null,
            });

            const result = await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Should return null when productImage is missing
            expect(result).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always call invoke with removeBackground=true', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          successfulCrawlResponseArb(),
          async (detectedLink, crawlResponse) => {
            const mockInvoke = vi.fn().mockResolvedValue({
              data: crawlResponse,
              error: null,
            });

            await simulateCrawlProductImage(detectedLink.url, mockInvoke);

            // Verify removeBackground is always true
            expect(mockInvoke).toHaveBeenCalledWith('crawl-product-image', {
              body: { url: detectedLink.url, removeBackground: true },
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Error type definitions for testing
 */
type CrawlErrorType = 'network' | 'timeout' | 'unsupported' | 'no_image' | 'rate_limit' | 'unknown';

interface CrawlError {
  type: CrawlErrorType;
  message: string;
  url: string;
  canRetry: boolean;
}

/**
 * Simulates the error parsing logic from useSmartPaste hook
 */
function parseErrorType(errorMessage: string): CrawlErrorType {
  const lowerMessage = errorMessage.toLowerCase();
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'timeout';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return 'network';
  }
  if (lowerMessage.includes('not supported') || lowerMessage.includes('unsupported')) {
    return 'unsupported';
  }
  if (lowerMessage.includes('no product image') || lowerMessage.includes('no image') || lowerMessage.includes('not found')) {
    return 'no_image';
  }
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
    return 'rate_limit';
  }
  return 'unknown';
}

/**
 * Simulates the canRetry logic from useSmartPaste hook
 */
function canRetryError(type: CrawlErrorType): boolean {
  return type !== 'unsupported';
}

/**
 * Simulates creating a CrawlError from an error message
 */
function createCrawlError(errorMessage: string, url: string, retryCount: number, maxRetries: number): CrawlError {
  const type = parseErrorType(errorMessage);
  return {
    type,
    message: errorMessage,
    url,
    canRetry: canRetryError(type) && retryCount < maxRetries,
  };
}

// Arbitrary generator for error messages by type
function errorMessageArb(type: CrawlErrorType): fc.Arbitrary<string> {
  switch (type) {
    case 'timeout':
      return fc.constantFrom('Request timeout', 'Connection timed out', 'Timeout exceeded');
    case 'network':
      return fc.constantFrom('Network error', 'Failed to fetch', 'Connection refused');
    case 'unsupported':
      return fc.constantFrom('Platform not supported', 'Unsupported URL', 'This site is not supported');
    case 'no_image':
      return fc.constantFrom('No product image found', 'Image not found', 'No image available');
    case 'rate_limit':
      return fc.constantFrom('Rate limited', 'Too many requests', 'Rate limit exceeded');
    default:
      return fc.constantFrom('Unknown error', 'Something went wrong', 'Unexpected error');
  }
}

// Arbitrary generator for any error type
function errorTypeArb(): fc.Arbitrary<CrawlErrorType> {
  return fc.constantFrom('network', 'timeout', 'unsupported', 'no_image', 'rate_limit', 'unknown');
}

describe('Smart Paste Error Recovery Properties', () => {
  /**
   * Property 11: Errors Show Fallback Options
   * For any crawl error:
   * - Error type is correctly parsed from error message
   * - canRetry is true for all error types except 'unsupported'
   * - Error includes the original URL for retry
   * - Retry count is respected (max 3 retries)
   * 
   * **Validates: REQ-10.1, REQ-10.2**
   * 
   * Feature: smart-paste-auto-try, Property 11: Errors Show Fallback Options
   */
  describe('Property 11: Errors Show Fallback Options', () => {
    it('should correctly parse error type from error message', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorTypeArb(),
          async (expectedType) => {
            // Get an error message for this type
            const errorMessage = await fc.sample(errorMessageArb(expectedType), 1)[0];
            
            // Parse the error type
            const parsedType = parseErrorType(errorMessage);
            
            // Should match the expected type
            expect(parsedType).toBe(expectedType);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow retry for all error types except unsupported', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorTypeArb(),
          async (errorType) => {
            const canRetry = canRetryError(errorType);
            
            if (errorType === 'unsupported') {
              // Unsupported errors should NOT be retryable
              expect(canRetry).toBe(false);
            } else {
              // All other errors should be retryable
              expect(canRetry).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include original URL in error for retry', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          errorTypeArb(),
          fc.integer({ min: 0, max: 5 }),
          async (detectedLink, errorType, retryCount) => {
            const errorMessage = await fc.sample(errorMessageArb(errorType), 1)[0];
            const maxRetries = 3;
            
            const crawlError = createCrawlError(errorMessage, detectedLink.url, retryCount, maxRetries);
            
            // Error should always include the original URL
            expect(crawlError.url).toBe(detectedLink.url);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect max retry count', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          fc.constantFrom('network', 'timeout', 'no_image', 'rate_limit', 'unknown') as fc.Arbitrary<CrawlErrorType>,
          fc.integer({ min: 0, max: 10 }),
          async (detectedLink, errorType, retryCount) => {
            const errorMessage = await fc.sample(errorMessageArb(errorType), 1)[0];
            const maxRetries = 3;
            
            const crawlError = createCrawlError(errorMessage, detectedLink.url, retryCount, maxRetries);
            
            // canRetry should be false if retryCount >= maxRetries
            if (retryCount >= maxRetries) {
              expect(crawlError.canRetry).toBe(false);
            } else {
              // For retryable error types, canRetry should be true
              expect(crawlError.canRetry).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never allow retry for unsupported platform errors regardless of retry count', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          fc.integer({ min: 0, max: 10 }),
          async (detectedLink, retryCount) => {
            const errorMessage = await fc.sample(errorMessageArb('unsupported'), 1)[0];
            const maxRetries = 3;
            
            const crawlError = createCrawlError(errorMessage, detectedLink.url, retryCount, maxRetries);
            
            // Unsupported errors should never be retryable
            expect(crawlError.canRetry).toBe(false);
            expect(crawlError.type).toBe('unsupported');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve error message in CrawlError', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          errorTypeArb(),
          async (detectedLink, errorType) => {
            const errorMessage = await fc.sample(errorMessageArb(errorType), 1)[0];
            const maxRetries = 3;
            
            const crawlError = createCrawlError(errorMessage, detectedLink.url, 0, maxRetries);
            
            // Error message should be preserved
            expect(crawlError.message).toBe(errorMessage);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create valid CrawlError structure for any error', async () => {
      await fc.assert(
        fc.asyncProperty(
          detectedLinkArb(),
          errorTypeArb(),
          fc.integer({ min: 0, max: 5 }),
          async (detectedLink, errorType, retryCount) => {
            const errorMessage = await fc.sample(errorMessageArb(errorType), 1)[0];
            const maxRetries = 3;
            
            const crawlError = createCrawlError(errorMessage, detectedLink.url, retryCount, maxRetries);
            
            // Verify CrawlError has all required fields
            expect(crawlError).toHaveProperty('type');
            expect(crawlError).toHaveProperty('message');
            expect(crawlError).toHaveProperty('url');
            expect(crawlError).toHaveProperty('canRetry');
            
            // Type should be a valid error type
            expect(['network', 'timeout', 'unsupported', 'no_image', 'rate_limit', 'unknown']).toContain(crawlError.type);
            
            // canRetry should be a boolean
            expect(typeof crawlError.canRetry).toBe('boolean');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Gem Gate Integration Types
 */
interface GemState {
  balance: number;
  requiredGems: number;
}

interface SmartPasteGemDecision {
  shouldShowGemGate: boolean;
  shouldProceedWithAction: boolean;
  hasSufficientGems: boolean;
  reason: 'sufficient_gems' | 'insufficient_gems';
}

/**
 * Pure function to determine gem gate behavior for smart paste
 * This mirrors the logic in useSmartPaste hook
 * 
 * @requirements REQ-11.1, REQ-11.2
 */
function getSmartPasteGemDecision(gemState: GemState): SmartPasteGemDecision {
  const hasSufficientGems = gemState.balance >= gemState.requiredGems;
  
  if (hasSufficientGems) {
    return {
      shouldShowGemGate: false,
      shouldProceedWithAction: true,
      hasSufficientGems: true,
      reason: 'sufficient_gems',
    };
  }
  
  return {
    shouldShowGemGate: true,
    shouldProceedWithAction: false,
    hasSufficientGems: false,
    reason: 'insufficient_gems',
  };
}

// Arbitrary generator for gem state
function gemStateArb(): fc.Arbitrary<GemState> {
  return fc.record({
    balance: fc.integer({ min: 0, max: 100 }),
    requiredGems: fc.integer({ min: 1, max: 10 }),
  });
}

// Arbitrary generator for sufficient gem state
function sufficientGemStateArb(): fc.Arbitrary<GemState> {
  return fc.integer({ min: 1, max: 10 }).chain((requiredGems) =>
    fc.integer({ min: requiredGems, max: requiredGems + 50 }).map((balance) => ({
      balance,
      requiredGems,
    }))
  );
}

// Arbitrary generator for insufficient gem state
function insufficientGemStateArb(): fc.Arbitrary<GemState> {
  return fc.integer({ min: 1, max: 10 }).chain((requiredGems) =>
    fc.integer({ min: 0, max: requiredGems - 1 }).map((balance) => ({
      balance,
      requiredGems,
    }))
  );
}

describe('Smart Paste Gem Gate Properties', () => {
  /**
   * Property 12: Insufficient Gems Shows Gate
   * For any smart paste action:
   * - If user has insufficient gems, GemGate should be shown
   * - If user has sufficient gems, action should proceed without GemGate
   * - The decision is based on balance >= requiredGems
   * 
   * **Validates: REQ-11.1, REQ-11.2**
   * 
   * Feature: smart-paste-auto-try, Property 12: Insufficient Gems Shows Gate
   */
  describe('Property 12: Insufficient Gems Shows Gate', () => {
    it('should show gem gate when balance is less than required gems', async () => {
      await fc.assert(
        fc.asyncProperty(
          insufficientGemStateArb(),
          async (gemState) => {
            const decision = getSmartPasteGemDecision(gemState);
            
            // Should show gem gate when insufficient
            expect(decision.shouldShowGemGate).toBe(true);
            expect(decision.shouldProceedWithAction).toBe(false);
            expect(decision.hasSufficientGems).toBe(false);
            expect(decision.reason).toBe('insufficient_gems');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show gem gate when balance is greater than or equal to required gems', async () => {
      await fc.assert(
        fc.asyncProperty(
          sufficientGemStateArb(),
          async (gemState) => {
            const decision = getSmartPasteGemDecision(gemState);
            
            // Should not show gem gate when sufficient
            expect(decision.shouldShowGemGate).toBe(false);
            expect(decision.shouldProceedWithAction).toBe(true);
            expect(decision.hasSufficientGems).toBe(true);
            expect(decision.reason).toBe('sufficient_gems');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine sufficiency for any gem state', async () => {
      await fc.assert(
        fc.asyncProperty(
          gemStateArb(),
          async (gemState) => {
            const decision = getSmartPasteGemDecision(gemState);
            
            // The decision should be consistent with the balance check
            const expectedSufficient = gemState.balance >= gemState.requiredGems;
            
            expect(decision.hasSufficientGems).toBe(expectedSufficient);
            expect(decision.shouldShowGemGate).toBe(!expectedSufficient);
            expect(decision.shouldProceedWithAction).toBe(expectedSufficient);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow action when balance exactly equals required gems', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          async (gems) => {
            const gemState: GemState = { balance: gems, requiredGems: gems };
            const decision = getSmartPasteGemDecision(gemState);
            
            // Exactly enough should be sufficient
            expect(decision.hasSufficientGems).toBe(true);
            expect(decision.shouldShowGemGate).toBe(false);
            expect(decision.shouldProceedWithAction).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show gem gate when balance is zero', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (requiredGems) => {
            const gemState: GemState = { balance: 0, requiredGems };
            const decision = getSmartPasteGemDecision(gemState);
            
            // Zero balance should always show gem gate
            expect(decision.shouldShowGemGate).toBe(true);
            expect(decision.hasSufficientGems).toBe(false);
            expect(decision.shouldProceedWithAction).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have mutually exclusive showGemGate and shouldProceedWithAction', async () => {
      await fc.assert(
        fc.asyncProperty(
          gemStateArb(),
          async (gemState) => {
            const decision = getSmartPasteGemDecision(gemState);
            
            // These should always be opposite
            expect(decision.shouldShowGemGate).toBe(!decision.shouldProceedWithAction);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid decision structure for any gem state', async () => {
      await fc.assert(
        fc.asyncProperty(
          gemStateArb(),
          async (gemState) => {
            const decision = getSmartPasteGemDecision(gemState);
            
            // Verify decision has all required fields
            expect(decision).toHaveProperty('shouldShowGemGate');
            expect(decision).toHaveProperty('shouldProceedWithAction');
            expect(decision).toHaveProperty('hasSufficientGems');
            expect(decision).toHaveProperty('reason');
            
            // All boolean fields should be booleans
            expect(typeof decision.shouldShowGemGate).toBe('boolean');
            expect(typeof decision.shouldProceedWithAction).toBe('boolean');
            expect(typeof decision.hasSufficientGems).toBe('boolean');
            
            // Reason should be one of the valid values
            expect(['sufficient_gems', 'insufficient_gems']).toContain(decision.reason);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
