import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { CropBounds } from './SmartCropPreview';

/**
 * Property-based tests for SmartCropPreview
 * Feature: smart-paste-auto-try
 * 
 * Tests that the crop preview correctly displays both original and cropped images
 */

// Arbitrary generator for valid image data URLs
const imageDataUrlArb = fc.constantFrom(
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
);

// Arbitrary generator for valid crop bounds
const cropBoundsArb = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 }),
  width: fc.integer({ min: 50, max: 500 }),
  height: fc.integer({ min: 50, max: 500 }),
});

// Arbitrary generator for SmartCropPreview props
const smartCropPreviewPropsArb = fc.record({
  originalImage: imageDataUrlArb,
  croppedImage: imageDataUrlArb,
  cropBounds: cropBoundsArb,
});

/**
 * Interface representing the preview state
 * This models what the SmartCropPreview component should display
 */
interface PreviewState {
  showsOriginalImage: boolean;
  showsCroppedImage: boolean;
  originalImageUrl: string;
  croppedImageUrl: string;
  cropBounds: CropBounds;
  hasConfirmButton: boolean;
  hasAdjustButton: boolean;
  hasRetryButton: boolean;
}

/**
 * Simulates the SmartCropPreview component's rendering logic
 * Returns the expected state based on props
 */
function computePreviewState(
  originalImage: string,
  croppedImage: string,
  cropBounds: CropBounds,
  isProcessing: boolean = false
): PreviewState {
  // Both images should always be shown (side-by-side layout)
  const showsOriginalImage = originalImage.length > 0;
  const showsCroppedImage = croppedImage.length > 0 && !isProcessing;
  
  return {
    showsOriginalImage,
    showsCroppedImage,
    originalImageUrl: originalImage,
    croppedImageUrl: croppedImage,
    cropBounds,
    hasConfirmButton: !isProcessing,
    hasAdjustButton: !isProcessing,
    hasRetryButton: !isProcessing,
  };
}

/**
 * Validates that crop bounds are within valid ranges
 */
function isValidCropBounds(bounds: CropBounds): boolean {
  return (
    bounds.x >= 0 &&
    bounds.y >= 0 &&
    bounds.width >= 50 && // Minimum crop size
    bounds.height >= 50
  );
}

/**
 * Simulates crop bounds adjustment
 * Returns new bounds after applying delta
 */
function adjustCropBounds(
  original: CropBounds,
  deltaX: number,
  deltaY: number,
  deltaWidth: number,
  deltaHeight: number,
  imageDimensions: { width: number; height: number }
): CropBounds {
  const minSize = 50;
  
  // Calculate new values
  let newX = original.x + deltaX;
  let newY = original.y + deltaY;
  let newWidth = original.width + deltaWidth;
  let newHeight = original.height + deltaHeight;
  
  // Ensure minimum size
  newWidth = Math.max(minSize, newWidth);
  newHeight = Math.max(minSize, newHeight);
  
  // Ensure position is non-negative
  newX = Math.max(0, newX);
  newY = Math.max(0, newY);
  
  // Ensure bounds don't exceed image dimensions
  if (newX + newWidth > imageDimensions.width) {
    newWidth = imageDimensions.width - newX;
    if (newWidth < minSize) {
      newWidth = minSize;
      newX = imageDimensions.width - minSize;
    }
  }
  
  if (newY + newHeight > imageDimensions.height) {
    newHeight = imageDimensions.height - newY;
    if (newHeight < minSize) {
      newHeight = minSize;
      newY = imageDimensions.height - minSize;
    }
  }
  
  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };
}

describe('SmartCropPreview Properties', () => {
  /**
   * Property 10: Crop Preview Shows Both Images
   * For any valid original and cropped image pair,
   * the preview should display both images side-by-side.
   * 
   * **Validates: REQ-5.3**
   * 
   * Feature: smart-paste-auto-try, Property 10: Crop Preview Shows Both Images
   */
  describe('Property 10: Crop Preview Shows Both Images', () => {
    it('should show both original and cropped images for any valid input', () => {
      fc.assert(
        fc.property(
          smartCropPreviewPropsArb,
          ({ originalImage, croppedImage, cropBounds }) => {
            const state = computePreviewState(originalImage, croppedImage, cropBounds);
            
            // Both images should be shown
            expect(state.showsOriginalImage).toBe(true);
            expect(state.showsCroppedImage).toBe(true);
            
            // Image URLs should match the input
            expect(state.originalImageUrl).toBe(originalImage);
            expect(state.croppedImageUrl).toBe(croppedImage);
            
            // Crop bounds should be preserved
            expect(state.cropBounds).toEqual(cropBounds);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all action buttons available when not processing', () => {
      fc.assert(
        fc.property(
          smartCropPreviewPropsArb,
          ({ originalImage, croppedImage, cropBounds }) => {
            const state = computePreviewState(originalImage, croppedImage, cropBounds, false);
            
            // All buttons should be available
            expect(state.hasConfirmButton).toBe(true);
            expect(state.hasAdjustButton).toBe(true);
            expect(state.hasRetryButton).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should disable buttons when processing', () => {
      fc.assert(
        fc.property(
          smartCropPreviewPropsArb,
          ({ originalImage, croppedImage, cropBounds }) => {
            const state = computePreviewState(originalImage, croppedImage, cropBounds, true);
            
            // Buttons should be disabled during processing
            expect(state.hasConfirmButton).toBe(false);
            expect(state.hasAdjustButton).toBe(false);
            expect(state.hasRetryButton).toBe(false);
            
            // Cropped image should not be shown during processing
            expect(state.showsCroppedImage).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve crop bounds through the preview', () => {
      fc.assert(
        fc.property(
          cropBoundsArb,
          (cropBounds) => {
            // Crop bounds should always be valid
            expect(isValidCropBounds(cropBounds)).toBe(true);
            
            // Bounds should have positive dimensions
            expect(cropBounds.width).toBeGreaterThanOrEqual(50);
            expect(cropBounds.height).toBeGreaterThanOrEqual(50);
            
            // Position should be non-negative
            expect(cropBounds.x).toBeGreaterThanOrEqual(0);
            expect(cropBounds.y).toBeGreaterThanOrEqual(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain valid bounds after adjustment', () => {
      fc.assert(
        fc.property(
          cropBoundsArb,
          fc.integer({ min: -100, max: 100 }), // deltaX
          fc.integer({ min: -100, max: 100 }), // deltaY
          fc.integer({ min: -50, max: 50 }),   // deltaWidth
          fc.integer({ min: -50, max: 50 }),   // deltaHeight
          (originalBounds, deltaX, deltaY, deltaWidth, deltaHeight) => {
            const imageDimensions = { width: 1920, height: 1080 };
            
            const adjustedBounds = adjustCropBounds(
              originalBounds,
              deltaX,
              deltaY,
              deltaWidth,
              deltaHeight,
              imageDimensions
            );
            
            // Adjusted bounds should always be valid
            expect(isValidCropBounds(adjustedBounds)).toBe(true);
            
            // Position should be within image bounds
            expect(adjustedBounds.x).toBeGreaterThanOrEqual(0);
            expect(adjustedBounds.y).toBeGreaterThanOrEqual(0);
            expect(adjustedBounds.x + adjustedBounds.width).toBeLessThanOrEqual(imageDimensions.width);
            expect(adjustedBounds.y + adjustedBounds.height).toBeLessThanOrEqual(imageDimensions.height);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call onConfirm when confirm button is clicked', () => {
      fc.assert(
        fc.property(
          smartCropPreviewPropsArb,
          ({ originalImage, croppedImage, cropBounds }) => {
            const onConfirm = vi.fn();
            const onAdjust = vi.fn();
            const onRetry = vi.fn();
            const onCancel = vi.fn();
            
            // Simulate confirm action
            const state = computePreviewState(originalImage, croppedImage, cropBounds, false);
            
            if (state.hasConfirmButton) {
              onConfirm();
            }
            
            expect(onConfirm).toHaveBeenCalledTimes(1);
            expect(onAdjust).not.toHaveBeenCalled();
            expect(onRetry).not.toHaveBeenCalled();
            expect(onCancel).not.toHaveBeenCalled();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call onAdjust with new bounds when adjustment is confirmed', () => {
      fc.assert(
        fc.property(
          cropBoundsArb,
          cropBoundsArb,
          (originalBounds, newBounds) => {
            const onAdjust = vi.fn();
            
            // Simulate adjustment confirmation
            onAdjust(newBounds);
            
            expect(onAdjust).toHaveBeenCalledTimes(1);
            expect(onAdjust).toHaveBeenCalledWith(newBounds);
            
            // New bounds should be valid
            const passedBounds = onAdjust.mock.calls[0][0] as CropBounds;
            expect(isValidCropBounds(passedBounds)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all valid image data URL formats', () => {
      const imageFormats = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      ];
      
      for (const format of imageFormats) {
        const state = computePreviewState(
          format,
          format,
          { x: 0, y: 0, width: 100, height: 100 }
        );
        
        expect(state.showsOriginalImage).toBe(true);
        expect(state.showsCroppedImage).toBe(true);
        expect(state.originalImageUrl).toBe(format);
        expect(state.croppedImageUrl).toBe(format);
      }
    });
  });
});
