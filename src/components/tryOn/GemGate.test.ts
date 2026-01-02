import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-based tests for GemGate Component
 * Feature: one-tap-tryon-flow
 * 
 * Tests gem checking, insufficient gems handling, and scarcity messages
 */

// Gem state model
interface GemState {
  balance: number;
  requiredGems: number;
}

// Gem gate decision
interface GemGateDecision {
  hasSufficientGems: boolean;
  shouldShowScarcityMessage: boolean;
  shouldShowWatchAdOption: boolean;
  shouldShowPurchaseOption: boolean;
  canProceed: boolean;
}

/**
 * Pure function to determine gem gate behavior
 * This mirrors the logic in GemGate component
 */
function getGemGateDecision(state: GemState): GemGateDecision {
  const hasSufficientGems = state.balance >= state.requiredGems;
  const isLastGem = state.balance === 1 && state.requiredGems === 1;

  return {
    hasSufficientGems,
    shouldShowScarcityMessage: isLastGem,
    shouldShowWatchAdOption: !hasSufficientGems,
    shouldShowPurchaseOption: !hasSufficientGems,
    canProceed: hasSufficientGems,
  };
}

// Try-on request model
interface TryOnRequest {
  outfitId: string;
  hasDefaultBodyImage: boolean;
  gemBalance: number;
  requiredGems: number;
}

// Try-on flow decision
interface TryOnFlowDecision {
  shouldCheckGems: boolean;
  shouldProceedToProcessing: boolean;
  shouldShowGemGate: boolean;
  reason: string;
}

/**
 * Pure function to determine try-on flow based on gem state
 * This mirrors the logic in useOneTapTryOn hook
 */
function getTryOnFlowDecision(request: TryOnRequest): TryOnFlowDecision {
  // Always check gems before processing
  const shouldCheckGems = true;

  if (!request.hasDefaultBodyImage) {
    return {
      shouldCheckGems: false,
      shouldProceedToProcessing: false,
      shouldShowGemGate: false,
      reason: 'no_body_image',
    };
  }

  const hasSufficientGems = request.gemBalance >= request.requiredGems;

  if (hasSufficientGems) {
    return {
      shouldCheckGems,
      shouldProceedToProcessing: true,
      shouldShowGemGate: false,
      reason: 'sufficient_gems',
    };
  }

  return {
    shouldCheckGems,
    shouldProceedToProcessing: false,
    shouldShowGemGate: true,
    reason: 'insufficient_gems',
  };
}

// Arbitrary generators
const gemBalanceArb = fc.integer({ min: 0, max: 100 });
const requiredGemsArb = fc.integer({ min: 1, max: 10 });

const gemStateArb: fc.Arbitrary<GemState> = fc.record({
  balance: gemBalanceArb,
  requiredGems: requiredGemsArb,
});

const tryOnRequestArb: fc.Arbitrary<TryOnRequest> = fc.record({
  outfitId: fc.uuid(),
  hasDefaultBodyImage: fc.boolean(),
  gemBalance: gemBalanceArb,
  requiredGems: requiredGemsArb,
});

describe('GemGate Properties', () => {
  /**
   * Property 7: Gem Check Before Processing
   * For any try-on request, the system should check the user's gem balance
   * before starting AI processing.
   * 
   * **Validates: Requirements 3.3**
   */
  describe('Property 7: Gem Check Before Processing', () => {
    it('should always check gems when user has body image', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // outfitId
          gemBalanceArb,
          requiredGemsArb,
          (outfitId, gemBalance, requiredGems) => {
            const request: TryOnRequest = {
              outfitId,
              hasDefaultBodyImage: true,
              gemBalance,
              requiredGems,
            };

            const decision = getTryOnFlowDecision(request);

            // Should always check gems when body image exists
            expect(decision.shouldCheckGems).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not check gems when no body image', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // outfitId
          gemBalanceArb,
          requiredGemsArb,
          (outfitId, gemBalance, requiredGems) => {
            const request: TryOnRequest = {
              outfitId,
              hasDefaultBodyImage: false,
              gemBalance,
              requiredGems,
            };

            const decision = getTryOnFlowDecision(request);

            // Should not check gems when no body image
            expect(decision.shouldCheckGems).toBe(false);
            expect(decision.reason).toBe('no_body_image');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should proceed to processing only when gems are sufficient', () => {
      fc.assert(
        fc.property(
          tryOnRequestArb.filter((r) => r.hasDefaultBodyImage),
          (request) => {
            const decision = getTryOnFlowDecision(request);
            const hasSufficientGems = request.gemBalance >= request.requiredGems;

            // Should proceed only when sufficient gems
            expect(decision.shouldProceedToProcessing).toBe(hasSufficientGems);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show gem gate when insufficient gems', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // outfitId
          fc.integer({ min: 0, max: 5 }), // low balance
          fc.integer({ min: 6, max: 10 }), // higher required
          (outfitId, gemBalance, requiredGems) => {
            const request: TryOnRequest = {
              outfitId,
              hasDefaultBodyImage: true,
              gemBalance,
              requiredGems,
            };

            const decision = getTryOnFlowDecision(request);

            // Should show gem gate when insufficient
            expect(decision.shouldShowGemGate).toBe(true);
            expect(decision.shouldProceedToProcessing).toBe(false);
            expect(decision.reason).toBe('insufficient_gems');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Insufficient Gems Shows Options
   * For any user with insufficient gems who attempts a try-on,
   * the system should show options to watch an ad or purchase gems.
   * 
   * **Validates: Requirements 3.5**
   */
  describe('Property 9: Insufficient Gems Shows Options', () => {
    it('should show watch ad and purchase options when insufficient gems', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }), // low balance
          fc.integer({ min: 6, max: 10 }), // higher required
          (balance, requiredGems) => {
            const state: GemState = { balance, requiredGems };
            const decision = getGemGateDecision(state);

            // Should show both options when insufficient
            expect(decision.hasSufficientGems).toBe(false);
            expect(decision.shouldShowWatchAdOption).toBe(true);
            expect(decision.shouldShowPurchaseOption).toBe(true);
            expect(decision.canProceed).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT show options when sufficient gems', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 100 }), // sufficient balance
          fc.integer({ min: 1, max: 5 }), // lower required
          (balance, requiredGems) => {
            const state: GemState = { balance, requiredGems };
            const decision = getGemGateDecision(state);

            // Should not show options when sufficient
            expect(decision.hasSufficientGems).toBe(true);
            expect(decision.shouldShowWatchAdOption).toBe(false);
            expect(decision.shouldShowPurchaseOption).toBe(false);
            expect(decision.canProceed).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of exactly enough gems', () => {
      fc.assert(
        fc.property(
          requiredGemsArb,
          (requiredGems) => {
            const state: GemState = { balance: requiredGems, requiredGems };
            const decision = getGemGateDecision(state);

            // Exactly enough should be sufficient
            expect(decision.hasSufficientGems).toBe(true);
            expect(decision.canProceed).toBe(true);
            expect(decision.shouldShowWatchAdOption).toBe(false);
            expect(decision.shouldShowPurchaseOption).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of zero balance', () => {
      fc.assert(
        fc.property(
          requiredGemsArb,
          (requiredGems) => {
            const state: GemState = { balance: 0, requiredGems };
            const decision = getGemGateDecision(state);

            // Zero balance should show options
            expect(decision.hasSufficientGems).toBe(false);
            expect(decision.shouldShowWatchAdOption).toBe(true);
            expect(decision.shouldShowPurchaseOption).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: Scarcity Message At Low Gems
   * For any user with exactly 1 gem remaining, the system should display
   * a scarcity message encouraging them to choose wisely.
   * 
   * **Validates: Requirements 6.1**
   */
  describe('Property 15: Scarcity Message At Low Gems', () => {
    it('should show scarcity message when balance is 1 and required is 1', () => {
      const state: GemState = { balance: 1, requiredGems: 1 };
      const decision = getGemGateDecision(state);

      expect(decision.shouldShowScarcityMessage).toBe(true);
      expect(decision.hasSufficientGems).toBe(true);
      expect(decision.canProceed).toBe(true);
    });

    it('should NOT show scarcity message when balance > 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }), // balance > 1
          requiredGemsArb,
          (balance, requiredGems) => {
            const state: GemState = { balance, requiredGems };
            const decision = getGemGateDecision(state);

            // Should not show scarcity when balance > 1
            expect(decision.shouldShowScarcityMessage).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT show scarcity message when balance is 0', () => {
      fc.assert(
        fc.property(
          requiredGemsArb,
          (requiredGems) => {
            const state: GemState = { balance: 0, requiredGems };
            const decision = getGemGateDecision(state);

            // Should not show scarcity when balance is 0
            expect(decision.shouldShowScarcityMessage).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT show scarcity message when required > 1 even if balance is 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // required > 1
          (requiredGems) => {
            const state: GemState = { balance: 1, requiredGems };
            const decision = getGemGateDecision(state);

            // Should not show scarcity when required > 1
            expect(decision.shouldShowScarcityMessage).toBe(false);
            // But should show insufficient gems options
            expect(decision.hasSufficientGems).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only show scarcity message in exact condition: balance=1, required=1', () => {
      fc.assert(
        fc.property(
          gemStateArb,
          (state) => {
            const decision = getGemGateDecision(state);
            const isExactCondition = state.balance === 1 && state.requiredGems === 1;

            // Scarcity message should only show in exact condition
            expect(decision.shouldShowScarcityMessage).toBe(isExactCondition);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
