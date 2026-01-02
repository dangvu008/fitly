# Implementation Plan: One-Tap Try-On Flow

## Overview

Implementation plan để xây dựng tính năng One-Tap Try-On Flow, tối ưu hóa trải nghiệm thử đồ ảo với mục tiêu "1 chạm = thử ngay".

## Tasks

- [x] 1. Database schema và user profile extension
  - [x] 1.1 Add default_body_image fields to user_profiles table
    - Add migration for `default_body_image_url` and `default_body_image_updated_at` columns
    - Update Supabase types
    - _Requirements: 1.4, 1.5_

- [x] 2. Implement useDefaultBodyImage hook
  - [x] 2.1 Create hook for managing default body image
    - Fetch default body image from user profile
    - Save/update default body image
    - Clear default body image
    - _Requirements: 1.4, 1.5_
  - [x] 2.2 Write property test for default body image persistence
    - **Property 3: Validated Body Image Saved As Default**
    - **Validates: Requirements 1.4**

- [x] 3. Implement BodyImagePrompt component
  - [x] 3.1 Create BodyImagePrompt dialog component
    - Upload from gallery option
    - Take selfie with camera option
    - Use previous body image option (if available)
    - _Requirements: 1.2, 3.2_
  - [x] 3.2 Integrate body image validation
    - Call existing analyze-body-image edge function
    - Display validation errors with guidance
    - _Requirements: 1.3, 1.6_
  - [x] 3.3 Write property test for body image prompt behavior
    - **Property 1: Body Image Prompt Shown When No Default**
    - **Validates: Requirements 1.2, 3.2**
  - [x] 3.4 Write property test for validation guidance
    - **Property 4: Validation Failure Shows Guidance**
    - **Validates: Requirements 1.6**

- [x] 4. Checkpoint - Ensure body image management works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement QuickTryButton component
  - [x] 5.1 Create QuickTryButton with gradient styling
    - ⚡ icon with gradient background (primary to accent)
    - Support sm/md/lg sizes
    - Support default and overlay variants
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 5.2 Write property test for button presence on cards
    - **Property 5: Quick Try Button Present On Cards**
    - **Validates: Requirements 2.1, 2.2**

- [x] 6. Implement ProcessingAnimation component
  - [x] 6.1 Create animated skeleton loader
    - Pulsing animation during processing
    - Progress indicator
    - _Requirements: 4.1_
  - [x] 6.2 Add rotating fun messages
    - Array of engaging messages in multiple languages
    - Rotate every 3 seconds
    - _Requirements: 4.2_
  - [x] 6.3 Add time estimate display
    - Show estimated time remaining
    - Update message when overtime
    - _Requirements: 4.3, 4.4_
  - [x] 6.4 Write property test for processing animation
    - **Property 10: Processing State Shows Animation**
    - **Validates: Requirements 3.6, 4.1, 4.2, 4.3**
  - [x] 6.5 Write property test for overtime message
    - **Property 12: Long Timeout Updates Message**
    - **Validates: Requirements 4.4**

- [x] 7. Implement GemGate component
  - [x] 7.1 Create GemGate for gem checking
    - Check user gem balance
    - Show scarcity message at 1 gem
    - Show options when insufficient gems
    - _Requirements: 3.3, 3.5, 6.1_
  - [x] 7.2 Write property test for gem check
    - **Property 7: Gem Check Before Processing**
    - **Validates: Requirements 3.3**
  - [x] 7.3 Write property test for insufficient gems
    - **Property 9: Insufficient Gems Shows Options**
    - **Validates: Requirements 3.5**
  - [x] 7.4 Write property test for scarcity message
    - **Property 15: Scarcity Message At Low Gems**
    - **Validates: Requirements 6.1**

- [x] 8. Checkpoint - Ensure UI components work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement useOneTapTryOn hook
  - [x] 9.1 Create main orchestration hook
    - Check for default body image
    - Integrate with GemGate
    - Manage processing state
    - Handle AI try-on request
    - _Requirements: 3.1, 3.3, 3.4, 3.6, 3.7_
  - [x] 9.2 Add gem deduction logic
    - Deduct gems before processing
    - Refund on failure
    - Show balance after completion
    - _Requirements: 3.4, 6.4_
  - [x] 9.3 Write property test for immediate processing
    - **Property 6: Default Image Triggers Immediate Processing**
    - **Validates: Requirements 3.1**
  - [x] 9.4 Write property test for gem deduction
    - **Property 8: Gem Deduction On Processing**
    - **Validates: Requirements 3.4**
  - [x] 9.5 Write property test for completion result
    - **Property 11: Processing Completion Shows Result**
    - **Validates: Requirements 3.7**
  - [x] 9.6 Write property test for balance display
    - **Property 16: Gem Balance Shown After Completion**
    - **Validates: Requirements 6.4**

- [x] 10. Implement ResultPreview component
  - [x] 10.1 Create ResultPreview with action buttons
    - Full-screen result display
    - Download HD, Shop Now, Share, Try Another, Retry buttons
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 10.2 Add Before/After comparison on long-press
    - Long-press gesture detection
    - Side-by-side or overlay comparison view
    - _Requirements: 5.2_
  - [x] 10.3 Add background fallback notification
    - Detect when background preservation failed
    - Show subtle notification to user
    - _Requirements: 7.3_
  - [x] 10.4 Write property test for action buttons
    - **Property 14: Result Preview Contains Action Buttons**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**
  - [x] 10.5 Write property test for comparison
    - **Property 13: Long-Press Shows Comparison**
    - **Validates: Requirements 5.2**
  - [x] 10.6 Write property test for background fallback
    - **Property 17: Background Fallback With Notification**
    - **Validates: Requirements 7.3**

- [x] 11. Checkpoint - Ensure core flow works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Integrate QuickTryButton into existing components
  - [x] 12.1 Add QuickTryButton to OutfitFeedCard
    - Position button consistently on card
    - Wire up to useOneTapTryOn
    - _Requirements: 2.1_
  - [x] 12.2 Add QuickTryButton to HomePage trending outfits
    - Add button to each trending outfit card
    - _Requirements: 2.3_
  - [x] 12.3 Add QuickTryButton to ClothingCard
    - Position button on clothing item cards
    - _Requirements: 2.2_

- [x] 13. Add translations for new UI strings
  - [x] 13.1 Add processing messages in all 6 languages
    - Fun rotating messages during AI processing
    - Scarcity and monetization messages
    - Error and guidance messages
    - _Requirements: 4.2, 6.1, 6.5_

- [x] 14. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete flow from button tap to result display
  - Test gem deduction and refund scenarios
  - Test body image upload and validation flow

## Notes

- All tasks including property tests are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
