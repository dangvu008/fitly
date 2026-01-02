import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommunityFeedLayout } from './CommunityFeedLayout';
import { OutfitWithUser } from './CommunityOutfitCard';

/**
 * Unit tests for CommunityFeedLayout component
 * 
 * Requirements:
 * - 4.1: Support single-column layout option (Instagram-style feed)
 * - 4.2: Support Pinterest-style masonry layout with varying heights for 2-column view
 */

// Mock outfit data for testing
const createMockOutfit = (id: string): OutfitWithUser => ({
  id,
  title: `Test Outfit ${id}`,
  description: `Description for outfit ${id}`,
  result_image_url: `https://example.com/outfit-${id}.jpg`,
  likes_count: 42,
  comments_count: 5,
  is_featured: false,
  created_at: '2024-01-15T10:30:00.000Z',
  user_id: `user-${id}`,
  clothing_items: [],
  user_profile: {
    display_name: `User ${id}`,
    avatar_url: `https://example.com/avatar-${id}.jpg`,
  },
  isLiked: false,
  isSaved: false,
});

const mockOutfits: OutfitWithUser[] = [
  createMockOutfit('1'),
  createMockOutfit('2'),
  createMockOutfit('3'),
];

describe('CommunityFeedLayout', () => {
  const defaultProps = {
    outfits: mockOutfits,
    onOutfitClick: vi.fn(),
    onLike: vi.fn(),
    onComment: vi.fn(),
    onTry: vi.fn(),
  };

  describe('Single-column layout - Requirements 4.1', () => {
    it('should render single-column layout with flex-col class', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          layout="single-column"
          data-testid="feed-layout"
        />
      );

      const container = screen.getByTestId('feed-layout');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-col');
      expect(container).toHaveAttribute('data-layout', 'single-column');
    });

    it('should render full-width cards in single-column layout', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          layout="single-column"
          data-testid="feed-layout"
        />
      );

      // Each card should be rendered
      mockOutfits.forEach((outfit) => {
        const card = screen.getByTestId(`outfit-card-${outfit.id}`);
        expect(card).toBeInTheDocument();
        // Single-column cards should have w-full class
        expect(card).toHaveClass('w-full');
      });
    });

    it('should render all outfit cards in single-column layout', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          layout="single-column"
          data-testid="feed-layout"
        />
      );

      // Should render all 3 outfits
      expect(screen.getByTestId('outfit-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('outfit-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('outfit-card-3')).toBeInTheDocument();
    });
  });

  describe('Masonry layout - Requirements 4.2', () => {
    it('should render masonry layout with columns-2 class', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          layout="masonry"
          data-testid="feed-layout"
        />
      );

      const container = screen.getByTestId('feed-layout');
      expect(container).toHaveClass('columns-2');
      expect(container).toHaveAttribute('data-layout', 'masonry');
    });

    it('should render 2-column grid cards in masonry layout', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          layout="masonry"
          data-testid="feed-layout"
        />
      );

      // Each card should be rendered with break-inside-avoid for masonry
      mockOutfits.forEach((outfit) => {
        const card = screen.getByTestId(`outfit-card-${outfit.id}`);
        expect(card).toBeInTheDocument();
        // Masonry cards should have break-inside-avoid class
        expect(card).toHaveClass('break-inside-avoid');
      });
    });

    it('should render all outfit cards in masonry layout', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          layout="masonry"
          data-testid="feed-layout"
        />
      );

      // Should render all 3 outfits
      expect(screen.getByTestId('outfit-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('outfit-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('outfit-card-3')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render empty container when no outfits provided', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          outfits={[]}
          layout="single-column"
          data-testid="feed-layout"
        />
      );

      const container = screen.getByTestId('feed-layout');
      expect(container).toBeInTheDocument();
      expect(container.children).toHaveLength(0);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      render(
        <CommunityFeedLayout
          {...defaultProps}
          layout="single-column"
          className="custom-class"
          data-testid="feed-layout"
        />
      );

      const container = screen.getByTestId('feed-layout');
      expect(container).toHaveClass('custom-class');
    });
  });
});
