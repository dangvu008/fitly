import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TryOutfitDialog } from './TryOutfitDialog';
import { SharedOutfit } from '@/hooks/useOutfitTryOn';

// Mock the hooks and components
vi.mock('@/hooks/useOutfitTryOn', () => ({
  useOutfitTryOn: vi.fn(),
}));

vi.mock('@/hooks/useOutfitAnalysis', () => ({
  useOutfitAnalysis: vi.fn(() => ({
    analyzeOutfit: vi.fn().mockResolvedValue([]),
    isAnalyzing: false,
    error: null,
    analyzedItems: [],
  })),
}));

vi.mock('@/hooks/useTryOnHistory', () => ({
  useTryOnHistory: vi.fn(() => ({
    saveTryOnResult: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-123' },
  })),
}));

vi.mock('@/components/outfit/ShareToPublicDialog', () => ({
  ShareToPublicDialog: () => null,
}));

vi.mock('@/components/auth/LoginRequiredDialog', () => ({
  LoginRequiredDialog: ({ isOpen, onClose, title, description }: { 
    isOpen: boolean; 
    onClose: () => void;
    title?: string;
    description?: string;
  }) => (
    isOpen ? (
      <div data-testid="login-required-dialog">
        <span data-testid="login-dialog-title">{title}</span>
        <span data-testid="login-dialog-description">{description}</span>
        <button onClick={onClose} data-testid="login-dialog-close">Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/tryOn/TryOnCanvas', () => ({
  TryOnCanvas: ({ bodyImageUrl, onBodyImageChange }: { 
    bodyImageUrl?: string; 
    onBodyImageChange?: (url: string) => void 
  }) => (
    <div data-testid="try-on-canvas">
      {bodyImageUrl ? (
        <img src={bodyImageUrl} alt="body" data-testid="body-image" />
      ) : (
        <button 
          data-testid="upload-body-btn"
          onClick={() => onBodyImageChange?.('https://example.com/body.jpg')}
        >
          Upload Body Image
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/tryOn/AIProgressBar', () => ({
  AIProgressBar: ({ isVisible, progress }: { 
    isVisible: boolean; 
    progress: { stage: string; progress: number; message: string } 
  }) => (
    isVisible ? (
      <div data-testid="ai-progress-bar">
        <span data-testid="progress-stage">{progress.stage}</span>
        <span data-testid="progress-value">{progress.progress}%</span>
        <span data-testid="progress-message">{progress.message}</span>
      </div>
    ) : null
  ),
}));

vi.mock('./ClothingItemsGrid', () => ({
  ClothingItemsGrid: ({ items }: { items: unknown[] }) => (
    <div data-testid="clothing-items-grid">
      {items.length} items
    </div>
  ),
}));

import { useOutfitTryOn } from '@/hooks/useOutfitTryOn';
import { useOutfitAnalysis } from '@/hooks/useOutfitAnalysis';

const mockUseOutfitTryOn = useOutfitTryOn as ReturnType<typeof vi.fn>;
const mockUseOutfitAnalysis = useOutfitAnalysis as ReturnType<typeof vi.fn>;

// Sample outfit for testing
const sampleOutfit: SharedOutfit = {
  id: 'outfit-123',
  title: 'Summer Casual',
  description: 'A casual summer outfit',
  result_image_url: 'https://example.com/outfit.jpg',
  likes_count: 10,
  comments_count: 5,
  is_featured: false,
  created_at: '2024-01-15T10:30:00.000Z',
  user_id: 'user-456',
  clothing_items: [
    { name: 'T-Shirt', imageUrl: 'https://example.com/tshirt.jpg' },
    { name: 'Jeans', imageUrl: 'https://example.com/jeans.jpg' },
  ],
};

describe('TryOutfitDialog', () => {
  const defaultMockReturn = {
    startTryOn: vi.fn(),
    isProcessing: false,
    progress: { stage: 'idle', progress: 0, message: '' },
    result: null,
    error: null,
    bodyImage: null,
    setBodyImage: vi.fn(),
    clearResult: vi.fn(),
    cancelProcessing: vi.fn(),
    currentOutfit: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOutfitTryOn.mockReturnValue(defaultMockReturn);
    // Mock useOutfitAnalysis to return analyzed items immediately (not loading)
    mockUseOutfitAnalysis.mockReturnValue({
      analyzeOutfit: vi.fn().mockResolvedValue(sampleOutfit.clothing_items),
      isAnalyzing: false,
      error: null,
      analyzedItems: sampleOutfit.clothing_items,
    });
  });

  /**
   * Test: Dialog opens with body image selector
   * Requirements: 1.2
   */
  describe('Body Image Selection (Requirement 1.2)', () => {
    it('should display body image selector when dialog opens', () => {
      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      // Should show the TryOnCanvas for body image selection
      expect(screen.getByTestId('try-on-canvas')).toBeInTheDocument();
      expect(screen.getByText('Chọn ảnh toàn thân của bạn')).toBeInTheDocument();
    });

    it('should show outfit preview with clothing items', () => {
      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      // Should show outfit title
      expect(screen.getByText('Summer Casual')).toBeInTheDocument();
      // Should show clothing items count
      expect(screen.getByText('2 món đồ')).toBeInTheDocument();
      // Should show clothing items grid
      expect(screen.getByTestId('clothing-items-grid')).toBeInTheDocument();
    });

    it('should disable start button when no body image selected', () => {
      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      const startButton = screen.getByRole('button', { name: /bắt đầu mặc thử/i });
      expect(startButton).toBeDisabled();
    });

    it('should enable start button when body image is selected', () => {
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        bodyImage: 'https://example.com/body.jpg',
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      const startButton = screen.getByRole('button', { name: /bắt đầu mặc thử/i });
      expect(startButton).not.toBeDisabled();
    });
  });

  /**
   * Test: Progress indicator during processing
   * Requirements: 1.4
   */
  describe('Progress Indicator (Requirement 1.4)', () => {
    it('should show progress bar when processing', () => {
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
        progress: { stage: 'processing', progress: 50, message: 'AI đang xử lý...' },
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      expect(screen.getByTestId('ai-progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('progress-stage')).toHaveTextContent('processing');
      expect(screen.getByTestId('progress-value')).toHaveTextContent('50%');
    });

    it('should update dialog title during processing', () => {
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
        progress: { stage: 'processing', progress: 50, message: 'AI đang xử lý...' },
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
    });
  });

  /**
   * Test: Result display on success
   * Requirements: 1.5
   */
  describe('Result Display (Requirement 1.5)', () => {
    it('should display result image when try-on completes', () => {
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        result: {
          id: 'result-123',
          resultImageUrl: 'https://example.com/result.jpg',
          sourceOutfitId: 'outfit-123',
          bodyImageUrl: 'https://example.com/body.jpg',
          clothingItems: sampleOutfit.clothing_items,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      // Should show result image
      const resultImage = screen.getByAltText('Kết quả thử đồ');
      expect(resultImage).toBeInTheDocument();
      expect(resultImage).toHaveAttribute('src', 'https://example.com/result.jpg');
    });

    it('should show action buttons after successful try-on', () => {
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        result: {
          id: 'result-123',
          resultImageUrl: 'https://example.com/result.jpg',
          sourceOutfitId: 'outfit-123',
          bodyImageUrl: 'https://example.com/body.jpg',
          clothingItems: sampleOutfit.clothing_items,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      // Should show retry, download, and save buttons
      expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tải về/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /lưu/i })).toBeInTheDocument();
    });

    it('should show original outfit reference in result view', () => {
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        result: {
          id: 'result-123',
          resultImageUrl: 'https://example.com/result.jpg',
          sourceOutfitId: 'outfit-123',
          bodyImageUrl: 'https://example.com/body.jpg',
          clothingItems: sampleOutfit.clothing_items,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      // Should show reference to original outfit
      expect(screen.getByText('Outfit gốc')).toBeInTheDocument();
      expect(screen.getByText('Summer Casual')).toBeInTheDocument();
    });

    it('should call onSuccess callback when result is available', () => {
      const onSuccess = vi.fn();
      
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        result: {
          id: 'result-123',
          resultImageUrl: 'https://example.com/result.jpg',
          sourceOutfitId: 'outfit-123',
          bodyImageUrl: 'https://example.com/body.jpg',
          clothingItems: sampleOutfit.clothing_items,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
          onSuccess={onSuccess}
        />
      );

      // onSuccess should be called via useEffect when result changes
      expect(onSuccess).toHaveBeenCalledWith('https://example.com/result.jpg');
    });
  });

  /**
   * Test: Error handling on failure
   * Requirements: 1.6
   */
  describe('Error Handling (Requirement 1.6)', () => {
    it('should display error message when try-on fails', () => {
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        error: 'Không thể xử lý hình ảnh. Vui lòng thử lại.',
        bodyImage: 'https://example.com/body.jpg',
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      expect(screen.getByText('Không thể xử lý hình ảnh. Vui lòng thử lại.')).toBeInTheDocument();
    });

    it('should allow retry after error', () => {
      const clearResult = vi.fn();
      
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        error: 'Lỗi xử lý',
        bodyImage: 'https://example.com/body.jpg',
        clearResult,
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      // Start button should still be available for retry
      const startButton = screen.getByRole('button', { name: /bắt đầu mặc thử/i });
      expect(startButton).not.toBeDisabled();
    });
  });

  /**
   * Test: Dialog interactions
   */
  describe('Dialog Interactions', () => {
    it('should call startTryOn when start button is clicked', async () => {
      const startTryOn = vi.fn();
      
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        bodyImage: 'https://example.com/body.jpg',
        startTryOn,
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      const startButton = screen.getByRole('button', { name: /bắt đầu mặc thử/i });
      fireEvent.click(startButton);

      expect(startTryOn).toHaveBeenCalledWith(sampleOutfit);
    });

    it('should call clearResult when retry button is clicked', () => {
      const clearResult = vi.fn();
      
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        result: {
          id: 'result-123',
          resultImageUrl: 'https://example.com/result.jpg',
          sourceOutfitId: 'outfit-123',
          bodyImageUrl: 'https://example.com/body.jpg',
          clothingItems: sampleOutfit.clothing_items,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        clearResult,
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={vi.fn()}
          outfit={sampleOutfit}
        />
      );

      const retryButton = screen.getByRole('button', { name: /thử lại/i });
      fireEvent.click(retryButton);

      expect(clearResult).toHaveBeenCalled();
    });

    it('should cancel processing when dialog is closed during processing', () => {
      const cancelProcessing = vi.fn();
      const onOpenChange = vi.fn();
      
      mockUseOutfitTryOn.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
        progress: { stage: 'processing', progress: 50, message: 'Processing...' },
        cancelProcessing,
      });

      render(
        <TryOutfitDialog
          open={true}
          onOpenChange={onOpenChange}
          outfit={sampleOutfit}
        />
      );

      // Click close button
      const closeButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('svg')
      );
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(cancelProcessing).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
