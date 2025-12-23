import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  findSimilarItems,
  calculateRelevanceScore,
  normalizeCategory,
  calculateColorSimilarity,
} from './useSimilarClothing';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { ClothingItemInfo } from './useOutfitTryOn';

/**
 * **Feature: outfit-try-on-from-feed, Property 4: Similar items search returns same category**
 *
 * *For any* source clothing item with category C, all items returned by the similarity search
 * SHALL have category equal to C, and results SHALL be sorted by relevance score
 * (category match weight + color similarity).
 *
 * **Validates: Requirements 3.2, 3.3**
 */

// Valid clothing categories (excluding 'all' which is for filtering, not items)
const validCategories: ClothingCategory[] = ['top', 'bottom', 'dress', 'shoes', 'accessory', 'unknown'];

// Arbitrary for generating valid ClothingCategory
const clothingCategoryArb: fc.Arbitrary<ClothingCategory> = fc.constantFrom(...validCategories);

// Arbitrary for generating color strings
const colorArb: fc.Arbitrary<string> = fc.constantFrom(
  'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'pink', 'purple', 'orange', 'brown',
  'đỏ', 'xanh dương', 'xanh lá', 'vàng', 'đen', 'trắng', 'xám', 'hồng', 'tím', 'cam', 'nâu',
  'navy', 'beige', 'khaki', 'cream', 'coral', 'mint'
);

// Arbitrary for generating ClothingItem (user's wardrobe item)
const clothingItemArb: fc.Arbitrary<ClothingItem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: clothingCategoryArb,
  imageUrl: fc.webUrl(),
  shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
  shopName: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  price: fc.option(fc.string(), { nil: undefined }),
  isFavorite: fc.option(fc.boolean(), { nil: undefined }),
  color: fc.option(colorArb, { nil: undefined }),
  gender: fc.option(fc.constantFrom('male', 'female', 'unisex', 'unknown'), { nil: undefined }),
  style: fc.option(fc.string(), { nil: undefined }),
  pattern: fc.option(fc.string(), { nil: undefined }),
  tags: fc.option(fc.array(fc.string(), { maxLength: 5 }), { nil: undefined }),
});

// Arbitrary for generating ClothingItemInfo (source item from shared outfit)
const clothingItemInfoArb: fc.Arbitrary<ClothingItemInfo> = fc.record({
  name: fc.string({ minLength: 1 }),
  imageUrl: fc.webUrl(),
  shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
  price: fc.option(fc.string(), { nil: undefined }),
  category: fc.option(fc.string(), { nil: undefined }),
  color: fc.option(colorArb, { nil: undefined }),
});

// Arbitrary for generating ClothingItemInfo with a specific normalized category
const clothingItemInfoWithCategoryArb = (category: ClothingCategory): fc.Arbitrary<ClothingItemInfo> => {
  // Map category to possible string representations
  const categoryStrings: Record<ClothingCategory, string[]> = {
    top: ['top', 'áo', 'shirt', 'blouse', 'sweater'],
    bottom: ['bottom', 'quần', 'pants', 'jeans', 'shorts'],
    dress: ['dress', 'váy', 'đầm'],
    shoes: ['shoes', 'giày', 'sneaker', 'boots'],
    accessory: ['accessory', 'phụ kiện', 'bag', 'hat'],
    unknown: ['unknown', 'other', ''],
    all: ['all'],
  };

  return fc.record({
    name: fc.string({ minLength: 1 }),
    imageUrl: fc.webUrl(),
    shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
    price: fc.option(fc.string(), { nil: undefined }),
    category: fc.constantFrom(...categoryStrings[category]),
    color: fc.option(colorArb, { nil: undefined }),
  });
};

describe('findSimilarItems', () => {
  /**
   * **Feature: outfit-try-on-from-feed, Property 4: Similar items search returns same category**
   * **Validates: Requirements 3.2, 3.3**
   *
   * Property: All returned items have the same category as the source item
   */
  it('should return only items with matching category', () => {
    fc.assert(
      fc.property(
        clothingItemInfoArb,
        fc.array(clothingItemArb, { minLength: 0, maxLength: 20 }),
        (sourceItem, userClothing) => {
          const result = findSimilarItems(sourceItem, userClothing);
          const sourceCategory = normalizeCategory(sourceItem.category);

          // Property: All returned items have the same category as the source
          result.forEach((item) => {
            expect(item.category).toBe(sourceCategory);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 4: Similar items search returns same category**
   * **Validates: Requirements 3.2, 3.3**
   *
   * Property: Results are sorted by relevance score (descending)
   */
  it('should return items sorted by relevance score in descending order', () => {
    fc.assert(
      fc.property(
        clothingItemInfoArb,
        fc.array(clothingItemArb, { minLength: 0, maxLength: 20 }),
        (sourceItem, userClothing) => {
          const result = findSimilarItems(sourceItem, userClothing);
          const sourceCategory = normalizeCategory(sourceItem.category);

          // Calculate scores for verification
          const scores = result.map((item) =>
            calculateRelevanceScore(item, sourceCategory, sourceItem.color)
          );

          // Property: Scores are in descending order
          for (let i = 0; i < scores.length - 1; i++) {
            expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 4: Similar items search returns same category**
   * **Validates: Requirements 3.2, 3.3**
   *
   * Property: All matching items from wardrobe are included in results
   */
  it('should include all items from wardrobe that match the category', () => {
    fc.assert(
      fc.property(
        clothingItemInfoArb,
        fc.array(clothingItemArb, { minLength: 0, maxLength: 20 }),
        (sourceItem, userClothing) => {
          const result = findSimilarItems(sourceItem, userClothing);
          const sourceCategory = normalizeCategory(sourceItem.category);

          // Count items in wardrobe with matching category
          const expectedCount = userClothing.filter(
            (item) => item.category === sourceCategory
          ).length;

          // Property: Result count equals the number of matching items in wardrobe
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 4: Similar items search returns same category**
   * **Validates: Requirements 3.2, 3.3**
   *
   * Property: Items with same color as source should rank higher than items with different colors
   */
  it('should rank items with matching color higher', () => {
    fc.assert(
      fc.property(
        colorArb,
        clothingCategoryArb.filter((c) => c !== 'all' && c !== 'unknown'),
        (color, category) => {
          // Create source item with specific color and category
          const sourceItem: ClothingItemInfo = {
            name: 'Test Item',
            imageUrl: 'https://example.com/image.jpg',
            category: category,
            color: color,
          };

          // Create wardrobe with items of same category but different colors
          const matchingColorItem: ClothingItem = {
            id: '1',
            name: 'Matching Color',
            category: category,
            imageUrl: 'https://example.com/1.jpg',
            color: color, // Same color
          };

          const differentColorItem: ClothingItem = {
            id: '2',
            name: 'Different Color',
            category: category,
            imageUrl: 'https://example.com/2.jpg',
            color: color === 'red' ? 'blue' : 'red', // Different color
          };

          const userClothing = [differentColorItem, matchingColorItem];
          const result = findSimilarItems(sourceItem, userClothing);

          // Property: Item with matching color should be first
          if (result.length === 2) {
            expect(result[0].color).toBe(color);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 4: Similar items search returns same category**
   * **Validates: Requirements 3.4**
   *
   * Property: Returns empty array when no items match the category
   */
  it('should return empty array when no items match category', () => {
    fc.assert(
      fc.property(
        clothingCategoryArb.filter((c) => c !== 'all'),
        fc.array(clothingItemArb, { minLength: 0, maxLength: 10 }),
        (sourceCategory, userClothing) => {
          // Filter out items that match the source category
          const wardrobeWithoutCategory = userClothing.filter(
            (item) => item.category !== sourceCategory
          );

          const sourceItem: ClothingItemInfo = {
            name: 'Test',
            imageUrl: 'https://example.com/test.jpg',
            category: sourceCategory,
          };

          const result = findSimilarItems(sourceItem, wardrobeWithoutCategory);

          // Property: Result is empty when no matching items exist
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('calculateColorSimilarity', () => {
  it('should return 1 for exact color match', () => {
    fc.assert(
      fc.property(colorArb, (color) => {
        const similarity = calculateColorSimilarity(color, color);
        expect(similarity).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should return 0 for undefined colors', () => {
    expect(calculateColorSimilarity(undefined, 'red')).toBe(0);
    expect(calculateColorSimilarity('red', undefined)).toBe(0);
    expect(calculateColorSimilarity(undefined, undefined)).toBe(0);
  });
});

describe('normalizeCategory', () => {
  it('should return unknown for undefined or empty category', () => {
    expect(normalizeCategory(undefined)).toBe('unknown');
    expect(normalizeCategory('')).toBe('unknown');
  });

  it('should normalize Vietnamese category names', () => {
    expect(normalizeCategory('áo')).toBe('top');
    expect(normalizeCategory('quần')).toBe('bottom');
    expect(normalizeCategory('váy')).toBe('dress');
    expect(normalizeCategory('giày')).toBe('shoes');
    expect(normalizeCategory('phụ kiện')).toBe('accessory');
  });
});
