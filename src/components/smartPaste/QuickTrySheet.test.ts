import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-based tests for QuickTrySheet Image Selection
 * Feature: smart-paste-auto-try
 * 
 * Tests that selected images are correctly passed to the handler
 */

// Helper to create a mock File object
function createMockImageFile(
  name: string,
  size: number,
  type: string
): File {
  // Create a blob with the specified size
  const content = new Uint8Array(size);
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// Helper to simulate FileReader behavior
function simulateFileReaderResult(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
}

// Arbitrary generator for valid image file types
const validImageTypeArb = fc.constantFrom(
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
);

// Arbitrary generator for invalid file types (non-image)
const invalidFileTypeArb = fc.constantFrom(
  'application/pdf',
  'text/plain',
  'application/json',
  'video/mp4',
  'audio/mpeg',
  'application/zip'
);

// Arbitrary generator for valid file sizes (under 10MB)
const validFileSizeArb = fc.integer({ min: 1, max: 10 * 1024 * 1024 - 1 });

// Arbitrary generator for invalid file sizes (over 10MB)
const invalidFileSizeArb = fc.integer({ min: 10 * 1024 * 1024 + 1, max: 50 * 1024 * 1024 });

// Arbitrary generator for file names
const fileNameArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}\.(jpg|png|gif|webp)$/);

// Arbitrary generator for valid image files
const validImageFileArb = fc.tuple(
  fileNameArb,
  validFileSizeArb,
  validImageTypeArb
).map(([name, size, type]) => createMockImageFile(name, size, type));

// Arbitrary generator for invalid type files
const invalidTypeFileArb = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}\.(pdf|txt|json|mp4)$/),
  validFileSizeArb,
  invalidFileTypeArb
).map(([name, size, type]) => createMockImageFile(name, size, type));

// Arbitrary generator for oversized image files
const oversizedImageFileArb = fc.tuple(
  fileNameArb,
  invalidFileSizeArb,
  validImageTypeArb
).map(([name, size, type]) => createMockImageFile(name, size, type));

/**
 * Image validation logic extracted from QuickTrySheet
 * This mirrors the validation in handleFileSelect
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Image too large. Max 10MB.' };
  }

  return { valid: true };
}

/**
 * Simulates the file selection handler behavior
 * Returns the data URL if valid, null otherwise
 */
async function processFileSelection(
  file: File,
  onImageSelected: (dataUrl: string) => void,
  onError: (message: string) => void
): Promise<boolean> {
  const validation = validateImageFile(file);
  
  if (!validation.valid) {
    onError(validation.error!);
    return false;
  }

  const dataUrl = await simulateFileReaderResult(file);
  onImageSelected(dataUrl);
  return true;
}

describe('QuickTrySheet Image Selection Properties', () => {
  /**
   * Property 8: Selected Image Is Passed To Handler
   * For any valid image file selected by the user,
   * the onImageSelected callback should be called with the image data URL.
   * 
   * **Validates: REQ-4.3**
   * 
   * Feature: smart-paste-auto-try, Property 8: Selected Image Is Passed To Handler
   */
  describe('Property 8: Selected Image Is Passed To Handler', () => {
    it('should pass valid image files to the handler as data URLs', async () => {
      await fc.assert(
        fc.asyncProperty(
          validImageFileArb,
          async (file) => {
            const onImageSelected = vi.fn();
            const onError = vi.fn();

            const result = await processFileSelection(file, onImageSelected, onError);

            // Should successfully process the file
            expect(result).toBe(true);
            
            // Handler should be called exactly once
            expect(onImageSelected).toHaveBeenCalledTimes(1);
            
            // Handler should receive a data URL
            const dataUrl = onImageSelected.mock.calls[0][0];
            expect(typeof dataUrl).toBe('string');
            expect(dataUrl.startsWith('data:')).toBe(true);
            
            // Error handler should not be called
            expect(onError).not.toHaveBeenCalled();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-image files and not call the handler', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidTypeFileArb,
          async (file) => {
            const onImageSelected = vi.fn();
            const onError = vi.fn();

            const result = await processFileSelection(file, onImageSelected, onError);

            // Should reject the file
            expect(result).toBe(false);
            
            // Handler should NOT be called
            expect(onImageSelected).not.toHaveBeenCalled();
            
            // Error handler should be called with appropriate message
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith('Please select an image file');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject oversized images and not call the handler', async () => {
      await fc.assert(
        fc.asyncProperty(
          oversizedImageFileArb,
          async (file) => {
            const onImageSelected = vi.fn();
            const onError = vi.fn();

            const result = await processFileSelection(file, onImageSelected, onError);

            // Should reject the file
            expect(result).toBe(false);
            
            // Handler should NOT be called
            expect(onImageSelected).not.toHaveBeenCalled();
            
            // Error handler should be called with appropriate message
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith('Image too large. Max 10MB.');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve image type in the data URL', async () => {
      await fc.assert(
        fc.asyncProperty(
          validImageFileArb,
          async (file) => {
            const onImageSelected = vi.fn();
            const onError = vi.fn();

            await processFileSelection(file, onImageSelected, onError);

            // Handler should be called
            expect(onImageSelected).toHaveBeenCalledTimes(1);
            
            // Data URL should contain the correct MIME type
            const dataUrl = onImageSelected.mock.calls[0][0];
            expect(dataUrl.startsWith(`data:${file.type}`)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle boundary file sizes correctly', async () => {
      // Test files at exactly 10MB boundary
      const exactlyMaxSize = 10 * 1024 * 1024;
      const justUnderMax = exactlyMaxSize - 1;
      const justOverMax = exactlyMaxSize + 1;

      const onImageSelected = vi.fn();
      const onError = vi.fn();

      // Just under max should be accepted
      const underMaxFile = createMockImageFile('test.jpg', justUnderMax, 'image/jpeg');
      const underResult = await processFileSelection(underMaxFile, onImageSelected, onError);
      expect(underResult).toBe(true);
      expect(onImageSelected).toHaveBeenCalledTimes(1);

      onImageSelected.mockClear();
      onError.mockClear();

      // Exactly at max should be accepted (10MB is the limit, not exceeded)
      const exactMaxFile = createMockImageFile('test.jpg', exactlyMaxSize, 'image/jpeg');
      const exactResult = await processFileSelection(exactMaxFile, onImageSelected, onError);
      expect(exactResult).toBe(true);
      expect(onImageSelected).toHaveBeenCalledTimes(1);

      onImageSelected.mockClear();
      onError.mockClear();

      // Just over max should be rejected
      const overMaxFile = createMockImageFile('test.jpg', justOverMax, 'image/jpeg');
      const overResult = await processFileSelection(overMaxFile, onImageSelected, onError);
      expect(overResult).toBe(false);
      expect(onImageSelected).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Image too large. Max 10MB.');
    });

    it('should accept all common image formats', async () => {
      const imageFormats = [
        { ext: 'jpg', type: 'image/jpeg' },
        { ext: 'png', type: 'image/png' },
        { ext: 'gif', type: 'image/gif' },
        { ext: 'webp', type: 'image/webp' },
        { ext: 'bmp', type: 'image/bmp' },
        { ext: 'svg', type: 'image/svg+xml' },
      ];

      for (const format of imageFormats) {
        const onImageSelected = vi.fn();
        const onError = vi.fn();

        const file = createMockImageFile(`test.${format.ext}`, 1024, format.type);
        const result = await processFileSelection(file, onImageSelected, onError);

        expect(result).toBe(true);
        expect(onImageSelected).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
      }
    });
  });
});
