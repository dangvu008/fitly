import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommunityOutfitCard, OutfitWithUser } from './CommunityOutfitCard';

/**
 * Property-based tests for CommunityOutfitCard
 * 
 * **Feature: home-community-redesign, Property 3: Caption Rendering in Community Cards**
 * **Validates: Requirements 3.2**
 */

// Arbitrary for generating valid OutfitWithUser objects
const outfitWithUserArb: fc.Arbitrary<OutfitWithUser> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  result_image_url: fc.webUrl(),
  likes_count: fc.nat({ max: 10000 }),
  comments_count: fc.nat({ max: 1000 }),
  is_featured: fc.boolean(),
  created_at: fc.constant('2024-01-15T10:30:00.000Z'),
  user_id: fc.uuid(),
  clothing_items: fc.array(
    fc.record({
      name: fc.string({ minLength: 1 }),
      imageUrl: fc.webUrl(),
      shopUrl: fc.option(fc.webUrl(), { nil: undefined }),
      price: fc.option(fc.string(), { nil: undefined }),
    }),
    { minLength: 0, maxLength: 5 }
  ),
  user_profile: fc.record({
    display_name: fc.string({ minLength: 1, maxLength: 30 }),
    avatar_url: fc.option(fc.webUrl(), { nil: null }),
    followers_count: fc.option(fc.nat({ max: 100000 }), { nil: undefined }),
  }),
  isLiked: fc.option(fc.boolean(), { nil: undefined }),
  isSaved: fc.option(fc.boolean(), { nil: undefined }),
});

// Arbitrary for generating outfits with non-null descriptions
const outfitWithDescriptionArb: fc.Arbitrary<OutfitWithUser> = outfitWithUserArb.map(
  (outfit) => ({
    ...outfit,
    description: outfit.description || 'Default description for testing',
  })
);

describe('CommunityOutfitCard', () => {
  /**
   * Property 3: Caption Rendering in Community Cards
   * 
   * *For any* OutfitWithUser object with a non-null description,
   * the CommunityOutfitCard component SHALL render the caption text,
   * truncated to at most 3 lines.
   * 
   * **Validates: Requirements 3.2**
   */
  describe('Property 3: Caption Rendering in Community Cards', () => {
    it('should render caption text when description is non-null', () => {
      fc.assert(
        fc.property(outfitWithDescriptionArb, (outfit) => {
          const onLike = vi.fn();
          const onComment = vi.fn();
          const onTry = vi.fn();
          const onClick = vi.fn();

          const { container } = render(
            <CommunityOutfitCard
              outfit={outfit}
              onLike={onLike}
              onComment={onComment}
              onTry={onTry}
              onClick={onClick}
              layout="single-column"
              data-testid="community-card"
            />
          );

          // Property: Caption element should be rendered when description exists
          const captionElement = container.querySelector('[data-testid="caption"]');
          expect(captionElement).not.toBeNull();

          // Property: Caption should contain the description text
          expect(captionElement?.textContent).toContain(outfit.description);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply line-clamp-3 truncation to caption', () => {
      fc.assert(
        fc.property(outfitWithDescriptionArb, (outfit) => {
          const onLike = vi.fn();
          const onComment = vi.fn();
          const onTry = vi.fn();
          const onClick = vi.fn();

          const { container } = render(
            <CommunityOutfitCard
              outfit={outfit}
              onLike={onLike}
              onComment={onComment}
              onTry={onTry}
              onClick={onClick}
              layout="single-column"
              data-testid="community-card"
            />
          );

          const captionElement = container.querySelector('[data-testid="caption"]');
          
          // Property: Caption should have line-clamp-3 class for truncation
          expect(captionElement?.className).toContain('line-clamp-3');
          
          // Property: Caption should have webkit line clamp style set to 3
          const style = captionElement?.getAttribute('style');
          expect(style).toContain('-webkit-line-clamp: 3');
        }),
        { numRuns: 100 }
      );
    });

    it('should not render caption when description is null', () => {
      fc.assert(
        fc.property(
          outfitWithUserArb.map((outfit) => ({ ...outfit, description: null })),
          (outfit) => {
            const onLike = vi.fn();
            const onComment = vi.fn();
            const onTry = vi.fn();
            const onClick = vi.fn();

            const { container } = render(
              <CommunityOutfitCard
                outfit={outfit}
                onLike={onLike}
                onComment={onComment}
                onTry={onTry}
                onClick={onClick}
                layout="single-column"
                data-testid="community-card"
              />
            );

            // Property: Caption element should NOT be rendered when description is null
            const captionElement = container.querySelector('[data-testid="caption"]');
            expect(captionElement).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include user display name in caption', () => {
      fc.assert(
        fc.property(outfitWithDescriptionArb, (outfit) => {
          const onLike = vi.fn();
          const onComment = vi.fn();
          const onTry = vi.fn();
          const onClick = vi.fn();

          const { container } = render(
            <CommunityOutfitCard
              outfit={outfit}
              onLike={onLike}
              onComment={onComment}
              onTry={onTry}
              onClick={onClick}
              layout="single-column"
              data-testid="community-card"
            />
          );

          const captionElement = container.querySelector('[data-testid="caption"]');
          
          // Property: Caption should include the user's display name
          expect(captionElement?.textContent).toContain(outfit.user_profile.display_name);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit tests for CommunityOutfitCard', () => {
    const mockOutfit: OutfitWithUser = {
      id: 'test-outfit-1',
      title: 'Summer Casual Look',
      description: 'This is a beautiful summer outfit perfect for beach days! 🌴',
      result_image_url: 'https://example.com/outfit.jpg',
      likes_count: 42,
      comments_count: 5,
      is_featured: false,
      created_at: '2024-01-15T10:30:00.000Z',
      user_id: 'user-123',
      clothing_items: [],
      user_profile: {
        display_name: 'TestUser',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      isLiked: false,
      isSaved: false,
    };

    describe('User avatar display - Requirements 3.1, 5.3', () => {
      it('should render larger user avatar (32px) at the top', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        const { container } = render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        // Avatar should be 32px (w-8 h-8 = 2rem = 32px)
        const avatarContainer = container.querySelector('.w-8.h-8');
        expect(avatarContainer).toBeInTheDocument();
      });

      it('should display user display name prominently', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        // User name appears in header and caption, so use getAllByText
        const userNames = screen.getAllByText('TestUser');
        expect(userNames.length).toBeGreaterThanOrEqual(1);
        // First occurrence should be in the header
        expect(userNames[0]).toBeInTheDocument();
      });
    });

    describe('Try button - Requirements 3.3, 5.2', () => {
      it('should render small outline "Try" button', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        const tryButton = screen.getByTestId('try-button');
        expect(tryButton).toBeInTheDocument();
        expect(tryButton).toHaveTextContent('Try');
        // Should be outline variant (not gradient like Home card)
        expect(tryButton.className).toContain('border');
        expect(tryButton.className).not.toContain('bg-gradient');
      });

      it('should call onTry when Try button is clicked', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        const tryButton = screen.getByTestId('try-button');
        fireEvent.click(tryButton);

        expect(onTry).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
      });
    });

    describe('Like and comment interactions', () => {
      it('should call onLike when like button is clicked', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        const likeButton = screen.getByRole('button', { name: /like/i });
        fireEvent.click(likeButton);

        expect(onLike).toHaveBeenCalledTimes(1);
      });

      it('should call onComment when comment button is clicked', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        // Use aria-label to get the specific comment icon button
        const commentButton = screen.getByRole('button', { name: 'Comment' });
        fireEvent.click(commentButton);

        expect(onComment).toHaveBeenCalledTimes(1);
      });

      it('should display likes count', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        expect(screen.getByText('42 likes')).toBeInTheDocument();
      });

      it('should display comments count when greater than 0', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        expect(screen.getByText('5 comments')).toBeInTheDocument();
      });
    });

    describe('Layout variants', () => {
      it('should apply single-column layout with 4:5 aspect ratio', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        const { container } = render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
            data-testid="single-column-card"
          />
        );

        const card = screen.getByTestId('single-column-card');
        expect(card.className).toContain('w-full');

        // Image should have 4:5 aspect ratio
        const imageButton = container.querySelector('button.aspect-\\[4\\/5\\]');
        expect(imageButton).toBeInTheDocument();
      });

      it('should apply masonry layout with 1:1 aspect ratio', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        const { container } = render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="masonry"
            data-testid="masonry-card"
          />
        );

        const card = screen.getByTestId('masonry-card');
        expect(card.className).toContain('break-inside-avoid');

        // Image should have 1:1 aspect ratio
        const imageButton = container.querySelector('button.aspect-square');
        expect(imageButton).toBeInTheDocument();
      });
    });

    describe('Featured badge', () => {
      it('should display featured badge when is_featured is true', () => {
        const featuredOutfit: OutfitWithUser = {
          ...mockOutfit,
          is_featured: true,
        };

        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={featuredOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        expect(screen.getByText('✨ Featured')).toBeInTheDocument();
      });

      it('should not display featured badge when is_featured is false', () => {
        const onLike = vi.fn();
        const onComment = vi.fn();
        const onTry = vi.fn();
        const onClick = vi.fn();

        render(
          <CommunityOutfitCard
            outfit={mockOutfit}
            onLike={onLike}
            onComment={onComment}
            onTry={onTry}
            onClick={onClick}
            layout="single-column"
          />
        );

        expect(screen.queryByText('✨ Featured')).not.toBeInTheDocument();
      });
    });
  });
});
