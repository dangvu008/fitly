# Implementation Plan: Project Audit & Refactoring

## Overview

Kế hoạch thực hiện audit và refactoring dự án AI Try-On theo thứ tự ưu tiên.

## Tasks

- [x] 1. Security Fixes (CRITICAL)
  - [x] 1.1 Fix environment variable exposure
    - Add `.env` to `.gitignore`
    - Create `.env.example` with placeholder values
    - Document required environment variables
    - _Requirements: 3.1_
  
  - [x] 1.2 Tighten CORS configuration
    - Update Edge Functions to use specific origins
    - Add environment variable for allowed origins
    - _Requirements: 3.2_
  
  - [x] 1.3 Add production logging utility
    - Create `src/lib/logger.ts`
    - Replace console.log with logger calls
    - Disable verbose logging in production
    - _Requirements: 3.1_

- [x] 2. Checkpoint - Security Review
  - Ensure all security fixes are applied
  - Verify no secrets in client code
  - Test authentication flows

- [x] 3. Design System Implementation
  - [x] 3.1 Create design token file
    - Create `src/lib/design-tokens.ts`
    - Export color, spacing, typography tokens
    - _Requirements: 1.1_
  
  - [x] 3.2 Update Tailwind configuration
    - Add semantic color tokens
    - Add social brand colors
    - Standardize spacing scale
    - _Requirements: 1.1, 1.3_
  
  - [x] 3.3 Migrate hardcoded colors in FitlyLogo
    - Replace hex values with CSS variables
    - Update gradient definitions
    - _Requirements: 1.2_
  
  - [x] 3.4 Migrate hardcoded colors in TryOnPage
    - Replace inline gradient styles
    - Use Tailwind gradient utilities
    - _Requirements: 1.2_
  
  - [x] 3.5 Migrate social sharing button colors
    - Create social color tokens
    - Update ShareOutfitDialog.tsx
    - Update ShareResultDialog.tsx
    - _Requirements: 1.2_

- [x] 4. Checkpoint - Design System Review
  - Verify all colors use design tokens
  - Check spacing consistency
  - Review button variants

- [x] 5. Code Cleanup
  - [x] 5.1 Fix unused variable in MobileNav
    - Remove or use `index` variable
    - _Requirements: 2.1_
  
  - [x] 5.2 Consolidate toast implementations
    - Keep single toast hook
    - Remove duplicate file
    - Update imports
    - _Requirements: 2.2_
  
  - [x] 5.3 Split TryOnPage component
    - Extract ClothingValidationOverlay
    - Extract AIResultModal
    - Extract ClothingPanel
    - Target: <300 lines per file
    - _Requirements: 2.2_
  
  - [x] 5.4 Review and document stub hooks
    - Add TODO comments to useUserGems
    - Add TODO comments to useProSubscription
    - Consider feature flags
    - _Requirements: 2.1_
  
  - [x] 5.5 Audit unused dependencies
    - Check recharts usage
    - Check react-day-picker usage
    - Check react-resizable-panels usage
    - Remove if unused
    - _Requirements: 2.3_

- [x] 6. Checkpoint - Code Quality Review
  - Run ESLint
  - Check for unused imports
  - Verify component sizes

- [x] 7. Architecture Improvements
  - [x] 7.1 Standardize file naming
    - Rename `use-mobile.tsx` to `useMobile.ts`
    - Rename `use-toast.ts` to `useToast.ts`
    - Update all imports
    - _Requirements: 4.1_
  
  - [x] 7.2 Reorganize services directory
    - Move confetti.ts to utils
    - Move haptics.ts to utils
    - Keep revenueCat.ts in services
    - _Requirements: 4.4_
  
  - [x] 7.3 Add ErrorBoundary component
    - Create ErrorBoundary.tsx
    - Wrap major app sections
    - Add fallback UI
    - _Requirements: 4.2_
  
  - [x] 7.4 Standardize loading states
    - Create LoadingState component
    - Update pages to use consistent loading
    - _Requirements: 4.3_

- [x] 8. Final Checkpoint
  - Run full test suite
  - Verify all requirements met
  - Update documentation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Security tasks are highest priority and should be done first

