import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { HorizontalScrollSection, OutfitItem } from './HorizontalScrollSection';
import { Flame } from 'lucide-react';

// Mock the LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

/**
 * Property-based tests for HorizontalScrollSection
 * 
 * **Feature: home-community-redesign, Property 2: Horizontal Section Item Count**
 * **Validates: Requirements 2.5**
 */

// Arbitrary for generating valid outfit items
const outfitItemArb: fc.Arbitrary<OutfitItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  result_image_url: fc.webUrl(),
  likes_count: fc.nat({ max: 10000 }),
  comments_count: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
  clothing_items: fc.option(
    fc.array(
      fc.record({
        name: fc.string({ minLength: 1 }),
        imageUrl: fc.webUrl(),
        shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
        price: fc.option(fc.string(), { nil: undefined }),
      }),
      { minLength: 0, maxLength: 5 }
    ),
    { nil: undefined }
  ),
  user_profile: fc.option(
    fc.record({
      display_name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
      avatar_url: fc.option(fc.webUrl(), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  created_at: fc.constant('2024-01-15T10:30:00.000Z'),
  category: fc.option(fc.constantFrom('new', 'trending', 'for_you') as fc.Arbitrary<'new' | 'trending' | 'for_you'>, { nil: undefined }),
});

describe('HorizontalScrollSection', () => {
  /**
   * Property 2: Horizontal Section Item Count
   * 
   * *For any* array of outfit items passed to a HorizontalScrollSection component,
   * the rendered output SHALL display between 6 and 10 items (or all items if fewer than 6 exist).
   * 
   * **Validates: Requirements 2.5**
   */
  describe('Property 2: Horizontal Section Item Count', () => {
    it('should display at most 10 items regardless of input array length', () => {
      fc.assert(
        fc.property(
          fc.array(outfitItemArb, { minLength: 0, maxLength: 50 }),
          (items) => {
            const onItemClick = vi.fn();
            const onTryItem = vi.fn();

            const { container } = render(
              <HorizontalScrollSection
                title="Test Section"
                icon={Flame}
                items={items}
                onItemClick={onItemClick}
                onTryItem={onTryItem}
                data-testid="test-section"
              />
            );

            // Count rendered outfit cards
            const renderedCards = container.querySelectorAll('[data-testid^="outfit-card-"]');
            const renderedCount = renderedCards.length;

            // Property: Rendered count should be at most 10
            expect(renderedCount).toBeLessThanOrEqual(10);

            // Property: If input has items, rendered count should equal min(input.length, 10)
            if (items.length > 0) {
              expect(renderedCount).toBe(Math.min(items.length, 10));
            } else {
              // Empty input should render nothing (component returns null)
              expect(renderedCount).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display all items when fewer than 6 exist', () => {
      fc.assert(
        fc.property(
          fc.array(outfitItemArb, { minLength: 1, maxLength: 5 }),
          (items) => {
            const onItemClick = vi.fn();
            const onTryItem = vi.fn();

            const { container } = render(
              <HorizontalScrollSection
                title="Test Section"
                icon={Flame}
                items={items}
                onItemClick={onItemClick}
                onTryItem={onTryItem}
                data-testid="test-section"
              />
            );

            // Count rendered outfit cards
            const renderedCards = container.querySelectorAll('[data-testid^="outfit-card-"]');
            const renderedCount = renderedCards.length;

            // Property: When fewer than 6 items, all items should be displayed
            expect(renderedCount).toBe(items.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display exactly 10 items when more than 10 are provided', () => {
      fc.assert(
        fc.property(
          fc.array(outfitItemArb, { minLength: 11, maxLength: 30 }),
          (items) => {
            const onItemClick = vi.fn();
            const onTryItem = vi.fn();

            const { container } = render(
              <HorizontalScrollSection
                title="Test Section"
                icon={Flame}
                items={items}
                onItemClick={onItemClick}
                onTryItem={onTryItem}
                data-testid="test-section"
              />
            );

            // Count rendered outfit cards
            const renderedCards = container.querySelectorAll('[data-testid^="outfit-card-"]');
            const renderedCount = renderedCards.length;

            // Property: When more than 10 items provided, exactly 10 should be displayed
            expect(renderedCount).toBe(10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render nothing when items array is empty', () => {
      const onItemClick = vi.fn();
      const onTryItem = vi.fn();

      const { container } = render(
        <HorizontalScrollSection
          title="Test Section"
          icon={Flame}
          items={[]}
          onItemClick={onItemClick}
          onTryItem={onTryItem}
          data-testid="test-section"
        />
      );

      // Property: Empty array should result in no section rendered
      const section = container.querySelector('[data-testid="test-section"]');
      expect(section).toBeNull();
    });
  });
});
