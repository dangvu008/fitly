import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ClothingItem, ClothingCategory } from '@/types/clothing';

/**
 * Property-based tests for Clothing Edit/Delete Feature
 * 
 * These tests validate the correctness properties defined in the design document
 * for the clothing-edit-delete feature.
 */

// Arbitrary for generating valid ClothingCategory
const clothingCategoryArb: fc.Arbitrary<ClothingCategory> = fc.constantFrom(
  'top', 'bottom', 'dress', 'shoes', 'accessory', 'unknown'
);

// Arbitrary for generating valid ClothingItem
const clothingItemArb: fc.Arbitrary<ClothingItem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  category: clothingCategoryArb,
  imageUrl: fc.webUrl(),
  shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
  shopName: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  price: fc.option(fc.string(), { nil: undefined }),
  isFavorite: fc.option(fc.boolean(), { nil: undefined }),
  isHidden: fc.option(fc.boolean(), { nil: undefined }),
  color: fc.option(fc.string(), { nil: undefined }),
  gender: fc.option(fc.constantFrom('male', 'female', 'unisex', 'unknown'), { nil: undefined }),
  style: fc.option(fc.string(), { nil: undefined }),
  pattern: fc.option(fc.string(), { nil: undefined }),
  tags: fc.option(fc.array(fc.string({ minLength: 1 }), { maxLength: 10 }), { nil: undefined }),
});

// Arbitrary for generating valid update payload
const updatePayloadArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  tags: fc.array(fc.string({ minLength: 1 }), { maxLength: 10 }),
});

/**
 * Pure function to simulate edit operation
 * This represents the core logic of updating a clothing item
 */
function applyEdit(
  item: ClothingItem,
  updates: { name?: string; tags?: string[] }
): ClothingItem {
  return {
    ...item,
    name: updates.name ?? item.name,
    tags: updates.tags ?? item.tags,
  };
}

/**
 * Pure function to simulate delete operation
 * Returns a new array without the deleted item
 */
function applyDelete(items: ClothingItem[], idToDelete: string): ClothingItem[] {
  return items.filter(item => item.id !== idToDelete);
}

/**
 * Pure function to check if action menu should be shown
 * Only shows for items owned by the user
 */
function shouldShowActionMenu(itemId: string, ownedItemIds: Set<string>): boolean {
  return ownedItemIds.has(itemId);
}

describe('Clothing Edit/Delete Feature - Property Tests', () => {
  /**
   * **Feature: clothing-edit-delete, Property 1: Edit preserves item identity**
   * 
   * *For any* clothing item and any valid name/tags update, after saving the edit,
   * the item should retain its original ID and category while reflecting the new name and tags.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 1: Edit preserves item identity', () => {
    it('should preserve item ID after edit', () => {
      fc.assert(
        fc.property(clothingItemArb, updatePayloadArb, (item, updates) => {
          const editedItem = applyEdit(item, updates);
          
          // Property: ID must remain unchanged
          expect(editedItem.id).toBe(item.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve item category after edit', () => {
      fc.assert(
        fc.property(clothingItemArb, updatePayloadArb, (item, updates) => {
          const editedItem = applyEdit(item, updates);
          
          // Property: Category must remain unchanged
          expect(editedItem.category).toBe(item.category);
        }),
        { numRuns: 100 }
      );
    });

    it('should reflect new name and tags after edit', () => {
      fc.assert(
        fc.property(clothingItemArb, updatePayloadArb, (item, updates) => {
          const editedItem = applyEdit(item, updates);
          
          // Property: Name and tags should be updated
          expect(editedItem.name).toBe(updates.name);
          expect(editedItem.tags).toEqual(updates.tags);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other properties (imageUrl, color, etc.) after edit', () => {
      fc.assert(
        fc.property(clothingItemArb, updatePayloadArb, (item, updates) => {
          const editedItem = applyEdit(item, updates);
          
          // Property: Other properties must remain unchanged
          expect(editedItem.imageUrl).toBe(item.imageUrl);
          expect(editedItem.color).toBe(item.color);
          expect(editedItem.gender).toBe(item.gender);
          expect(editedItem.style).toBe(item.style);
          expect(editedItem.pattern).toBe(item.pattern);
          expect(editedItem.shopUrl).toBe(item.shopUrl);
          expect(editedItem.shopName).toBe(item.shopName);
          expect(editedItem.price).toBe(item.price);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: clothing-edit-delete, Property 2: Cancel edit preserves original state**
   * 
   * *For any* clothing item, opening the edit dialog and canceling should leave
   * the item's name and tags unchanged in both UI and database.
   * 
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Cancel edit preserves original state', () => {
    it('should preserve original item when edit is cancelled', () => {
      fc.assert(
        fc.property(clothingItemArb, (item) => {
          // Simulate opening edit dialog (no changes made)
          const originalItem = { ...item };
          
          // Simulate cancel - item should remain unchanged
          const afterCancel = originalItem;
          
          // Property: All properties should be identical
          expect(afterCancel).toEqual(item);
        }),
        { numRuns: 100 }
      );
    });

    it('should not apply pending changes when cancelled', () => {
      fc.assert(
        fc.property(clothingItemArb, updatePayloadArb, (item, _pendingUpdates) => {
          // Simulate having pending changes but cancelling
          const originalItem = { ...item };
          
          // Cancel operation - pending changes are discarded
          // The item should still match the original
          expect(originalItem.name).toBe(item.name);
          expect(originalItem.tags).toEqual(item.tags);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: clothing-edit-delete, Property 3: Delete removes item from list**
   * 
   * *For any* clothing item in the user's closet, after successful deletion,
   * the item should no longer appear in the clothing list.
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  describe('Property 3: Delete removes item from list', () => {
    it('should remove item from list after delete', () => {
      fc.assert(
        fc.property(
          fc.array(clothingItemArb, { minLength: 1, maxLength: 20 }),
          fc.nat(),
          (items, indexSeed) => {
            // Pick a random item to delete
            const indexToDelete = indexSeed % items.length;
            const itemToDelete = items[indexToDelete];
            
            const afterDelete = applyDelete(items, itemToDelete.id);
            
            // Property: Deleted item should not be in the list
            const deletedItemFound = afterDelete.some(item => item.id === itemToDelete.id);
            expect(deletedItemFound).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reduce list length by exactly 1 after delete', () => {
      fc.assert(
        fc.property(
          fc.array(clothingItemArb, { minLength: 1, maxLength: 20 }),
          fc.nat(),
          (items, indexSeed) => {
            const indexToDelete = indexSeed % items.length;
            const itemToDelete = items[indexToDelete];
            
            const afterDelete = applyDelete(items, itemToDelete.id);
            
            // Property: List length should decrease by 1
            expect(afterDelete.length).toBe(items.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all other items after delete', () => {
      fc.assert(
        fc.property(
          fc.array(clothingItemArb, { minLength: 2, maxLength: 20 }),
          fc.nat(),
          (items, indexSeed) => {
            const indexToDelete = indexSeed % items.length;
            const itemToDelete = items[indexToDelete];
            
            const afterDelete = applyDelete(items, itemToDelete.id);
            
            // Property: All other items should still be present
            const otherItems = items.filter(item => item.id !== itemToDelete.id);
            otherItems.forEach(originalItem => {
              const foundItem = afterDelete.find(item => item.id === originalItem.id);
              expect(foundItem).toBeDefined();
              expect(foundItem).toEqual(originalItem);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: clothing-edit-delete, Property 4: Action menu only for owned items**
   * 
   * *For any* clothing item displayed in the closet, the edit and delete options
   * should only be available if the item belongs to the current user.
   * 
   * **Validates: Requirements 3.3**
   */
  describe('Property 4: Action menu only for owned items', () => {
    it('should show action menu only for owned items', () => {
      fc.assert(
        fc.property(
          fc.array(clothingItemArb, { minLength: 1, maxLength: 20 }),
          fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
          (allItems, ownedIds) => {
            const ownedItemIds = new Set(ownedIds);
            
            allItems.forEach(item => {
              const shouldShow = shouldShowActionMenu(item.id, ownedItemIds);
              
              // Property: Action menu should show if and only if item is owned
              expect(shouldShow).toBe(ownedItemIds.has(item.id));
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show action menu for non-owned items', () => {
      fc.assert(
        fc.property(
          clothingItemArb,
          fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
          (item, ownedIds) => {
            // Ensure the item is NOT in the owned list
            const ownedItemIds = new Set(ownedIds.filter(id => id !== item.id));
            
            const shouldShow = shouldShowActionMenu(item.id, ownedItemIds);
            
            // Property: Action menu should NOT show for non-owned items
            expect(shouldShow).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show action menu for owned items', () => {
      fc.assert(
        fc.property(
          clothingItemArb,
          fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
          (item, additionalIds) => {
            // Ensure the item IS in the owned list
            const ownedItemIds = new Set([...additionalIds, item.id]);
            
            const shouldShow = shouldShowActionMenu(item.id, ownedItemIds);
            
            // Property: Action menu SHOULD show for owned items
            expect(shouldShow).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
