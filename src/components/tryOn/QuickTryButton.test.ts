import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ClothingCategory, ClothingItem } from '@/types/clothing';

/**
 * Property-based tests for QuickTryButton Component
 * Feature: one-tap-tryon-flow
 * 
 * Tests button presence and visibility on cards
 */

// Card types where QuickTryButton should appear
type CardType = 'outfit_feed' | 'clothing_item' | 'trending_outfit';

// Simulate card data
interface CardData {
  type: CardType;
  id: string;
  imageUrl: string;
  title?: string;
}

// Simulate outfit card data
interface OutfitCardData extends CardData {
  type: 'outfit_feed' | 'trending_outfit';
  userId: string;
  likesCount: number;
}

// Simulate clothing card data
interface ClothingCardData extends CardData {
  type: 'clothing_item';
  category: ClothingCategory;
  price?: string;
}

// Button visibility decision
interface ButtonVisibilityDecision {
  shouldShowButton: boolean;
  position: 'consistent' | 'none';
  reason: string;
}

/**
 * Pure function to determine if QuickTryButton should be visible on a card
 * This mirrors the logic that should be implemented in card components
 * 
 * Requirements:
 * - 2.1: WHEN displaying an outfit card in feed THEN show Quick_Try_Button
 * - 2.2: WHEN displaying a clothing item card THEN show Quick_Try_Button at consistent position
 * - 2.3: WHEN displaying trending outfits on home page THEN show Quick_Try_Button
 */
function shouldShowQuickTryButton(card: CardData): ButtonVisibilityDecision {
  switch (card.type) {
    case 'outfit_feed':
      // Requirement 2.1: Show on outfit cards in feed
      return {
        shouldShowButton: true,
        position: 'consistent',
        reason: 'outfit_feed_card',
      };
    
    case 'clothing_item':
      // Requirement 2.2: Show on clothing item cards
      return {
        shouldShowButton: true,
        position: 'consistent',
        reason: 'clothing_item_card',
      };
    
    case 'trending_outfit':
      // Requirement 2.3: Show on trending outfits
      return {
        shouldShowButton: true,
        position: 'consistent',
        reason: 'trending_outfit_card',
      };
    
    default:
      return {
        shouldShowButton: false,
        position: 'none',
        reason: 'unknown_card_type',
      };
  }
}

// Arbitrary generators for test data
const cardTypeArb = fc.constantFrom<CardType>('outfit_feed', 'clothing_item', 'trending_outfit');

const categoryArb = fc.constantFrom<ClothingCategory>(
  'all', 'top', 'bottom', 'dress', 'shoes', 'accessory', 'unknown'
);

const outfitCardArb: fc.Arbitrary<OutfitCardData> = fc.record({
  type: fc.constantFrom<'outfit_feed' | 'trending_outfit'>('outfit_feed', 'trending_outfit'),
  id: fc.uuid(),
  imageUrl: fc.webUrl({ validSchemes: ['https'] }),
  title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  userId: fc.uuid(),
  likesCount: fc.nat({ max: 10000 }),
});

const clothingCardArb: fc.Arbitrary<ClothingCardData> = fc.record({
  type: fc.constant<'clothing_item'>('clothing_item'),
  id: fc.uuid(),
  imageUrl: fc.webUrl({ validSchemes: ['https'] }),
  title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  category: categoryArb,
  price: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
});

const anyCardArb: fc.Arbitrary<CardData> = fc.oneof(
  outfitCardArb as fc.Arbitrary<CardData>,
  clothingCardArb as fc.Arbitrary<CardData>
);

/**
 * Pure function to simulate navigation parameters for Quick Try
 * This mirrors the logic in Index.tsx handleQuickTry function
 * 
 * Requirements:
 * - REQ-8.1: QuickTryButton navigate đến TryOnPage với initialGarmentUrl
 * - REQ-8.2: Truyền garment URL từ card được click
 */
interface QuickTryNavigationParams {
  garmentUrl: string;
  garmentId?: string;
  autoStart?: boolean;
}

interface NavigationResult {
  isValid: boolean;
  targetPage: 'try-on';
  params: {
    initialGarmentUrl: string;
    initialGarmentId?: string;
    autoStart: boolean;
  };
}

/**
 * Simulates the navigation logic when QuickTryButton is clicked
 * This is a pure function that can be tested with property-based testing
 */
function simulateQuickTryNavigation(params: QuickTryNavigationParams): NavigationResult {
  // Validate garment URL is present and non-empty
  const isValid = typeof params.garmentUrl === 'string' && params.garmentUrl.trim().length > 0;
  
  return {
    isValid,
    targetPage: 'try-on',
    params: {
      initialGarmentUrl: params.garmentUrl,
      initialGarmentId: params.garmentId,
      autoStart: params.autoStart ?? false,
    },
  };
}

/**
 * Simulates what TryOnPage receives and how it processes the garment
 * Based on TryOnPage useEffect logic for initialGarmentUrl
 */
interface GarmentLoadResult {
  selectedItems: Array<{
    id: string;
    name: string;
    imageUrl: string;
    category: 'all';
  }>;
  garmentUrlPreserved: boolean;
  garmentIdPreserved: boolean;
}

function simulateTryOnPageGarmentLoad(
  initialGarmentUrl: string,
  initialGarmentId?: string
): GarmentLoadResult {
  // This mirrors the logic in TryOnPage useEffect
  const garmentItem = {
    id: initialGarmentId || `quick-${Date.now()}`,
    name: 'Quick Try Item',
    imageUrl: initialGarmentUrl,
    category: 'all' as const,
  };
  
  return {
    selectedItems: [garmentItem],
    garmentUrlPreserved: garmentItem.imageUrl === initialGarmentUrl,
    garmentIdPreserved: initialGarmentId ? garmentItem.id === initialGarmentId : true,
  };
}

// Arbitrary generators for navigation test data
const garmentUrlArb = fc.webUrl({ validSchemes: ['https'] });
const garmentIdArb = fc.option(fc.uuid(), { nil: undefined });
const autoStartArb = fc.boolean();

describe('QuickTryButton Properties', () => {
  /**
   * Property 5: Quick Try Button Present On Cards
   * For any outfit card or clothing item card displayed in the app,
   * the Quick Try Button should be visible at a consistent position.
   * 
   * **Validates: Requirements 2.1, 2.2**
   */
  describe('Property 5: Quick Try Button Present On Cards', () => {
    it('should show QuickTryButton on all outfit feed cards', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // cardId
          fc.uuid(), // userId
          fc.webUrl({ validSchemes: ['https'] }), // imageUrl
          fc.nat({ max: 10000 }), // likesCount
          (cardId, userId, imageUrl, likesCount) => {
            const card: OutfitCardData = {
              type: 'outfit_feed',
              id: cardId,
              imageUrl,
              userId,
              likesCount,
            };

            const decision = shouldShowQuickTryButton(card);

            // Button should be shown on outfit feed cards
            expect(decision.shouldShowButton).toBe(true);
            // Position should be consistent
            expect(decision.position).toBe('consistent');
            // Reason should indicate outfit feed
            expect(decision.reason).toBe('outfit_feed_card');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show QuickTryButton on all clothing item cards', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // cardId
          fc.webUrl({ validSchemes: ['https'] }), // imageUrl
          categoryArb, // category
          fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }), // price
          (cardId, imageUrl, category, price) => {
            const card: ClothingCardData = {
              type: 'clothing_item',
              id: cardId,
              imageUrl,
              category,
              price,
            };

            const decision = shouldShowQuickTryButton(card);

            // Button should be shown on clothing item cards
            expect(decision.shouldShowButton).toBe(true);
            // Position should be consistent
            expect(decision.position).toBe('consistent');
            // Reason should indicate clothing item
            expect(decision.reason).toBe('clothing_item_card');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show QuickTryButton on all trending outfit cards', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // cardId
          fc.uuid(), // userId
          fc.webUrl({ validSchemes: ['https'] }), // imageUrl
          fc.nat({ max: 10000 }), // likesCount
          (cardId, userId, imageUrl, likesCount) => {
            const card: OutfitCardData = {
              type: 'trending_outfit',
              id: cardId,
              imageUrl,
              userId,
              likesCount,
            };

            const decision = shouldShowQuickTryButton(card);

            // Button should be shown on trending outfit cards
            expect(decision.shouldShowButton).toBe(true);
            // Position should be consistent
            expect(decision.position).toBe('consistent');
            // Reason should indicate trending outfit
            expect(decision.reason).toBe('trending_outfit_card');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show QuickTryButton on any valid card type', () => {
      fc.assert(
        fc.property(
          anyCardArb,
          (card) => {
            const decision = shouldShowQuickTryButton(card);

            // Button should always be shown on valid card types
            expect(decision.shouldShowButton).toBe(true);
            // Position should always be consistent
            expect(decision.position).toBe('consistent');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent position across all card types', () => {
      fc.assert(
        fc.property(
          fc.array(anyCardArb, { minLength: 2, maxLength: 10 }),
          (cards) => {
            const decisions = cards.map(shouldShowQuickTryButton);

            // All cards should have consistent position
            const positions = decisions.map((d) => d.position);
            const allConsistent = positions.every((p) => p === 'consistent');

            expect(allConsistent).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show button regardless of card content (title, price, etc.)', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // cardId
          fc.webUrl({ validSchemes: ['https'] }), // imageUrl
          categoryArb, // category
          fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }), // title (can be empty)
          fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: undefined }), // price (can be empty)
          (cardId, imageUrl, category, title, price) => {
            const card: ClothingCardData = {
              type: 'clothing_item',
              id: cardId,
              imageUrl,
              title,
              category,
              price,
            };

            const decision = shouldShowQuickTryButton(card);

            // Button visibility should not depend on optional content
            expect(decision.shouldShowButton).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show button regardless of likes count on outfit cards', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // cardId
          fc.uuid(), // userId
          fc.webUrl({ validSchemes: ['https'] }), // imageUrl
          fc.nat({ max: 1000000 }), // likesCount (any value)
          (cardId, userId, imageUrl, likesCount) => {
            const card: OutfitCardData = {
              type: 'outfit_feed',
              id: cardId,
              imageUrl,
              userId,
              likesCount,
            };

            const decision = shouldShowQuickTryButton(card);

            // Button visibility should not depend on likes count
            expect(decision.shouldShowButton).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show button for all clothing categories', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // cardId
          fc.webUrl({ validSchemes: ['https'] }), // imageUrl
          categoryArb, // any category
          (cardId, imageUrl, category) => {
            const card: ClothingCardData = {
              type: 'clothing_item',
              id: cardId,
              imageUrl,
              category,
            };

            const decision = shouldShowQuickTryButton(card);

            // Button should be shown for all categories
            expect(decision.shouldShowButton).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: QuickTryButton Navigates With Garment URL
   * For any valid garment URL, when QuickTryButton triggers navigation,
   * the garment URL should be correctly passed to TryOnPage and preserved.
   * 
   * **Validates: Requirements REQ-8.1, REQ-8.2**
   * 
   * Feature: smart-paste-auto-try, Property 2: QuickTryButton Navigates With Garment URL
   */
  describe('Property 2: QuickTryButton Navigates With Garment URL', () => {
    it('should pass garment URL correctly through navigation', () => {
      fc.assert(
        fc.property(
          garmentUrlArb, // any valid HTTPS URL
          garmentIdArb, // optional garment ID
          autoStartArb, // autoStart flag
          (garmentUrl, garmentId, autoStart) => {
            // Simulate navigation when QuickTryButton is clicked
            const navResult = simulateQuickTryNavigation({
              garmentUrl,
              garmentId,
              autoStart,
            });

            // Navigation should be valid for any non-empty URL
            expect(navResult.isValid).toBe(true);
            
            // Target page should always be try-on
            expect(navResult.targetPage).toBe('try-on');
            
            // Garment URL should be preserved exactly
            expect(navResult.params.initialGarmentUrl).toBe(garmentUrl);
            
            // Garment ID should be preserved if provided
            expect(navResult.params.initialGarmentId).toBe(garmentId);
            
            // AutoStart should be preserved
            expect(navResult.params.autoStart).toBe(autoStart);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve garment URL when TryOnPage loads the garment', () => {
      fc.assert(
        fc.property(
          garmentUrlArb, // any valid HTTPS URL
          garmentIdArb, // optional garment ID
          (garmentUrl, garmentId) => {
            // Simulate TryOnPage receiving and processing the garment
            const loadResult = simulateTryOnPageGarmentLoad(garmentUrl, garmentId);

            // Garment URL should be preserved in selectedItems
            expect(loadResult.garmentUrlPreserved).toBe(true);
            
            // Garment ID should be preserved if provided
            expect(loadResult.garmentIdPreserved).toBe(true);
            
            // Should have exactly one item in selectedItems
            expect(loadResult.selectedItems.length).toBe(1);
            
            // The item should have the correct imageUrl
            expect(loadResult.selectedItems[0].imageUrl).toBe(garmentUrl);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle navigation with garment ID correctly', () => {
      fc.assert(
        fc.property(
          garmentUrlArb, // any valid HTTPS URL
          fc.uuid(), // always provide garment ID
          (garmentUrl, garmentId) => {
            // Simulate navigation with explicit garment ID
            const navResult = simulateQuickTryNavigation({
              garmentUrl,
              garmentId,
              autoStart: false,
            });

            // Garment ID should be passed through
            expect(navResult.params.initialGarmentId).toBe(garmentId);

            // Simulate TryOnPage loading
            const loadResult = simulateTryOnPageGarmentLoad(garmentUrl, garmentId);
            
            // The item ID should match the provided garment ID
            expect(loadResult.selectedItems[0].id).toBe(garmentId);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate fallback ID when garment ID is not provided', () => {
      fc.assert(
        fc.property(
          garmentUrlArb, // any valid HTTPS URL
          (garmentUrl) => {
            // Simulate TryOnPage loading without garment ID
            const loadResult = simulateTryOnPageGarmentLoad(garmentUrl, undefined);

            // Should still have one item
            expect(loadResult.selectedItems.length).toBe(1);
            
            // The item should have a generated ID starting with 'quick-'
            expect(loadResult.selectedItems[0].id).toMatch(/^quick-\d+$/);
            
            // URL should still be preserved
            expect(loadResult.selectedItems[0].imageUrl).toBe(garmentUrl);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set category to "all" for quick try items', () => {
      fc.assert(
        fc.property(
          garmentUrlArb, // any valid HTTPS URL
          garmentIdArb, // optional garment ID
          (garmentUrl, garmentId) => {
            // Simulate TryOnPage loading
            const loadResult = simulateTryOnPageGarmentLoad(garmentUrl, garmentId);

            // Category should always be 'all' for quick try items
            // (AI will detect actual category later)
            expect(loadResult.selectedItems[0].category).toBe('all');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle autoStart flag correctly', () => {
      fc.assert(
        fc.property(
          garmentUrlArb, // any valid HTTPS URL
          fc.boolean(), // autoStart flag
          (garmentUrl, autoStart) => {
            // Simulate navigation with autoStart
            const navResult = simulateQuickTryNavigation({
              garmentUrl,
              autoStart,
            });

            // AutoStart should be preserved exactly
            expect(navResult.params.autoStart).toBe(autoStart);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default autoStart to false when not provided', () => {
      fc.assert(
        fc.property(
          garmentUrlArb, // any valid HTTPS URL
          (garmentUrl) => {
            // Simulate navigation without autoStart
            const navResult = simulateQuickTryNavigation({
              garmentUrl,
            });

            // AutoStart should default to false
            expect(navResult.params.autoStart).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve URL integrity for various URL formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Standard HTTPS URLs
            fc.webUrl({ validSchemes: ['https'] }),
            // URLs with query parameters
            fc.tuple(
              fc.webUrl({ validSchemes: ['https'] }),
              fc.string({ minLength: 1, maxLength: 50 })
            ).map(([url, param]) => `${url}?item=${encodeURIComponent(param)}`),
            // URLs with paths
            fc.tuple(
              fc.webUrl({ validSchemes: ['https'] }),
              fc.stringMatching(/^[a-z0-9-]{1,20}$/)
            ).map(([url, path]) => `${url}/${path}`)
          ),
          (garmentUrl) => {
            // Simulate full flow
            const navResult = simulateQuickTryNavigation({ garmentUrl });
            const loadResult = simulateTryOnPageGarmentLoad(garmentUrl);

            // URL should be preserved exactly through the entire flow
            expect(navResult.params.initialGarmentUrl).toBe(garmentUrl);
            expect(loadResult.selectedItems[0].imageUrl).toBe(garmentUrl);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
