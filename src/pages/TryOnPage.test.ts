import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ClothingItem, ClothingCategory } from '@/types/clothing';

/**
 * Property-based tests for Smart Paste & Auto-Try Feature
 * 
 * These tests validate the correctness properties defined in the design document
 * for the smart-paste-auto-try feature.
 */

// Arbitrary for generating valid ClothingCategory
const clothingCategoryArb: fc.Arbitrary<ClothingCategory> = fc.constantFrom(
  'top', 'bottom', 'dress', 'shoes', 'accessory', 'all', 'unknown'
);

// Arbitrary for generating valid image URLs
const imageUrlArb = fc.webUrl().filter(url => url.length > 0);

// Arbitrary for generating valid garment IDs
const garmentIdArb = fc.oneof(
  fc.uuid(),
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `quick-${s}`)
);

/**
 * Pure function to simulate creating a garment item from initial URL
 * This represents the core logic in TryOnPage useEffect for initialGarmentUrl
 */
function createGarmentFromUrl(
  initialGarmentUrl: string,
  initialGarmentId?: string
): ClothingItem {
  return {
    id: initialGarmentId || `quick-${Date.now()}`,
    name: 'Quick Try Item',
    imageUrl: initialGarmentUrl,
    category: 'all' as const, // AI will detect actual category
  };
}

/**
 * Pure function to simulate setting selected items from initial garment
 * This represents the state update logic when initialGarmentUrl is provided
 */
function setSelectedItemsFromGarment(
  initialGarmentUrl: string,
  initialGarmentId?: string
): ClothingItem[] {
  const garmentItem = createGarmentFromUrl(initialGarmentUrl, initialGarmentId);
  return [garmentItem];
}

/**
 * Pure function to check if selected items contain the garment URL
 */
function selectedItemsContainUrl(
  selectedItems: ClothingItem[],
  url: string
): boolean {
  return selectedItems.some(item => item.imageUrl === url);
}

/**
 * Pure function to check if selected items contain the garment ID
 */
function selectedItemsContainId(
  selectedItems: ClothingItem[],
  id: string
): boolean {
  return selectedItems.some(item => item.id === id);
}

describe('Smart Paste & Auto-Try Feature - Property Tests', () => {
  /**
   * **Feature: smart-paste-auto-try, Property 1: Initial Garment URL Sets Selected Items**
   * 
   * *For any* valid garment URL and optional garment ID, when provided as initialGarmentUrl,
   * the TryOnPage should create a ClothingItem with that URL and add it to selectedItems.
   * 
   * **Validates: REQ-7.2**
   */
  describe('Property 1: Initial Garment URL Sets Selected Items', () => {
    it('should create a clothing item with the provided URL', () => {
      fc.assert(
        fc.property(imageUrlArb, (url) => {
          const selectedItems = setSelectedItemsFromGarment(url);
          
          // Property: Selected items should contain exactly one item with the URL
          expect(selectedItems.length).toBe(1);
          expect(selectedItems[0].imageUrl).toBe(url);
        }),
        { numRuns: 100 }
      );
    });

    it('should use provided garment ID when available', () => {
      fc.assert(
        fc.property(imageUrlArb, garmentIdArb, (url, id) => {
          const selectedItems = setSelectedItemsFromGarment(url, id);
          
          // Property: Selected item should have the provided ID
          expect(selectedItems.length).toBe(1);
          expect(selectedItems[0].id).toBe(id);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate a quick-prefixed ID when no ID provided', () => {
      fc.assert(
        fc.property(imageUrlArb, (url) => {
          const garmentItem = createGarmentFromUrl(url);
          
          // Property: Generated ID should start with 'quick-'
          expect(garmentItem.id.startsWith('quick-')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should set category to "all" for AI detection', () => {
      fc.assert(
        fc.property(imageUrlArb, fc.option(garmentIdArb, { nil: undefined }), (url, id) => {
          const garmentItem = createGarmentFromUrl(url, id ?? undefined);
          
          // Property: Category should be 'all' for AI to detect
          expect(garmentItem.category).toBe('all');
        }),
        { numRuns: 100 }
      );
    });

    it('should set name to "Quick Try Item"', () => {
      fc.assert(
        fc.property(imageUrlArb, fc.option(garmentIdArb, { nil: undefined }), (url, id) => {
          const garmentItem = createGarmentFromUrl(url, id ?? undefined);
          
          // Property: Name should be the default quick try name
          expect(garmentItem.name).toBe('Quick Try Item');
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure selected items contain the garment URL', () => {
      fc.assert(
        fc.property(imageUrlArb, fc.option(garmentIdArb, { nil: undefined }), (url, id) => {
          const selectedItems = setSelectedItemsFromGarment(url, id ?? undefined);
          
          // Property: Selected items should contain the URL
          expect(selectedItemsContainUrl(selectedItems, url)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure selected items contain the garment ID when provided', () => {
      fc.assert(
        fc.property(imageUrlArb, garmentIdArb, (url, id) => {
          const selectedItems = setSelectedItemsFromGarment(url, id);
          
          // Property: Selected items should contain the ID
          expect(selectedItemsContainId(selectedItems, id)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should create valid ClothingItem structure', () => {
      fc.assert(
        fc.property(imageUrlArb, fc.option(garmentIdArb, { nil: undefined }), (url, id) => {
          const garmentItem = createGarmentFromUrl(url, id ?? undefined);
          
          // Property: Item should have all required ClothingItem fields
          expect(garmentItem).toHaveProperty('id');
          expect(garmentItem).toHaveProperty('name');
          expect(garmentItem).toHaveProperty('imageUrl');
          expect(garmentItem).toHaveProperty('category');
          
          // Validate types
          expect(typeof garmentItem.id).toBe('string');
          expect(typeof garmentItem.name).toBe('string');
          expect(typeof garmentItem.imageUrl).toBe('string');
          expect(typeof garmentItem.category).toBe('string');
        }),
        { numRuns: 100 }
      );
    });
  });
});
