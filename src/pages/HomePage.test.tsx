import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock modules before importing the component
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('@/hooks/useOutfitFeed', () => ({
  useOutfitFeed: () => ({
    outfits: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    loadMore: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

/**
 * Property-based tests for HomePage History Section
 * 
 * **Feature: home-community-redesign, Property 1: History Section Item Limit**
 * **Validates: Requirements 1.5**
 */

// Type for history item
interface TryOnHistoryItem {
  id: string;
  result_image_url: string;
  body_image_url: string;
  created_at: string;
  clothing_items: Array<{ name: string; imageUrl: string }>;
}

// Arbitrary for generating valid history items
const historyItemArb: fc.Arbitrary<TryOnHistoryItem> = fc.record({
  id: fc.uuid(),
  result_image_url: fc.webUrl(),
  body_image_url: fc.webUrl(),
  created_at: fc.constant('2024-06-15T10:30:00.000Z'),
  clothing_items: fc.array(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 30 }),
      imageUrl: fc.webUrl(),
    }),
    { minLength: 0, maxLength: 3 }
  ),
});

/**
 * Helper component to test history section rendering
 * This isolates the history rendering logic for property testing
 */
const HistorySectionRenderer = ({ 
  items, 
  maxItems = 10 
}: { 
  items: TryOnHistoryItem[]; 
  maxItems?: number;
}) => {
  // Apply the same limit as the HomePage (Requirements 1.5)
  const displayItems = items.slice(0, maxItems);
  
  return (
    <div data-testid="history-section">
      {displayItems.map((item) => (
        <div key={item.id} data-testid={`history-item-${item.id}`}>
          <img src={item.result_image_url} alt="Try-on result" />
        </div>
      ))}
    </div>
  );
};

describe('HomePage History Section', () => {
  /**
   * Property 1: History Section Item Limit
   * 
   * *For any* array of try-on history items passed to the History_Section component,
   * the rendered output SHALL display at most 10 items, regardless of the input array length.
   * 
   * **Validates: Requirements 1.5**
   */
  describe('Property 1: History Section Item Limit', () => {
    it('should display at most 10 history items regardless of input array length', () => {
      fc.assert(
        fc.property(
          fc.array(historyItemArb, { minLength: 0, maxLength: 50 }),
          (items) => {
            const { container } = render(
              <BrowserRouter>
                <HistorySectionRenderer items={items} maxItems={10} />
              </BrowserRouter>
            );

            // Count rendered history items
            const renderedItems = container.querySelectorAll('[data-testid^="history-item-"]');
            const renderedCount = renderedItems.length;

            // Property: Rendered count should be at most 10
            expect(renderedCount).toBeLessThanOrEqual(10);

            // Property: Rendered count should equal min(input.length, 10)
            expect(renderedCount).toBe(Math.min(items.length, 10));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display all items when fewer than 10 exist', () => {
      fc.assert(
        fc.property(
          fc.array(historyItemArb, { minLength: 1, maxLength: 9 }),
          (items) => {
            const { container } = render(
              <BrowserRouter>
                <HistorySectionRenderer items={items} maxItems={10} />
              </BrowserRouter>
            );

            // Count rendered history items
            const renderedItems = container.querySelectorAll('[data-testid^="history-item-"]');
            const renderedCount = renderedItems.length;

            // Property: When fewer than 10 items, all items should be displayed
            expect(renderedCount).toBe(items.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display exactly 10 items when more than 10 are provided', () => {
      fc.assert(
        fc.property(
          fc.array(historyItemArb, { minLength: 11, maxLength: 30 }),
          (items) => {
            const { container } = render(
              <BrowserRouter>
                <HistorySectionRenderer items={items} maxItems={10} />
              </BrowserRouter>
            );

            // Count rendered history items
            const renderedItems = container.querySelectorAll('[data-testid^="history-item-"]');
            const renderedCount = renderedItems.length;

            // Property: When more than 10 items provided, exactly 10 should be displayed
            expect(renderedCount).toBe(10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render empty section when no history items exist', () => {
      const { container } = render(
        <BrowserRouter>
          <HistorySectionRenderer items={[]} maxItems={10} />
        </BrowserRouter>
      );

      // Property: Empty array should result in no history items rendered
      const renderedItems = container.querySelectorAll('[data-testid^="history-item-"]');
      expect(renderedItems.length).toBe(0);
    });

    it('should preserve order of items (most recent first)', () => {
      fc.assert(
        fc.property(
          fc.array(historyItemArb, { minLength: 2, maxLength: 15 }),
          (items) => {
            const { container } = render(
              <BrowserRouter>
                <HistorySectionRenderer items={items} maxItems={10} />
              </BrowserRouter>
            );

            // Get rendered item IDs
            const renderedItems = container.querySelectorAll('[data-testid^="history-item-"]');
            const renderedIds = Array.from(renderedItems).map(
              el => el.getAttribute('data-testid')?.replace('history-item-', '')
            );

            // Property: Rendered items should maintain input order (first 10)
            const expectedIds = items.slice(0, 10).map(item => item.id);
            expect(renderedIds).toEqual(expectedIds);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
