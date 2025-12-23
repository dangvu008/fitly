import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { prepareSharedOutfitRecord } from './useSharedOutfits';

/**
 * **Feature: outfit-try-on-from-feed, Property 6: Shared result contains attribution**
 * 
 * *For any* try-on result shared to the feed that originated from another outfit,
 * the new shared outfit record SHALL contain an `inspired_by_outfit_id` field
 * that matches the original outfit's ID.
 * 
 * **Validates: Requirements 5.2**
 */

// Arbitrary for generating valid clothing item data
const clothingItemDataArb = fc.record({
  id: fc.option(fc.uuid(), { nil: undefined }),
  name: fc.string({ minLength: 1 }),
  imageUrl: fc.webUrl(),
  category: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  purchaseUrl: fc.option(fc.webUrl(), { nil: undefined }),
});

// Arbitrary for generating valid UUIDs (outfit IDs)
const uuidArb = fc.uuid();

// Arbitrary for generating valid URLs
const urlArb = fc.webUrl();

// Arbitrary for generating non-empty strings (for title)
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 });

// Arbitrary for generating optional description
const descriptionArb = fc.option(fc.string({ maxLength: 500 }), { nil: undefined });

describe('prepareSharedOutfitRecord', () => {
  /**
   * **Feature: outfit-try-on-from-feed, Property 6: Shared result contains attribution**
   * **Validates: Requirements 5.2**
   */
  it('should preserve inspired_by_outfit_id when provided', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        nonEmptyStringArb, // title
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 0, maxLength: 10 }), // clothingItems
        descriptionArb, // description
        uuidArb, // inspiredByOutfitId
        (userId, title, resultImageUrl, clothingItems, description, inspiredByOutfitId) => {
          const record = prepareSharedOutfitRecord(
            userId,
            title,
            resultImageUrl,
            clothingItems,
            description,
            inspiredByOutfitId
          );

          // Property: The inspired_by_outfit_id in the record matches the provided inspiredByOutfitId
          expect(record.inspired_by_outfit_id).toBe(inspiredByOutfitId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 6: Shared result contains attribution**
   * **Validates: Requirements 5.2**
   */
  it('should set inspired_by_outfit_id to null when not provided', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        nonEmptyStringArb, // title
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 0, maxLength: 10 }), // clothingItems
        descriptionArb, // description
        (userId, title, resultImageUrl, clothingItems, description) => {
          const record = prepareSharedOutfitRecord(
            userId,
            title,
            resultImageUrl,
            clothingItems,
            description
            // inspiredByOutfitId not provided
          );

          // Property: inspired_by_outfit_id is null when not provided
          expect(record.inspired_by_outfit_id).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 6: Shared result contains attribution**
   * **Validates: Requirements 5.2**
   */
  it('should set inspired_by_outfit_id to null when explicitly passed as null', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        nonEmptyStringArb, // title
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 0, maxLength: 10 }), // clothingItems
        descriptionArb, // description
        (userId, title, resultImageUrl, clothingItems, description) => {
          const record = prepareSharedOutfitRecord(
            userId,
            title,
            resultImageUrl,
            clothingItems,
            description,
            null // explicitly null
          );

          // Property: inspired_by_outfit_id is null when explicitly passed as null
          expect(record.inspired_by_outfit_id).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 6: Shared result contains attribution**
   * **Validates: Requirements 5.2**
   */
  it('should preserve all other fields alongside attribution reference', () => {
    fc.assert(
      fc.property(
        uuidArb, // userId
        nonEmptyStringArb, // title
        urlArb, // resultImageUrl
        fc.array(clothingItemDataArb, { minLength: 1, maxLength: 10 }), // clothingItems (at least 1)
        fc.string({ minLength: 1, maxLength: 500 }), // description (non-empty for this test)
        uuidArb, // inspiredByOutfitId
        (userId, title, resultImageUrl, clothingItems, description, inspiredByOutfitId) => {
          const record = prepareSharedOutfitRecord(
            userId,
            title,
            resultImageUrl,
            clothingItems,
            description,
            inspiredByOutfitId
          );

          // Property: All fields are correctly set in the record
          expect(record.user_id).toBe(userId);
          expect(record.title).toBe(title);
          expect(record.result_image_url).toBe(resultImageUrl);
          expect(record.description).toBe(description);
          expect(Array.isArray(record.clothing_items)).toBe(true);
          expect(record.clothing_items.length).toBe(clothingItems.length);
          expect(record.inspired_by_outfit_id).toBe(inspiredByOutfitId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
