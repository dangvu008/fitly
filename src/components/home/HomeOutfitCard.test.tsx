import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeOutfitCard, OutfitItem } from './HomeOutfitCard';

// Mock the LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key === 'try_this' ? 'Try This' : key,
    language: 'en',
  }),
}));

/**
 * Unit tests for HomeOutfitCard component
 * 
 * **Validates: Requirements 5.1**
 * - Test gradient button presence
 * - Test click handlers
 */

const mockOutfit: OutfitItem = {
  id: 'test-outfit-1',
  title: 'Summer Casual Look',
  result_image_url: 'https://example.com/outfit.jpg',
  likes_count: 42,
  comments_count: 5,
  user_profile: {
    display_name: 'TestUser',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  created_at: '2024-01-15T10:30:00.000Z',
  category: 'trending',
};

describe('HomeOutfitCard', () => {
  describe('Gradient button presence - Requirements 5.1', () => {
    it('should render the "Try This" button with gradient styling', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
          data-testid="home-outfit-card"
        />
      );

      const tryButton = screen.getByTestId('try-button');
      expect(tryButton).toBeInTheDocument();
      expect(tryButton).toHaveTextContent('Try This');
      // Check gradient class is applied
      expect(tryButton.className).toContain('bg-gradient-to-r');
      expect(tryButton.className).toContain('from-primary');
      expect(tryButton.className).toContain('to-accent');
    });

    it('should render the lightning emoji icon in the button', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="grid"
        />
      );

      const tryButton = screen.getByTestId('try-button');
      expect(tryButton).toHaveTextContent('⚡');
    });
  });

  describe('Click handlers', () => {
    it('should call onTry when "Try This" button is clicked', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      const tryButton = screen.getByTestId('try-button');
      fireEvent.click(tryButton);

      expect(onTry).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should call onClick when card image area is clicked', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      const imageButton = screen.getByRole('button', { name: /view summer casual look/i });
      fireEvent.click(imageButton);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onTry).not.toHaveBeenCalled();
    });

    it('should not propagate click from Try button to card', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="grid"
        />
      );

      const tryButton = screen.getByTestId('try-button');
      fireEvent.click(tryButton);

      // Only onTry should be called, not onClick
      expect(onTry).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Card variants', () => {
    it('should apply horizontal variant styles', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
          data-testid="horizontal-card"
        />
      );

      const card = screen.getByTestId('horizontal-card');
      expect(card.className).toContain('flex-shrink-0');
      expect(card.className).toContain('w-40');
    });

    it('should apply grid variant styles', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="grid"
          data-testid="grid-card"
        />
      );

      const card = screen.getByTestId('grid-card');
      expect(card.className).toContain('w-full');
      expect(card.className).not.toContain('flex-shrink-0');
    });
  });

  describe('User avatar display - Requirements 5.5', () => {
    it('should render user avatar when user_profile is provided', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      const { container } = render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      // Avatar container should be present with 24px size (w-6 h-6 = 1.5rem = 24px)
      const avatarContainer = container.querySelector('.w-6.h-6');
      expect(avatarContainer).toBeInTheDocument();
    });

    it('should render fallback initial when avatar_url is not provided', () => {
      const outfitWithoutAvatar: OutfitItem = {
        ...mockOutfit,
        user_profile: {
          display_name: 'NoAvatar',
          avatar_url: undefined,
        },
      };

      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={outfitWithoutAvatar}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      // Fallback should show first letter
      expect(screen.getByText('N')).toBeInTheDocument();
    });

    it('should not render avatar section when user_profile is not provided', () => {
      const outfitWithoutProfile: OutfitItem = {
        ...mockOutfit,
        user_profile: undefined,
      };

      const onTry = vi.fn();
      const onClick = vi.fn();

      const { container } = render(
        <HomeOutfitCard
          outfit={outfitWithoutProfile}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      // No avatar element should be present
      const avatarContainer = container.querySelector('.w-6.h-6');
      expect(avatarContainer).toBeNull();
    });
  });

  describe('Content display', () => {
    it('should display outfit title', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      expect(screen.getByText('Summer Casual Look')).toBeInTheDocument();
    });

    it('should display likes count', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      expect(screen.getByText(/❤️ 42/)).toBeInTheDocument();
    });

    it('should display comments count when provided', () => {
      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={mockOutfit}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      expect(screen.getByText(/💬 5/)).toBeInTheDocument();
    });

    it('should not display comments when count is 0', () => {
      const outfitNoComments: OutfitItem = {
        ...mockOutfit,
        comments_count: 0,
      };

      const onTry = vi.fn();
      const onClick = vi.fn();

      render(
        <HomeOutfitCard
          outfit={outfitNoComments}
          onTry={onTry}
          onClick={onClick}
          variant="horizontal"
        />
      );

      expect(screen.queryByText(/💬/)).not.toBeInTheDocument();
    });
  });
});
