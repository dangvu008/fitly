import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractClothingItemsForTryOn, SharedOutfit, ClothingItemInfo } from './useOutfitTryOn';

/**
 * **Feature: outfit-try-on-from-feed, Property 1: All outfit items passed to try-on processor**
 * 
 * *For any* shared outfit with N clothing items, when the try-on process is initiated,
 * the AI processor SHALL receive exactly N clothing items with their imageUrl and name preserved.
 * 
 * **Validates: Requirements 1.3**
 */

// Arbitrary for generating valid ClothingItemInfo
const clothingItemInfoArb: fc.Arbitrary<ClothingItemInfo> = fc.record({
  name: fc.string({ minLength: 1 }),
  imageUrl: fc.webUrl(),
  shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
  price: fc.option(fc.string(), { nil: undefined }),
  category: fc.option(fc.string(), { nil: undefined }),
  color: fc.option(fc.string(), { nil: undefined }),
});

// Arbitrary for generating valid ISO date strings
const isoDateStringArb = fc.constantFrom(
  '2024-01-15T10:30:00.000Z',
  '2024-06-20T14:45:30.000Z',
  '2024-12-01T08:00:00.000Z',
  '2025-03-10T16:20:15.000Z',
);

// Arbitrary for generating valid SharedOutfit
const sharedOutfitArb: fc.Arbitrary<SharedOutfit> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }),
  description: fc.option(fc.string(), { nil: null }),
  result_image_url: fc.webUrl(),
  likes_count: fc.nat(),
  comments_count: fc.nat(),
  is_featured: fc.boolean(),
  created_at: isoDateStringArb,
  user_id: fc.uuid(),
  clothing_items: fc.array(clothingItemInfoArb, { minLength: 0, maxLength: 10 }),
  user_profile: fc.option(
    fc.record({
      display_name: fc.option(fc.string(), { nil: undefined }),
      avatar_url: fc.option(fc.webUrl(), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  isLiked: fc.option(fc.boolean(), { nil: undefined }),
  isSaved: fc.option(fc.boolean(), { nil: undefined }),
});

describe('extractClothingItemsForTryOn', () => {
  /**
   * **Feature: outfit-try-on-from-feed, Property 1: All outfit items passed to try-on processor**
   * **Validates: Requirements 1.3**
   */
  it('should return exactly N items for an outfit with N clothing items', () => {
    fc.assert(
      fc.property(sharedOutfitArb, (outfit) => {
        const result = extractClothingItemsForTryOn(outfit);
        
        // Property: The number of items returned equals the number of items in the outfit
        expect(result.length).toBe(outfit.clothing_items.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 1: All outfit items passed to try-on processor**
   * **Validates: Requirements 1.3**
   */
  it('should preserve imageUrl and name for all items', () => {
    fc.assert(
      fc.property(sharedOutfitArb, (outfit) => {
        const result = extractClothingItemsForTryOn(outfit);
        
        // Property: Each item's imageUrl and name are preserved
        outfit.clothing_items.forEach((originalItem, index) => {
          expect(result[index].imageUrl).toBe(originalItem.imageUrl);
          expect(result[index].name).toBe(originalItem.name);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 1: All outfit items passed to try-on processor**
   * **Validates: Requirements 1.3**
   */
  it('should return only imageUrl and name properties', () => {
    fc.assert(
      fc.property(sharedOutfitArb, (outfit) => {
        const result = extractClothingItemsForTryOn(outfit);
        
        // Property: Each result item has exactly imageUrl and name properties
        result.forEach((item) => {
          const keys = Object.keys(item);
          expect(keys).toHaveLength(2);
          expect(keys).toContain('imageUrl');
          expect(keys).toContain('name');
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 1: All outfit items passed to try-on processor**
   * **Validates: Requirements 1.3**
   * 
   * Edge case: handles undefined or non-array clothing_items gracefully
   */
  it('should return empty array for invalid clothing_items', () => {
    // Test with undefined clothing_items
    const outfitWithUndefined = {
      id: 'test-id',
      title: 'Test',
      description: null,
      result_image_url: 'https://example.com/image.jpg',
      likes_count: 0,
      comments_count: 0,
      is_featured: false,
      created_at: new Date().toISOString(),
      user_id: 'user-id',
      clothing_items: undefined as unknown as ClothingItemInfo[],
    } as SharedOutfit;

    expect(extractClothingItemsForTryOn(outfitWithUndefined)).toEqual([]);

    // Test with non-array clothing_items
    const outfitWithNonArray = {
      ...outfitWithUndefined,
      clothing_items: 'not-an-array' as unknown as ClothingItemInfo[],
    } as SharedOutfit;

    expect(extractClothingItemsForTryOn(outfitWithNonArray)).toEqual([]);
  });
});
