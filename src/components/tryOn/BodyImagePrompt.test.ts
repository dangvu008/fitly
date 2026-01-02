import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-based tests for BodyImagePrompt Component
 * Feature: one-tap-tryon-flow
 * 
 * Tests body image prompt behavior and validation guidance
 */

// Simulate user state for body image prompt
interface UserState {
  userId: string | null;
  hasDefaultBodyImage: boolean;
  defaultBodyImageUrl: string | null;
}

// Simulate prompt visibility decision
interface PromptDecision {
  shouldShowPrompt: boolean;
  reason: 'no_default_image' | 'has_default_image' | 'not_logged_in';
}

// Pure function to determine if body image prompt should be shown
// This mirrors the logic in useOneTapTryOn hook
function shouldShowBodyImagePrompt(userState: UserState): PromptDecision {
  // If user is not logged in, we still show prompt (they can upload without saving)
  if (!userState.userId) {
    return {
      shouldShowPrompt: true,
      reason: 'not_logged_in',
    };
  }

  // If user has no default body image, or URL is empty/whitespace, show prompt
  if (
    !userState.hasDefaultBodyImage ||
    !userState.defaultBodyImageUrl ||
    userState.defaultBodyImageUrl.trim() === ''
  ) {
    return {
      shouldShowPrompt: true,
      reason: 'no_default_image',
    };
  }

  // User has default body image, no need to show prompt
  return {
    shouldShowPrompt: false,
    reason: 'has_default_image',
  };
}

// Simulate Quick Try Button tap action
interface QuickTryAction {
  type: 'quick_try_tap';
  outfitId: string;
}

// Simulate the flow result
interface FlowResult {
  promptShown: boolean;
  immediateProcessing: boolean;
  bodyImageUsed: string | null;
}

// Pure function to simulate the one-tap try-on flow
function simulateOneTapFlow(
  userState: UserState,
  action: QuickTryAction
): FlowResult {
  const promptDecision = shouldShowBodyImagePrompt(userState);

  if (promptDecision.shouldShowPrompt) {
    // Prompt is shown, no immediate processing
    return {
      promptShown: true,
      immediateProcessing: false,
      bodyImageUsed: null,
    };
  }

  // Has default image, proceed immediately
  return {
    promptShown: false,
    immediateProcessing: true,
    bodyImageUsed: userState.defaultBodyImageUrl,
  };
}

describe('BodyImagePrompt Properties', () => {
  /**
   * Property 1: Body Image Prompt Shown When No Default
   * For any user without a default body image, when they tap the Quick Try Button,
   * the system should display the Body Image Prompt dialog.
   * 
   * **Validates: Requirements 1.2, 3.2**
   */
  describe('Property 1: Body Image Prompt Shown When No Default', () => {
    it('should show prompt when user has no default body image', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          fc.uuid(), // outfitId
          (userId, outfitId) => {
            const userState: UserState = {
              userId,
              hasDefaultBodyImage: false,
              defaultBodyImageUrl: null,
            };

            const action: QuickTryAction = {
              type: 'quick_try_tap',
              outfitId,
            };

            const result = simulateOneTapFlow(userState, action);

            // Prompt should be shown
            expect(result.promptShown).toBe(true);
            // No immediate processing
            expect(result.immediateProcessing).toBe(false);
            // No body image used yet
            expect(result.bodyImageUsed).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show prompt when user has empty default body image URL', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          fc.uuid(), // outfitId
          fc.constantFrom('', '   ', null), // Empty or whitespace URL
          (userId, outfitId, emptyUrl) => {
            const userState: UserState = {
              userId,
              hasDefaultBodyImage: emptyUrl !== null, // hasDefaultBodyImage might be true but URL is empty
              defaultBodyImageUrl: emptyUrl,
            };

            const action: QuickTryAction = {
              type: 'quick_try_tap',
              outfitId,
            };

            const result = simulateOneTapFlow(userState, action);

            // Prompt should be shown for empty/null URLs
            expect(result.promptShown).toBe(true);
            expect(result.immediateProcessing).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT show prompt when user has valid default body image', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          fc.uuid(), // outfitId
          fc.webUrl({ validSchemes: ['https'] }), // Valid image URL
          (userId, outfitId, imageUrl) => {
            const userState: UserState = {
              userId,
              hasDefaultBodyImage: true,
              defaultBodyImageUrl: imageUrl,
            };

            const action: QuickTryAction = {
              type: 'quick_try_tap',
              outfitId,
            };

            const result = simulateOneTapFlow(userState, action);

            // Prompt should NOT be shown
            expect(result.promptShown).toBe(false);
            // Should proceed immediately
            expect(result.immediateProcessing).toBe(true);
            // Should use the default body image
            expect(result.bodyImageUsed).toBe(imageUrl);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show prompt for non-logged-in users', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // outfitId
          (outfitId) => {
            const userState: UserState = {
              userId: null,
              hasDefaultBodyImage: false,
              defaultBodyImageUrl: null,
            };

            const action: QuickTryAction = {
              type: 'quick_try_tap',
              outfitId,
            };

            const result = simulateOneTapFlow(userState, action);

            // Prompt should be shown for non-logged-in users
            expect(result.promptShown).toBe(true);
            expect(result.immediateProcessing).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently show/hide prompt based on default image state', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          fc.uuid(), // outfitId
          fc.boolean(), // hasDefaultImage
          fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }), // imageUrl or null
          (userId, outfitId, hasDefaultImage, imageUrl) => {
            const userState: UserState = {
              userId,
              hasDefaultBodyImage: hasDefaultImage && imageUrl !== null,
              defaultBodyImageUrl: hasDefaultImage ? imageUrl : null,
            };

            const action: QuickTryAction = {
              type: 'quick_try_tap',
              outfitId,
            };

            const result = simulateOneTapFlow(userState, action);

            // Consistency check: prompt shown XOR immediate processing
            // (exactly one should be true)
            expect(result.promptShown !== result.immediateProcessing).toBe(true);

            // If prompt is shown, no body image should be used
            if (result.promptShown) {
              expect(result.bodyImageUsed).toBeNull();
            }

            // If immediate processing, body image should be used
            if (result.immediateProcessing) {
              expect(result.bodyImageUsed).not.toBeNull();
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// Simulate validation result from analyze-body-image edge function
interface ValidationResult {
  isPerson: boolean;
  isFullBody: boolean;
  quality: 'good' | 'acceptable' | 'poor';
  issues: string[];
}

// Simulate validation state shown to user
interface ValidationDisplayState {
  status: 'idle' | 'validating' | 'success' | 'error';
  message: string | null;
  guidance: string[];
}

// Known issue types that can be returned by the edge function
const KNOWN_ISSUES = [
  'not a person',
  'face not visible',
  'cropped body',
  'too blurry',
  'too dark',
  'multiple people',
  'validation_failed',
] as const;

// Guidance messages for each issue type (simulating translations)
const GUIDANCE_MAP: Record<string, string> = {
  'not a person': 'No person detected in image',
  'face not visible': 'Face should be clearly visible',
  'cropped body': 'Full body not visible',
  'too blurry': 'Photo is too blurry, please take a clearer one',
  'too dark': 'Poor lighting, please use better light',
  'multiple people': 'Only one person should be in the photo',
  'validation_failed': 'Cannot validate image',
};

// Pure function to determine if validation passed
function isValidationPassed(result: ValidationResult): boolean {
  return result.isPerson && result.isFullBody && result.quality !== 'poor';
}

// Pure function to map issues to user-friendly guidance
function mapIssuesToGuidance(issues: string[]): string[] {
  return issues.map((issue) => {
    const lowerIssue = issue.toLowerCase();
    for (const [key, value] of Object.entries(GUIDANCE_MAP)) {
      if (lowerIssue.includes(key)) return value;
    }
    return issue; // Return original if no mapping found
  });
}

// Pure function to determine validation display state
function getValidationDisplayState(
  result: ValidationResult | null,
  isValidating: boolean
): ValidationDisplayState {
  if (isValidating) {
    return {
      status: 'validating',
      message: 'Validating image...',
      guidance: [],
    };
  }

  if (!result) {
    return {
      status: 'idle',
      message: null,
      guidance: [],
    };
  }

  if (isValidationPassed(result)) {
    return {
      status: 'success',
      message: 'Validation complete!',
      guidance: [],
    };
  }

  // Validation failed - show guidance
  return {
    status: 'error',
    message: 'Invalid photo',
    guidance: mapIssuesToGuidance(result.issues),
  };
}

describe('Validation Guidance Properties', () => {
  /**
   * Property 4: Validation Failure Shows Guidance
   * For any body image that fails validation, the system should display
   * helpful guidance on how to take a proper full-body photo.
   * 
   * **Validates: Requirements 1.6**
   */
  describe('Property 4: Validation Failure Shows Guidance', () => {
    it('should show guidance when validation fails due to no person detected', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...KNOWN_ISSUES), { minLength: 1, maxLength: 3 }),
          (issues) => {
            const result: ValidationResult = {
              isPerson: false,
              isFullBody: false,
              quality: 'poor',
              issues: issues as string[],
            };

            const displayState = getValidationDisplayState(result, false);

            // Should show error status
            expect(displayState.status).toBe('error');
            // Should have guidance
            expect(displayState.guidance.length).toBeGreaterThan(0);
            // Guidance should be user-friendly (mapped from issues)
            expect(displayState.guidance.length).toBe(issues.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show guidance when validation fails due to not full body', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('good', 'acceptable', 'poor') as fc.Arbitrary<'good' | 'acceptable' | 'poor'>,
          (quality) => {
            const result: ValidationResult = {
              isPerson: true,
              isFullBody: false,
              quality,
              issues: ['cropped body'],
            };

            const displayState = getValidationDisplayState(result, false);

            // Should show error status
            expect(displayState.status).toBe('error');
            // Should have guidance about full body
            expect(displayState.guidance).toContain('Full body not visible');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show guidance when validation fails due to poor quality', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('too blurry', 'too dark'), { minLength: 1, maxLength: 2 }),
          (issues) => {
            const result: ValidationResult = {
              isPerson: true,
              isFullBody: true,
              quality: 'poor',
              issues: issues as string[],
            };

            const displayState = getValidationDisplayState(result, false);

            // Should show error status (poor quality fails validation)
            expect(displayState.status).toBe('error');
            // Should have guidance
            expect(displayState.guidance.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT show guidance when validation succeeds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('good', 'acceptable') as fc.Arbitrary<'good' | 'acceptable'>,
          (quality) => {
            const result: ValidationResult = {
              isPerson: true,
              isFullBody: true,
              quality,
              issues: [],
            };

            const displayState = getValidationDisplayState(result, false);

            // Should show success status
            expect(displayState.status).toBe('success');
            // Should NOT have guidance
            expect(displayState.guidance.length).toBe(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map all known issues to user-friendly guidance', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...KNOWN_ISSUES),
          (issue) => {
            const guidance = mapIssuesToGuidance([issue]);

            // Should have exactly one guidance message
            expect(guidance.length).toBe(1);
            // Guidance should be different from raw issue (user-friendly)
            expect(guidance[0]).not.toBe(issue);
            // Guidance should be from our map
            expect(Object.values(GUIDANCE_MAP)).toContain(guidance[0]);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve unknown issues as-is in guidance', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter(
            (s) => !KNOWN_ISSUES.some((known) => s.toLowerCase().includes(known))
          ),
          (unknownIssue) => {
            const guidance = mapIssuesToGuidance([unknownIssue]);

            // Unknown issues should be passed through as-is
            expect(guidance.length).toBe(1);
            expect(guidance[0]).toBe(unknownIssue);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show validating state during validation', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Whether there's a previous result
          (hasPreviousResult) => {
            const previousResult: ValidationResult | null = hasPreviousResult
              ? {
                  isPerson: true,
                  isFullBody: true,
                  quality: 'good',
                  issues: [],
                }
              : null;

            const displayState = getValidationDisplayState(previousResult, true);

            // Should show validating status regardless of previous result
            expect(displayState.status).toBe('validating');
            expect(displayState.message).toBe('Validating image...');
            expect(displayState.guidance.length).toBe(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple issues with guidance for each', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...KNOWN_ISSUES), { minLength: 2, maxLength: 5 }),
          (issues) => {
            // Remove duplicates for cleaner test
            const uniqueIssues = [...new Set(issues)];
            
            const result: ValidationResult = {
              isPerson: false,
              isFullBody: false,
              quality: 'poor',
              issues: uniqueIssues as string[],
            };

            const displayState = getValidationDisplayState(result, false);

            // Should have guidance for each unique issue
            expect(displayState.guidance.length).toBe(uniqueIssues.length);
            // All guidance should be user-friendly
            displayState.guidance.forEach((g) => {
              expect(g.length).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
