# Implementation Plan: Community Feed

## Overview

Triển khai trang Community Feed với 3 tab (Following, Explore, Ranking), tích hợp infinite scroll, và các tính năng tương tác xã hội. Tận dụng các component hiện có như OutfitFeedCard, TryOutfitButton, CommentsSheet.

## Tasks

- [x] 1. Tạo hook useCommunityFeed
  - [x] 1.1 Tạo file `src/hooks/useCommunityFeed.ts` với interface và state management
    - Định nghĩa type FeedTab: 'following' | 'explore' | 'ranking'
    - State: activeTab, outfits theo từng tab, loading states
    - Tích hợp với useOutfitFeed hiện có
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 1.2 Implement logic fetch outfits theo tab
    - Following: lọc theo user_id trong danh sách following
    - Explore: fetch tất cả outfits, sắp xếp theo created_at
    - Ranking: sắp xếp theo likes_count giảm dần
    - _Requirements: 1.3, 1.4, 1.5_
  - [x] 1.3 Implement infinite scroll với loadMore
    - Pagination với PAGE_SIZE = 10
    - hasMore state để kiểm tra còn data không
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Tạo các component UI cho Community Feed
  - [x] 2.1 Tạo FeedHeader component (`src/components/feed/FeedHeader.tsx`)
    - Title "Community Feed"
    - Saved button navigate đến SavedOutfitsPage
    - User avatar navigate đến ProfilePage
    - _Requirements: 1.1_
  - [x] 2.2 Tạo FeedTabs component (`src/components/feed/FeedTabs.tsx`)
    - 3 tabs: Following, Explore, Ranking
    - Props: activeTab, onTabChange
    - Sử dụng shadcn Tabs component
    - _Requirements: 1.2_
  - [x] 2.3 Tạo FloatingCreateButton component (`src/components/feed/FloatingCreateButton.tsx`)
    - Floating action button góc dưới phải
    - Icon Plus, navigate đến create post flow
    - _Requirements: 6.1, 6.2_

- [x] 3. Tạo trang CommunityFeedPage
  - [x] 3.1 Tạo file `src/pages/CommunityFeedPage.tsx`
    - Kết hợp FeedHeader, FeedTabs, feed list, FloatingCreateButton
    - Sử dụng useCommunityFeed hook
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Implement feed list với OutfitFeedCard
    - Map outfits từ hook sang OutfitFeedCard
    - Truyền đúng props cho interactions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.3 Implement infinite scroll behavior
    - Detect scroll gần bottom
    - Gọi loadMore từ hook
    - Hiển thị loading indicator
    - _Requirements: 2.1, 2.2_
  - [x] 3.4 Implement empty states cho từng tab
    - Following: "Follow users to see their outfits"
    - Explore: "No outfits yet"
    - Ranking: Hiển thị sample outfits
    - _Requirements: 2.4_

- [x] 4. Tích hợp routing và navigation
  - [x] 4.1 Thêm route cho CommunityFeedPage trong App.tsx
    - Route path: /community
    - _Requirements: 1.1_
  - [x] 4.2 Cập nhật navigation links
    - Thêm link đến Community Feed trong MobileNav
    - _Requirements: 1.1_

- [x] 5. Checkpoint - Kiểm tra cơ bản
  - Đảm bảo trang hiển thị đúng với 3 tabs
  - Đảm bảo infinite scroll hoạt động
  - Đảm bảo OutfitFeedCard hiển thị đầy đủ thông tin
  - Hỏi user nếu có thắc mắc

- [x] 6. Implement interactions
  - [x] 6.1 Tích hợp CommentsSheet
    - Mở sheet khi click comment button
    - Hiển thị comments và input field
    - _Requirements: 5.2_
  - [x] 6.2 Tích hợp share functionality
    - Copy link to clipboard khi click share button
    - _Requirements: 5.3_
  - [x] 6.3 Implement navigate to user profile
    - Click avatar/username navigate đến /user/:userId
    - _Requirements: 5.4_

- [x] 7. Implement create post flow
  - [x] 7.1 Tạo FloatingCreateButton với dropdown menu
    - Option 1: Tạo outfit mới (navigate to /try-on)
    - Option 2: Chia sẻ từ lịch sử (navigate to /history)
    - _Requirements: 6.2, 6.3_

- [x] 8. Final checkpoint
  - Đảm bảo tất cả tests pass
  - Kiểm tra responsive trên mobile
  - Hỏi user nếu có thắc mắc

- [x] 9. Property-based tests
  - [x] 9.1 Test Property 1: Following tab filters by followed users
    - **Property 1: Following tab filters by followed users**
    - File `src/hooks/useCommunityFeed.test.ts` đã được tạo
    - Sử dụng fast-check để generate random outfits và followed user sets
    - Verify: tất cả outfits trong Following tab có user_id thuộc followed users set
    - **Validates: Requirements 1.3**
  - [x] 9.2 Test Property 2: Ranking tab sorts by likes descending
    - **Property 2: Ranking tab sorts by likes descending**
    - Thêm test vào `src/hooks/useCommunityFeed.test.ts`
    - Sử dụng fast-check để generate random outfits với likes_count
    - Verify: outfit[i].likes_count >= outfit[i+1].likes_count cho mọi i
    - **Validates: Requirements 1.5**
  - [x] 9.3 Test Property 6: Like toggle updates state correctly
    - **Property 6: Like toggle updates state correctly**
    - Thêm test vào `src/hooks/useCommunityFeed.test.ts`
    - Sử dụng fast-check để generate random outfit states
    - Verify: toggle like flips isLiked và adjusts likes_count by ±1
    - **Validates: Requirements 5.1**

## Notes

- ✅ Tất cả tasks đã hoàn thành
- ✅ Tất cả 11 property-based tests pass (verified: 2024-12-28)
- Property-based tests sử dụng fast-check (đã có trong devDependencies)
- Tận dụng tối đa các component hiện có: OutfitFeedCard, TryOutfitButton, CommentsSheet
- Route /community đã được thêm vào Index.tsx
- Navigation đã được cập nhật trong MobileNav với icon Globe
- Test file: `src/hooks/useCommunityFeed.test.ts` với 3 property tests đầy đủ
