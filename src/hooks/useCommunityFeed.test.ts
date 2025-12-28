import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SharedOutfit } from './useCommunityFeed';

/**
 * Pure functions extracted from useCommunityFeed for testing
 * These mirror the filtering logic in the hook's useMemo
 */

/**
 * Filter outfits for the Following tab
 * Requirements 1.3: Only show outfits from followed users
 */
export function filterFollowingOutfits(
  outfits: SharedOutfit[],
  followingUserIds: Set<string>
): SharedOutfit[] {
  return outfits.filter(o => followingUserIds.has(o.user_id));
}

/**
 * Sort outfits for the Ranking tab
 * Requirements 1.5: Sort by likes_count descending
 */
export function sortRankingOutfits(outfits: SharedOutfit[]): SharedOutfit[] {
  return [...outfits].sort((a, b) => b.likes_count - a.likes_count);
}

/**
 * Toggle like state for an outfit
 * Requirements 5.1: Toggle like state and update likes_count
 */
export function toggleLikeState(outfit: SharedOutfit): SharedOutfit {
  const wasLiked = outfit.isLiked ?? false;
  return {
    ...outfit,
    isLiked: !wasLiked,
    likes_count: wasLiked ? outfit.likes_count - 1 : outfit.likes_count + 1,
  };
}

// Arbitrary for generating valid ClothingItemInfo
const clothingItemInfoArb = fc.record({
  name: fc.string({ minLength: 1 }),
  imageUrl: fc.webUrl(),
  shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
  price: fc.option(fc.string(), { nil: undefined }),
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
  likes_count: fc.nat({ max: 10000 }),
  comments_count: fc.nat({ max: 1000 }),
  is_featured: fc.boolean(),
  created_at: isoDateStringArb,
  user_id: fc.uuid(),
  clothing_items: fc.array(clothingItemInfoArb, { minLength: 0, maxLength: 5 }),
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

// Arbitrary for generating a list of outfits with specific user_ids
const outfitsWithUserIdsArb = fc.array(sharedOutfitArb, { minLength: 0, maxLength: 20 });

// Arbitrary for generating a set of followed user IDs
const followedUserIdsArb = fc.array(fc.uuid(), { minLength: 0, maxLength: 10 })
  .map(ids => new Set(ids));

describe('useCommunityFeed - Property-Based Tests', () => {
  /**
   * **Feature: community-feed, Property 1: Following tab filters by followed users**
   * 
   * *For any* set of outfits and a set of followed user IDs, the Following tab 
   * should only display outfits where the outfit's user_id is in the followed users set.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 1: Following tab filters by followed users', () => {
    it('should only return outfits from followed users', () => {
      fc.assert(
        fc.property(
          outfitsWithUserIdsArb,
          followedUserIdsArb,
          (outfits, followingUserIds) => {
            const result = filterFollowingOutfits(outfits, followingUserIds);
            
            // Property: Every outfit in result has user_id in followingUserIds
            result.forEach(outfit => {
              expect(followingUserIds.has(outfit.user_id)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all outfits from followed users', () => {
      fc.assert(
        fc.property(
          outfitsWithUserIdsArb,
          followedUserIdsArb,
          (outfits, followingUserIds) => {
            const result = filterFollowingOutfits(outfits, followingUserIds);
            
            // Property: All outfits from followed users are included
            const expectedOutfits = outfits.filter(o => followingUserIds.has(o.user_id));
            expect(result.length).toBe(expectedOutfits.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no followed users', () => {
      fc.assert(
        fc.property(
          outfitsWithUserIdsArb,
          (outfits) => {
            const emptyFollowing = new Set<string>();
            const result = filterFollowingOutfits(outfits, emptyFollowing);
            
            // Property: Empty following set means empty result
            expect(result.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: community-feed, Property 2: Ranking tab sorts by likes descending**
   * 
   * *For any* list of outfits in the Ranking tab, each outfit at index i should 
   * have likes_count >= outfit at index i+1.
   * 
   * **Validates: Requirements 1.5**
   */
  describe('Property 2: Ranking tab sorts by likes descending', () => {
    it('should sort outfits by likes_count in descending order', () => {
      fc.assert(
        fc.property(
          outfitsWithUserIdsArb,
          (outfits) => {
            const result = sortRankingOutfits(outfits);
            
            // Property: For all i, result[i].likes_count >= result[i+1].likes_count
            for (let i = 0; i < result.length - 1; i++) {
              expect(result[i].likes_count).toBeGreaterThanOrEqual(result[i + 1].likes_count);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all outfits after sorting', () => {
      fc.assert(
        fc.property(
          outfitsWithUserIdsArb,
          (outfits) => {
            const result = sortRankingOutfits(outfits);
            
            // Property: Sorting preserves all elements (same length)
            expect(result.length).toBe(outfits.length);
            
            // Property: All original outfit IDs are present in result
            const originalIds = new Set(outfits.map(o => o.id));
            const resultIds = new Set(result.map(o => o.id));
            expect(resultIds).toEqual(originalIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not mutate the original array', () => {
      fc.assert(
        fc.property(
          outfitsWithUserIdsArb,
          (outfits) => {
            const originalOrder = outfits.map(o => o.id);
            sortRankingOutfits(outfits);
            
            // Property: Original array order is unchanged
            const afterOrder = outfits.map(o => o.id);
            expect(afterOrder).toEqual(originalOrder);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: community-feed, Property 6: Like toggle updates state correctly**
   * 
   * *For any* outfit, toggling the like should flip isLiked boolean and adjust 
   * likes_count by +1 (if liking) or -1 (if unliking).
   * 
   * **Validates: Requirements 5.1**
   */
  describe('Property 6: Like toggle updates state correctly', () => {
    it('should flip isLiked boolean when toggling', () => {
      fc.assert(
        fc.property(
          sharedOutfitArb,
          (outfit) => {
            const result = toggleLikeState(outfit);
            const originalLiked = outfit.isLiked ?? false;
            
            // Property: isLiked should be flipped
            expect(result.isLiked).toBe(!originalLiked);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increment likes_count by 1 when liking (isLiked was false)', () => {
      fc.assert(
        fc.property(
          sharedOutfitArb.map(o => ({ ...o, isLiked: false })),
          (outfit) => {
            const result = toggleLikeState(outfit);
            
            // Property: likes_count should increase by 1 when liking
            expect(result.likes_count).toBe(outfit.likes_count + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should decrement likes_count by 1 when unliking (isLiked was true)', () => {
      fc.assert(
        fc.property(
          sharedOutfitArb.map(o => ({ ...o, isLiked: true })),
          (outfit) => {
            const result = toggleLikeState(outfit);
            
            // Property: likes_count should decrease by 1 when unliking
            expect(result.likes_count).toBe(outfit.likes_count - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent when toggled twice (round-trip)', () => {
      fc.assert(
        fc.property(
          sharedOutfitArb,
          (outfit) => {
            const afterFirstToggle = toggleLikeState(outfit);
            const afterSecondToggle = toggleLikeState(afterFirstToggle);
            
            // Property: Double toggle should restore original state
            expect(afterSecondToggle.isLiked).toBe(outfit.isLiked ?? false);
            expect(afterSecondToggle.likes_count).toBe(outfit.likes_count);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all other outfit properties', () => {
      fc.assert(
        fc.property(
          sharedOutfitArb,
          (outfit) => {
            const result = toggleLikeState(outfit);
            
            // Property: All properties except isLiked and likes_count should be unchanged
            expect(result.id).toBe(outfit.id);
            expect(result.title).toBe(outfit.title);
            expect(result.description).toBe(outfit.description);
            expect(result.result_image_url).toBe(outfit.result_image_url);
            expect(result.comments_count).toBe(outfit.comments_count);
            expect(result.is_featured).toBe(outfit.is_featured);
            expect(result.created_at).toBe(outfit.created_at);
            expect(result.user_id).toBe(outfit.user_id);
            expect(result.clothing_items).toEqual(outfit.clothing_items);
            expect(result.isSaved).toBe(outfit.isSaved);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
