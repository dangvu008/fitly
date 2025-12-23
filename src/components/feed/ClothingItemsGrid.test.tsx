import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ClothingItemsGrid } from './ClothingItemsGrid';
import { ClothingItemInfo } from '@/hooks/useOutfitTryOn';

/**
 * **Feature: outfit-try-on-from-feed, Property 2: Clothing items count matches outfit data**
 *
 * *For any* shared outfit with N clothing items in its `clothing_items` array,
 * the ClothingItemsGrid component SHALL render exactly N item components.
 *
 * **Validates: Requirements 2.1**
 */

// Arbitrary for generating valid ClothingItemInfo
const clothingItemInfoArb: fc.Arbitrary<ClothingItemInfo> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  imageUrl: fc.webUrl(),
  shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
  price: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  category: fc.option(fc.string(), { nil: undefined }),
  color: fc.option(fc.string(), { nil: undefined }),
});

// Arbitrary for generating arrays of clothing items (1-10 items for reasonable test performance)
const clothingItemsArrayArb: fc.Arbitrary<ClothingItemInfo[]> = fc.array(
  clothingItemInfoArb,
  { minLength: 1, maxLength: 10 }
);

describe('ClothingItemsGrid - Items Count Property', () => {
  /**
   * **Feature: outfit-try-on-from-feed, Property 2: Clothing items count matches outfit data**
   * **Validates: Requirements 2.1**
   *
   * Property: For any array of N clothing items, the component renders exactly N buttons
   */
  it('should render exactly N item buttons for N clothing items', () => {
    fc.assert(
      fc.property(clothingItemsArrayArb, (items) => {
        const { container } = render(<ClothingItemsGrid items={items} />);
        
        // Each item is rendered as a button element
        const buttons = container.querySelectorAll('button');
        
        // Property: The number of rendered buttons equals the number of items
        expect(buttons.length).toBe(items.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 2: Clothing items count matches outfit data**
   * **Validates: Requirements 2.1**
   *
   * Property: Each rendered item displays its name in the correct position
   */
  it('should display the name of each clothing item', () => {
    fc.assert(
      fc.property(clothingItemsArrayArb, (items) => {
        const { container } = render(<ClothingItemsGrid items={items} />);
        
        // Get all name elements (p tags with truncate class)
        const nameElements = container.querySelectorAll('p.truncate');
        
        // Property: Number of name elements equals number of items
        expect(nameElements.length).toBe(items.length);
        
        // Property: Each name element contains the item's name
        items.forEach((item, index) => {
          expect(nameElements[index].textContent).toBe(item.name);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 2: Clothing items count matches outfit data**
   * **Validates: Requirements 2.1**
   *
   * Property: Each rendered item displays its image with correct src
   */
  it('should render images with correct src for each item', () => {
    fc.assert(
      fc.property(clothingItemsArrayArb, (items) => {
        const { container } = render(<ClothingItemsGrid items={items} />);
        
        const images = container.querySelectorAll('img');
        
        // Property: Number of images equals number of items
        expect(images.length).toBe(items.length);
        
        // Property: Each image has the correct src
        items.forEach((item, index) => {
          expect(images[index].getAttribute('src')).toBe(item.imageUrl);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: outfit-try-on-from-feed, Property 2: Clothing items count matches outfit data**
   * **Validates: Requirements 2.1**
   *
   * Edge case: Empty array renders nothing
   */
  it('should render nothing for empty items array', () => {
    const { container } = render(<ClothingItemsGrid items={[]} />);
    
    // Property: No buttons rendered for empty array
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
