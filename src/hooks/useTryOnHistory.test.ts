import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { prepareTryOnHistoryRecord } from './useTryOnHistory';

/**
 * **Feature: outfit-try-on-from-feed, Property 5: Saved result contains source outfit reference**
 * 
 * *For any* try-on result saved from a shared outfit, the saved record SHALL contain
 * a `sourceOutfitId` field that matches the original shared outfit's ID.
 * 
 * **Validates: Requirements 4.2**
 */

// Arbitrary for generating valid clothing item data
const clothingItemDataArb = fc.record({
  name: fc.string({ minLength: 1 }),
  imageUrl: fc.webUrl(),
});

// Arbitrary for generating valid UUIDs (outfit IDs)
const uuidArb = fc.uuid();

// Arbitrary for generating valid URLs
const urlArb = fc.webUrl();

describe('prepareTryOnHistoryRecord', () => {
  /**
   * **Feature: outfit-try-on-from-feed, Property 5: Saved result contains source outfit reference**
   * **Validates: Requirements 4.2**
   */
  it('should preserve source outfit ID when provided', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        urlArb, // bodyImageUrl
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 0, maxLength: 10 }), // clothingItems
        uuidArb, // sourceOutfitId
        (userId, bodyImageUrl, resultImageUrl, clothingItems, sourceOutfitId) => {
          const record = prepareTryOnHistoryRecord(
            userId,
            bodyImageUrl,
            resultImageUrl,
            clothingItems,
            sourceOutfitId
          );

          // Property: The source_outfit_id in the record matches the provided sourceOutfitId
          expect(record.source_outfit_id).toBe(sourceOutfitId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 5: Saved result contains source outfit reference**
   * **Validates: Requirements 4.2**
   */
  it('should set source_outfit_id to null when not provided', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        urlArb, // bodyImageUrl
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 0, maxLength: 10 }), // clothingItems
        (userId, bodyImageUrl, resultImageUrl, clothingItems) => {
          const record = prepareTryOnHistoryRecord(
            userId,
            bodyImageUrl,
            resultImageUrl,
            clothingItems
            // sourceOutfitId not provided
          );

          // Property: source_outfit_id is null when not provided
          expect(record.source_outfit_id).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 5: Saved result contains source outfit reference**
   * **Validates: Requirements 4.2**
   */
  it('should set source_outfit_id to null when explicitly passed as null', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        urlArb, // bodyImageUrl
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 0, maxLength: 10 }), // clothingItems
        (userId, bodyImageUrl, resultImageUrl, clothingItems) => {
          const record = prepareTryOnHistoryRecord(
            userId,
            bodyImageUrl,
            resultImageUrl,
            clothingItems,
            null // explicitly null
          );

          // Property: source_outfit_id is null when explicitly passed as null
          expect(record.source_outfit_id).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 5: Saved result contains source outfit reference**
   * **Validates: Requirements 4.2**
   */
  it('should preserve all other fields alongside source outfit reference', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        urlArb, // bodyImageUrl
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 1, maxLength: 10 }), // clothingItems (at least 1)
        uuidArb, // sourceOutfitId
        (userId, bodyImageUrl, resultImageUrl, clothingItems, sourceOutfitId) => {
          const record = prepareTryOnHistoryRecord(
            userId,
            bodyImageUrl,
            resultImageUrl,
            clothingItems,
            sourceOutfitId
          );

          // Property: All fields are correctly set in the record
          expect(record.user_id).toBe(userId);
          expect(record.body_image_url).toBe(bodyImageUrl);
          expect(record.result_image_url).toBe(resultImageUrl);
          expect(Array.isArray(record.clothing_items)).toBe(true);
          expect((record.clothing_items as unknown[]).length).toBe(clothingItems.length);
          expect(record.source_outfit_id).toBe(sourceOutfitId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
