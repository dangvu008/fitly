import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock IntersectionObserver for tests
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor() {}
}

beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

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

// Sample outfit data for testing
const mockOutfits = [
  {
    id: 'outfit-1',
    title: 'Test Outfit 1',
    description: 'Test description 1',
    result_image_url: 'https://example.com/image1.jpg',
    likes_count: 100,
    comments_count: 10,
    is_featured: true,
    created_at: '2024-06-15T10:30:00.000Z',
    user_id: 'user-1',
    clothing_items: [],
    user_profile: {
      display_name: 'Test User 1',
      avatar_url: 'https://example.com/avatar1.jpg',
    },
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'outfit-2',
    title: 'Test Outfit 2',
    description: 'Test description 2',
    result_image_url: 'https://example.com/image2.jpg',
    likes_count: 50,
    comments_count: 5,
    is_featured: false,
    created_at: '2024-06-14T10:30:00.000Z',
    user_id: 'user-2',
    clothing_items: [],
    user_profile: {
      display_name: 'Test User 2',
      avatar_url: 'https://example.com/avatar2.jpg',
    },
    isLiked: false,
    isSaved: false,
  },
];

vi.mock('@/hooks/useCommunityFeed', () => ({
  useCommunityFeed: () => ({
    outfits: mockOutfits,
    activeTab: 'explore',
    setActiveTab: vi.fn(),
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    loadMore: vi.fn(),
    refresh: vi.fn(),
    hideOutfit: vi.fn(),
    saveOutfit: vi.fn(),
    unsaveOutfit: vi.fn(),
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

// Import component after mocks
import CommunityFeedPage from './CommunityFeedPage';

/**
 * Unit tests for CommunityFeedPage
 * 
 * Requirements:
 * - 4.5: Community_Page SHALL NOT display the History_Section (differentiating from Home)
 * - 6.2: Filter chips at the top (Trending, Latest, Following)
 */
describe('CommunityFeedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: History section is NOT rendered
   * Requirements 4.5: Community_Page SHALL NOT display the History_Section
   */
  describe('History Section Absence', () => {
    it('should NOT render any history section', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      // Check that history-related elements are NOT present
      expect(screen.queryByTestId('history-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('try-on-history-section')).not.toBeInTheDocument();
      expect(screen.queryByText(/Your Recent Looks/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Lịch sử/i)).not.toBeInTheDocument();
    });

    it('should NOT have any horizontal scroll section for history', () => {
      const { container } = render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      // Check that there's no history-related horizontal scroll
      const historyScrolls = container.querySelectorAll('[data-testid*="history"]');
      expect(historyScrolls.length).toBe(0);
    });
  });

  /**
   * Test: Filter chips are present
   * Requirements 6.2: Filter chips at the top (Trending, Latest, Following)
   */
  describe('Filter Chips', () => {
    it('should render filter chips container', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('filter-chips')).toBeInTheDocument();
    });

    it('should render Trending filter chip', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('filter-trending')).toBeInTheDocument();
      expect(screen.getByText('Trending')).toBeInTheDocument();
    });

    it('should render Latest filter chip', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('filter-latest')).toBeInTheDocument();
      expect(screen.getByText('Mới nhất')).toBeInTheDocument();
    });

    it('should render Following filter chip', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('filter-following')).toBeInTheDocument();
      expect(screen.getByText('Đang theo dõi')).toBeInTheDocument();
    });

    it('should have all three filter chips in the correct order', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      const filterChips = screen.getByTestId('filter-chips');
      const buttons = within(filterChips).getAllByRole('button');
      
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent('Trending');
      expect(buttons[1]).toHaveTextContent('Mới nhất');
      expect(buttons[2]).toHaveTextContent('Đang theo dõi');
    });
  });

  /**
   * Test: Community feed layout is used
   */
  describe('Community Feed Layout', () => {
    it('should render the community feed layout', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('community-feed-layout')).toBeInTheDocument();
    });

    it('should use single-column layout by default', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      const feedLayout = screen.getByTestId('community-feed-layout');
      expect(feedLayout).toHaveAttribute('data-layout', 'single-column');
    });
  });

  /**
   * Test: Page structure
   */
  describe('Page Structure', () => {
    it('should render the page container', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('community-feed-page')).toBeInTheDocument();
    });

    it('should render the page header with title', () => {
      render(
        <BrowserRouter>
          <CommunityFeedPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Cộng đồng')).toBeInTheDocument();
    });
  });
});
