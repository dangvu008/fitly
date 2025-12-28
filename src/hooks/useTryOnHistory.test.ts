import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { prepareTryOnHistoryRecord } from './useTryOnHistory';

/**
 * Property-based tests for prepareTryOnHistoryRecord
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
  it('should create a valid record with all required fields', () => {
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
          );

          // Property: All required fields are present
          expect(record.user_id).toBe(userId);
          expect(record.body_image_url).toBe(bodyImageUrl);
          expect(record.result_image_url).toBe(resultImageUrl);
          expect(Array.isArray(record.clothing_items)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve clothing items array length', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        urlArb, // bodyImageUrl
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 1, maxLength: 10 }), // clothingItems (at least 1)
        (userId, bodyImageUrl, resultImageUrl, clothingItems) => {
          const record = prepareTryOnHistoryRecord(
            userId,
            bodyImageUrl,
            resultImageUrl,
            clothingItems
          );

          // Property: Clothing items length is preserved
          expect((record.clothing_items as unknown[]).length).toBe(clothingItems.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty clothing items array', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        urlArb, // bodyImageUrl
        urlArb, // resultImageUrl
        (userId, bodyImageUrl, resultImageUrl) => {
          const record = prepareTryOnHistoryRecord(
            userId,
            bodyImageUrl,
            resultImageUrl,
            []
          );

          // Property: Empty array is preserved
          expect((record.clothing_items as unknown[]).length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
