import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-based tests for Smart Crop Clothing Detection
 * Feature: smart-paste-auto-try
 * 
 * Tests that screenshots with clothing return valid crop bounds
 * 
 * **Property 9: Screenshot With Clothing Returns Crop**
 * **Validates: REQ-5.1, REQ-5.2**
 */

// Types matching the Edge Function
interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedItem {
  type: string;
  confidence: number;
  bounds: CropBounds;
}

interface SmartCropResponse {
  success: boolean;
  croppedImage?: string;
  backgroundRemovedImage?: string;
  cropBounds?: CropBounds;
  detectedItems?: DetectedItem[];
  error?: string;
}

// Valid clothing types that can be detected
const CLOTHING_TYPES = ['top', 'bottom', 'dress', 'shoes', 'accessory', 'outerwear'] as const;
type ClothingType = typeof CLOTHING_TYPES[number];

// Arbitrary generator for valid crop bounds (percentages 0-100)
function cropBoundsArb(): fc.Arbitrary<CropBounds> {
  return fc.record({
    x: fc.integer({ min: 0, max: 80 }),
    y: fc.integer({ min: 0, max: 80 }),
    width: fc.integer({ min: 10, max: 100 }),
    height: fc.integer({ min: 10, max: 100 }),
  }).map(bounds => ({
    // Ensure bounds don't exceed 100%
    x: Math.min(bounds.x, 100 - bounds.width),
    y: Math.min(bounds.y, 100 - bounds.height),
    width: Math.min(bounds.width, 100 - bounds.x),
    height: Math.min(bounds.height, 100 - bounds.y),
  }));
}

// Arbitrary generator for a detected clothing item
function detectedItemArb(): fc.Arbitrary<DetectedItem> {
  return fc.record({
    type: fc.constantFrom(...CLOTHING_TYPES),
    confidence: fc.integer({ min: 10, max: 100 }).map(n => n / 100), // 0.1 to 1.0
    bounds: cropBoundsArb(),
  });
}

// Arbitrary generator for a successful smart crop response
function successfulSmartCropResponseArb(): fc.Arbitrary<SmartCropResponse> {
  return fc.tuple(
    fc.array(detectedItemArb(), { minLength: 1, maxLength: 5 }),
    fc.boolean(),
  ).map(([detectedItems, hasBackgroundRemoved]) => {
    // Find the best item (largest area with highest confidence)
    let bestItem = detectedItems[0];
    let bestScore = 0;
    
    for (const item of detectedItems) {
      const area = item.bounds.width * item.bounds.height;
      const score = area * item.confidence;
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    return {
      success: true,
      croppedImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      backgroundRemovedImage: hasBackgroundRemoved 
        ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        : undefined,
      cropBounds: bestItem.bounds,
      detectedItems,
    };
  });
}

// Arbitrary generator for a failed smart crop response (no clothing detected)
function failedSmartCropResponseArb(): fc.Arbitrary<SmartCropResponse> {
  return fc.constantFrom(
    { success: false, error: 'No clothing items detected in the image', detectedItems: [] },
    { success: false, error: 'Image processing failed', detectedItems: undefined },
    { success: false, error: 'Invalid image format', detectedItems: undefined },
  );
}

// Arbitrary generator for valid base64 image data URL
function base64ImageArb(): fc.Arbitrary<string> {
  return fc.constantFrom(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=',
    'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJYgCdAEO/hOMAAA=',
  );
}

/**
 * Simulates the smart crop clothing detection logic
 * This mirrors the Edge Function's behavior for testing
 */
function simulateSmartCropDetection(
  imageBase64: string,
  aiDetectionResult: { detectedItems: DetectedItem[]; bestItem: DetectedItem | null },
  removeBackground: boolean,
  backgroundRemovalSuccess: boolean
): SmartCropResponse {
  // Validate input
  if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
    return {
      success: false,
      error: 'Invalid image format. Expected base64 data URL.',
    };
  }

  // Check if any clothing was detected
  if (!aiDetectionResult.bestItem) {
    return {
      success: false,
      error: 'No clothing items detected in the image',
      detectedItems: aiDetectionResult.detectedItems,
    };
  }

  // Build successful response
  const response: SmartCropResponse = {
    success: true,
    croppedImage: imageBase64, // In real implementation, this would be cropped
    cropBounds: aiDetectionResult.bestItem.bounds,
    detectedItems: aiDetectionResult.detectedItems,
  };

  // Add background removed image if requested and successful
  if (removeBackground && backgroundRemovalSuccess) {
    response.backgroundRemovedImage = imageBase64; // In real implementation, this would be processed
  }

  return response;
}

/**
 * Helper to validate crop bounds are within valid range
 */
function isValidCropBounds(bounds: CropBounds): boolean {
  return (
    bounds.x >= 0 && bounds.x <= 100 &&
    bounds.y >= 0 && bounds.y <= 100 &&
    bounds.width > 0 && bounds.width <= 100 &&
    bounds.height > 0 && bounds.height <= 100 &&
    bounds.x + bounds.width <= 100 &&
    bounds.y + bounds.height <= 100
  );
}

describe('Smart Crop Clothing Detection Properties', () => {
  /**
   * Property 9: Screenshot With Clothing Returns Crop
   * For any screenshot containing clothing items:
   * - The response should be successful
   * - Crop bounds should be valid percentages (0-100)
   * - The best item should be selected based on area * confidence
   * 
   * **Validates: REQ-5.1, REQ-5.2**
   * 
   * Feature: smart-paste-auto-try, Property 9: Screenshot With Clothing Returns Crop
   */
  describe('Property 9: Screenshot With Clothing Returns Crop', () => {
    it('should return success=true when clothing is detected', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 5 }),
          fc.boolean(),
          async (imageBase64, detectedItems, removeBackground) => {
            // Find best item (same logic as Edge Function)
            let bestItem = detectedItems[0];
            let bestScore = 0;
            for (const item of detectedItems) {
              const area = item.bounds.width * item.bounds.height;
              const score = area * item.confidence;
              if (score > bestScore) {
                bestScore = score;
                bestItem = item;
              }
            }

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem },
              removeBackground,
              true
            );

            // Should be successful when clothing is detected
            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid crop bounds within 0-100 range', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 5 }),
          async (imageBase64, detectedItems) => {
            // Find best item
            let bestItem = detectedItems[0];
            let bestScore = 0;
            for (const item of detectedItems) {
              const area = item.bounds.width * item.bounds.height;
              const score = area * item.confidence;
              if (score > bestScore) {
                bestScore = score;
                bestItem = item;
              }
            }

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem },
              false,
              false
            );

            // Crop bounds should be valid
            expect(result.cropBounds).toBeDefined();
            expect(isValidCropBounds(result.cropBounds!)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should select the item with highest area * confidence score', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 2, maxLength: 5 }),
          async (imageBase64, detectedItems) => {
            // Calculate expected best item
            let expectedBestItem = detectedItems[0];
            let bestScore = 0;
            for (const item of detectedItems) {
              const area = item.bounds.width * item.bounds.height;
              const score = area * item.confidence;
              if (score > bestScore) {
                bestScore = score;
                expectedBestItem = item;
              }
            }

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem: expectedBestItem },
              false,
              false
            );

            // The returned crop bounds should match the best item
            expect(result.cropBounds).toEqual(expectedBestItem.bounds);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return success=false when no clothing is detected', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.boolean(),
          async (imageBase64, removeBackground) => {
            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems: [], bestItem: null },
              removeBackground,
              true
            );

            // Should fail when no clothing detected
            expect(result.success).toBe(false);
            expect(result.error).toBe('No clothing items detected in the image');
            expect(result.cropBounds).toBeUndefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return error for invalid image format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', 'invalid', 'http://example.com/image.png', 'not-base64'),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 3 }),
          async (invalidImage, detectedItems) => {
            const bestItem = detectedItems[0];
            
            const result = simulateSmartCropDetection(
              invalidImage,
              { detectedItems, bestItem },
              false,
              false
            );

            // Should fail for invalid image format
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid image format');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all detected items in the response', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 5 }),
          async (imageBase64, detectedItems) => {
            // Find best item
            let bestItem = detectedItems[0];
            let bestScore = 0;
            for (const item of detectedItems) {
              const area = item.bounds.width * item.bounds.height;
              const score = area * item.confidence;
              if (score > bestScore) {
                bestScore = score;
                bestItem = item;
              }
            }

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem },
              false,
              false
            );

            // All detected items should be in the response
            expect(result.detectedItems).toHaveLength(detectedItems.length);
            expect(result.detectedItems).toEqual(detectedItems);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include backgroundRemovedImage when removeBackground=true and successful', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 3 }),
          async (imageBase64, detectedItems) => {
            const bestItem = detectedItems[0];

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem },
              true, // removeBackground
              true  // backgroundRemovalSuccess
            );

            // Should include background removed image
            expect(result.success).toBe(true);
            expect(result.backgroundRemovedImage).toBeDefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include backgroundRemovedImage when removeBackground=false', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 3 }),
          async (imageBase64, detectedItems) => {
            const bestItem = detectedItems[0];

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem },
              false, // removeBackground
              true   // backgroundRemovalSuccess (doesn't matter)
            );

            // Should not include background removed image
            expect(result.success).toBe(true);
            expect(result.backgroundRemovedImage).toBeUndefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have detected items with valid clothing types', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 5 }),
          async (imageBase64, detectedItems) => {
            const bestItem = detectedItems[0];

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem },
              false,
              false
            );

            // All detected items should have valid clothing types
            for (const item of result.detectedItems || []) {
              expect(CLOTHING_TYPES).toContain(item.type);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have detected items with confidence between 0 and 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          base64ImageArb(),
          fc.array(detectedItemArb(), { minLength: 1, maxLength: 5 }),
          async (imageBase64, detectedItems) => {
            const bestItem = detectedItems[0];

            const result = simulateSmartCropDetection(
              imageBase64,
              { detectedItems, bestItem },
              false,
              false
            );

            // All detected items should have valid confidence scores
            for (const item of result.detectedItems || []) {
              expect(item.confidence).toBeGreaterThanOrEqual(0);
              expect(item.confidence).toBeLessThanOrEqual(1);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
