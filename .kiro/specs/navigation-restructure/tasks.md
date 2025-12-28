# Implementation Plan: Navigation Restructure

## Overview

Triển khai cấu trúc navigation mới theo PRD với 5 vị trí: Home, Search, FAB (Studio), Community, Wardrobe. Bao gồm cập nhật MobileNav, Header, tạo SearchPage mới, và quản lý Studio overlay.

## Tasks

- [x] 1. Cập nhật MobileNav với cấu trúc mới
  - [x] 1.1 Cập nhật navItems array với thứ tự mới
    - Thay đổi: Home, Search, FAB, Community, Wardrobe
    - Thêm `isFab: true` cho item FAB
    - Cập nhật icons: Home, Search, Zap, Globe, FolderOpen
    - _Requirements: 1.1, 2.2, 3.2, 5.2, 6.2_
  - [x] 1.2 Tạo FAB component trong MobileNav
    - Size 56x56px, elevated -12px above nav bar
    - Primary/accent background color với shadow
    - Icon Zap (lightning bolt), không có label
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 9.4_
  - [x] 1.3 Cập nhật MobileNav props và logic
    - Thêm `onOpenStudio` callback prop
    - FAB click gọi `onOpenStudio` thay vì `onTabChange`
    - Loại bỏ 'tryOn' và 'compare' khỏi tab logic
    - _Requirements: 1.2, 4.4, 8.4_

- [x] 2. Thêm translation keys mới
  - [x] 2.1 Cập nhật translations.ts với keys mới
    - `nav_search`: Search/Tìm kiếm/搜索/검색/検索/ค้นหา
    - `nav_studio`: Studio (cho accessibility)
    - `nav_wardrobe`: Wardrobe/Tủ đồ/衣柜/옷장/ワードローブ/ตู้เสื้อผ้า
    - _Requirements: 10.1, 10.2_

- [x] 3. Cập nhật Header component
  - [x] 3.1 Thêm Gems button vào Header
    - Icon Gem/Diamond với số dư
    - Click mở gems purchase dialog (placeholder)
    - _Requirements: 7.3, 7.4_
  - [x] 3.2 Cập nhật layout Header
    - Giữ nguyên: Logo trái, Saved và Avatar phải
    - Thêm Gems button trước Saved
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Tạo SearchPage cơ bản
  - [x] 4.1 Tạo file `src/pages/SearchPage.tsx`
    - Search input với placeholder
    - Categories section (horizontal scroll)
    - Trending items section
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  - [x] 4.2 Tích hợp với clothing data
    - Fetch từ user_clothing hoặc sample data
    - Filter theo search query
    - _Requirements: 3.6_

- [x] 5. Cập nhật Index.tsx với navigation mới
  - [x] 5.1 Cập nhật MainApp state và logic
    - Thay đổi activeTab type: 'home' | 'search' | 'community' | 'wardrobe'
    - Thêm `isStudioOpen` state
    - Loại bỏ 'tryOn', 'compare' từ tab logic
    - _Requirements: 8.1, 8.3_
  - [x] 5.2 Cập nhật renderPage switch
    - home → HomePage
    - search → SearchPage
    - community → CommunityFeedPage
    - wardrobe → WardrobePage (hoặc ClosetPage)
    - _Requirements: 2.1, 3.1, 5.1, 6.1_
  - [x] 5.3 Implement Studio overlay
    - Render TryOnPage khi isStudioOpen = true
    - Full-screen overlay với close button
    - Không thay đổi activeTab khi mở/đóng
    - _Requirements: 1.2, 4.4, 8.4_
  - [x] 5.4 Cập nhật MobileNav props
    - Truyền onOpenStudio callback
    - _Requirements: 4.4_

- [x] 6. Checkpoint - Kiểm tra navigation cơ bản
  - Đảm bảo 5 tabs hiển thị đúng thứ tự
  - Đảm bảo FAB mở Studio overlay
  - Đảm bảo tab switching hoạt động
  - Hỏi user nếu có thắc mắc

- [x] 7. Cập nhật WardrobePage
  - [x] 7.1 Đảm bảo WardrobePage hiển thị outfit results
    - Sử dụng ClosetPage hoặc tạo mới
    - Grid layout cho saved outfits
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 8. Cleanup và refactor
  - [x] 8.1 Loại bỏ code không dùng
    - Xóa references đến 'tryOn' tab trong navigation
    - Xóa 'compare' tab từ MobileNav
    - Giữ ComparePage cho deep link nếu cần
    - _Requirements: 1.1_
  - [x] 8.2 Cập nhật các component khác
    - Cập nhật HomePage navigation callbacks
    - Cập nhật các nơi gọi setActiveTab('tryOn')
    - _Requirements: 8.1_

- [x] 9. Accessibility và responsive
  - [x] 9.1 Thêm aria labels cho navigation
    - aria-label cho mỗi tab button
    - aria-label cho FAB
    - _Requirements: 9.3_
  - [x] 9.2 Đảm bảo touch targets
    - Min 44x44px cho tabs
    - Min 56x56px cho FAB
    - _Requirements: 9.2, 9.4_
  - [x] 9.3 Safe area padding
    - Bottom navigation với safe-bottom class
    - _Requirements: 9.1_

- [x] 10. Final checkpoint
  - Đảm bảo tất cả navigation hoạt động
  - Kiểm tra translations 6 ngôn ngữ
  - Kiểm tra responsive trên mobile
  - Hỏi user nếu có thắc mắc

- [x] 11. Implement Gems System (Monetization - IAP)
  - [x] 11.1 Tạo useUserGems hook
    - Fetch gems balance từ Supabase
    - Sync với backend khi thay đổi
    - Cache local với React Query
    - _Requirements: 11.1, 11.6_
  - [x] 11.2 Tạo GemsCounter component
    - Hiển thị "💎 {balance}" với nút (+)
    - Click mở GemsPurchaseDialog
    - _Requirements: 11.1, 7.7_
  - [x] 11.3 Tạo GemsPurchaseDialog component
    - Option: Watch Ad for 1 Gem
    - Option: Buy 10 Gems - $0.99
    - Option: Buy 50 Gems - $3.99 (Best Value)
    - Option: Buy 120 Gems - $7.99
    - _Requirements: 11.3, 11.4, 11.5_
  - [x] 11.4 Tạo MonetizationGate component
    - Popup khi user hết gems
    - Options: Watch Ad hoặc Buy Gems
    - _Requirements: 11.3_

- [x] 12. Implement Pro Subscription
  - [x] 12.1 Tạo useProSubscription hook
    - Check subscription status
    - Handle subscription purchase
    - Verify với App Store/Play Store
    - _Requirements: 12.1, 12.6_
  - [x] 12.2 Tạo ProSubscriptionDialog component
    - Hiển thị features: 4K, No Gems, Badge
    - Price: $4.99/week
    - Subscribe button
    - _Requirements: 12.1, 12.3_
  - [x] 12.3 Cập nhật TryOnPage với 4K gate
    - 4K option với 👑 lock cho non-Pro
    - Click mở ProSubscriptionDialog
    - _Requirements: 12.2, 12.3, 12.4_
  - [x] 12.4 Thêm Pro badge cho subscribers
    - Hiển thị 👑 bên cạnh avatar
    - _Requirements: 12.5_

- [x] 13. Implement Affiliate Integration
  - [x] 13.1 Tạo AffiliateProductCard component
    - Image, name, price, platform
    - "Shop Now" CTA button
    - _Requirements: 13.4_
  - [x] 13.2 Tạo FindSimilarItemsSheet component
    - Hiển thị sau try-on result
    - Grid affiliate products
    - Links với tracking params
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 13.3 Tích hợp affiliate vào result page
    - Button "Find Similar Items"
    - Open external browser với tracking
    - _Requirements: 13.5_

- [x] 14. Implement Rewarded Ads
  - [x] 14.1 Tích hợp Ad SDK (AdMob/Unity Ads)
    - Setup rewarded video ads
    - Handle ad callbacks
    - _Requirements: 14.2_
  - [x] 14.2 Implement ad watching flow
    - Show ad khi user chọn "Watch Ad"
    - Credit 1 Gem sau khi xem xong
    - Track daily limit (max 5/day)
    - _Requirements: 14.1, 14.3, 14.5_
  - [x] 14.3 Handle ad errors
    - Retry logic
    - Fallback to IAP option
    - _Requirements: 14.4_

- [x] 15. Database migrations cho Monetization
  - [x] 15.1 Tạo bảng user_gems
    - user_id, balance, updated_at
    - _Requirements: 11.6_
  - [x] 15.2 Tạo bảng gem_transactions
    - user_id, amount, type, created_at
    - Types: purchase, ad_reward, spend
    - _Requirements: 11.4, 11.5, 14.3_
  - [x] 15.3 Tạo bảng user_subscriptions
    - user_id, plan, status, expires_at
    - _Requirements: 12.6_
  - [x] 15.4 Tạo bảng affiliate_clicks
    - user_id, product_id, platform, clicked_at
    - _Requirements: 13.3_

- [x] 16. Monetization Checkpoint
  - Đảm bảo Gems system hoạt động
  - Đảm bảo Pro subscription flow
  - Đảm bảo Affiliate links tracking
  - Đảm bảo Rewarded ads flow
  - Hỏi user nếu có thắc mắc

- [x]* 17. Property-based tests
  - [x]* 17.1 Test Property 1: Tab Order Consistency
    - **Property 1: Tab Order Consistency**
    - **Validates: Requirements 1.1, 4.1**
  - [x]* 17.2 Test Property 2: FAB Independence
    - **Property 2: FAB Independence from Tab State**
    - **Validates: Requirements 4.4, 8.4**
  - [x]* 17.3 Test Property 3: Single Active Tab
    - **Property 3: Single Active Tab**
    - **Validates: Requirements 8.3, 1.5**
  - [x]* 17.4 Test Property 4: Translation Completeness
    - **Property 4: Translation Completeness**
    - **Validates: Requirements 10.1, 10.2**
  - [x]* 17.5 Test Property 6: Gems Balance Non-Negative
    - **Property 6: Gems Balance Non-Negative**
    - **Validates: Requirements 11.1, 11.6**
  - [x]* 17.6 Test Property 7: Monetization Gate Trigger
    - **Property 7: Monetization Gate Trigger**
    - **Validates: Requirements 11.3, 12.4**
  - [x]* 17.7 Test Property 8: Ad Watch Limit
    - **Property 8: Ad Watch Limit**
    - **Validates: Requirements 14.5**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- FAB mở Studio dạng overlay, không phải tab switch
- Compare được loại bỏ khỏi main navigation nhưng giữ route cho deep link
- SearchPage là component mới, có thể bắt đầu với UI cơ bản và enhance sau
- WardrobePage có thể reuse ClosetPage hoặc tạo mới tùy theo yêu cầu
- **Monetization features (11-16) có thể implement sau navigation cơ bản**
- Ad SDK integration cần setup riêng cho iOS/Android (AdMob, Unity Ads)
- IAP cần setup App Store Connect và Google Play Console
- Affiliate tracking cần đăng ký với Amazon Associates, Shopee Affiliate, etc.
