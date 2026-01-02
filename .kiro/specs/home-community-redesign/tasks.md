# Implementation Plan: Home & Community Redesign

## Overview

Triển khai redesign cho Home Page và Community Page để tạo sự khác biệt rõ ràng giữa hai trang. Home tập trung vào khám phá với horizontal scroll sections, Community tập trung vào social với Instagram-style cards.

## Tasks

- [x] 1. Create HorizontalScrollSection component
  - [x] 1.1 Create `src/components/home/HorizontalScrollSection.tsx` with props interface
    - Implement horizontal scrollable container with CSS scroll-snap
    - Add section header with icon and "View All" link
    - Add peek indicators for scroll affordance
    - _Requirements: 2.1, 2.2, 6.4_
  - [x] 1.2 Write property test for item count constraint
    - **Property 2: Horizontal Section Item Count**
    - **Validates: Requirements 2.5**

- [x] 2. Create HomeOutfitCard component
  - [x] 2.1 Create `src/components/home/HomeOutfitCard.tsx`
    - Implement card with 3:4 aspect ratio image
    - Add small user avatar overlay (24px) at top-left
    - Add prominent gradient "Try This" button at bottom
    - Support both 'horizontal' and 'grid' variants
    - _Requirements: 5.1, 5.5, 2.6_
  - [x] 2.2 Write unit tests for HomeOutfitCard
    - Test gradient button presence
    - Test click handlers
    - _Requirements: 5.1_

- [x] 3. Refactor HomePage with new sections
  - [x] 3.1 Update `src/pages/HomePage.tsx` structure
    - Keep existing History Section at top (already implemented)
    - Add "New Arrivals" HorizontalScrollSection
    - Add "Trending Styles" HorizontalScrollSection
    - Convert bottom section to "For You" 2-column grid
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 6.1_
  - [x] 3.2 Write property test for history item limit
    - **Property 1: History Section Item Limit**
    - **Validates: Requirements 1.5**

- [x] 4. Checkpoint - Verify Home Page changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create CommunityOutfitCard component
  - [x] 5.1 Create `src/components/feed/CommunityOutfitCard.tsx`
    - Implement card with larger user avatar (32px) and name at top
    - Add outfit image with 4:5 or 1:1 aspect ratio
    - Add likes/comments row with small outline "Try" button
    - Add caption text (2-3 lines, truncated)
    - _Requirements: 3.1, 3.2, 3.3, 5.2, 5.3, 5.4_
  - [x] 5.2 Write property test for caption rendering
    - **Property 3: Caption Rendering in Community Cards**
    - **Validates: Requirements 3.2**

- [x] 6. Create CommunityFeedLayout component
  - [x] 6.1 Create `src/components/feed/CommunityFeedLayout.tsx`
    - Implement single-column layout (default, Instagram-style)
    - Implement masonry layout option for 2-column view
    - Add layout toggle if needed
    - _Requirements: 4.1, 4.2_
  - [x] 6.2 Write unit tests for layout modes
    - Test single-column renders full-width cards
    - Test masonry renders 2-column grid
    - _Requirements: 4.1, 4.2_

- [x] 7. Refactor CommunityFeedPage with new design
  - [x] 7.1 Update `src/pages/CommunityFeedPage.tsx`
    - Remove any history section (differentiate from Home)
    - Use CommunityFeedLayout with CommunityOutfitCard
    - Keep filter chips (Trending, Latest, Following)
    - Implement single-column as default layout
    - _Requirements: 4.3, 4.4, 4.5, 6.2_
  - [x] 7.2 Write unit tests for Community page
    - Test History section is NOT rendered
    - Test filter chips are present
    - _Requirements: 4.5, 6.2_

- [x] 8. Checkpoint - Verify Community Page changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add data fetching hooks for new sections
  - [x] 9.1 Create/update hooks for Home page sections
    - Add `useNewArrivals` hook or filter in existing hook
    - Add `useTrendingOutfits` hook or filter in existing hook
    - Ensure proper caching with React Query
    - _Requirements: 2.1, 2.2_

- [x] 10. Final integration and polish
  - [x] 10.1 Wire up navigation and interactions
    - Ensure "Try This" buttons work on both pages
    - Ensure outfit detail navigation works
    - Test infinite scroll on both pages
    - _Requirements: 1.4, 4.4_
  - [x] 10.2 Add responsive adjustments
    - Ensure horizontal scroll works on mobile
    - Adjust card sizes for different screen widths
    - _Requirements: 2.4_

- [x] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
