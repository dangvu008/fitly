# Implementation Plan: Search & Shop (Affiliate Monetization)

## Overview

Triển khai trang Search & Shop mới với focus vào affiliate monetization. Trang bao gồm search input, visual categories, và curated collections với sản phẩm affiliate. Mỗi sản phẩm có nút "Try On" và "Buy".

## Tasks

- [x] 1. Tạo data và types cho Shop products
  - [x] 1.1 Tạo file `src/types/shop.ts` với interfaces
    - ShopProduct, ShopCategory, CuratedCollection types
    - AffiliateClick tracking type
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 1.2 Tạo file `src/data/curatedCollections.ts` với sample data
    - 3-4 curated collections với 4-6 products mỗi collection
    - Mix Amazon và Shopee products
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Tạo ShopProductCard component
  - [x] 2.1 Tạo file `src/components/shop/ShopProductCard.tsx`
    - Hiển thị product image, name, brand
    - Nút "⚡ Try On" với gradient purple
    - Nút "🛒 Buy $XX" với giá
    - Compact variant cho horizontal scroll
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 2.2 Implement Try On navigation
    - Navigate đến /try-on với product image
    - _Requirements: 5.5_
  - [x] 2.3 Implement Buy click với affiliate tracking
    - Track click trước khi mở URL
    - Mở affiliate URL trong tab mới
    - _Requirements: 5.6, 6.1, 6.2_

- [x] 3. Tạo VisualCategories component
  - [x] 3.1 Tạo file `src/components/shop/VisualCategories.tsx`
    - Horizontal scroll với category buttons
    - Icons: 👗 Dresses, 👔 Tops, 👖 Pants, 🧥 Outerwear
    - Selected state với highlight
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Tạo CollectionRow component
  - [x] 4.1 Tạo file `src/components/shop/CollectionRow.tsx`
    - Title và subtitle
    - Horizontal scrollable product cards
    - _Requirements: 4.2, 4.3_

- [x] 5. Tạo CuratedCollections component
  - [x] 5.1 Tạo file `src/components/shop/CuratedCollections.tsx`
    - Render multiple CollectionRow vertically
    - Filter by selected category
    - _Requirements: 4.1, 4.4_

- [x] 6. Tạo ShopSearchInput component
  - [x] 6.1 Tạo file `src/components/shop/ShopSearchInput.tsx`
    - Input với icon search
    - Placeholder "Paste Link or Search 'Denim Jacket'..."
    - URL detection logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Cập nhật SearchPage thành SearchShopPage
  - [x] 7.1 Refactor `src/pages/SearchPage.tsx`
    - Thêm header với title "SEARCH & SHOP"
    - Tích hợp GemsCounter, heart icon, avatar
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 7.2 Tích hợp ShopSearchInput
    - Replace existing search input
    - _Requirements: 2.1_
  - [x] 7.3 Tích hợp VisualCategories
    - Thêm section sau search input
    - _Requirements: 3.1_
  - [x] 7.4 Tích hợp CuratedCollections
    - Hiển thị collections khi không search
    - _Requirements: 4.1_
  - [x] 7.5 Implement search results view
    - Hiển thị kết quả khi có search query
    - _Requirements: 2.3_

- [x] 8. Tạo hook useAffiliateTracking
  - [x] 8.1 Tạo file `src/hooks/useAffiliateTracking.ts`
    - trackClick function
    - Lưu vào Supabase hoặc localStorage
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. Checkpoint - Kiểm tra cơ bản
  - Đảm bảo trang hiển thị đúng layout
  - Đảm bảo Try On và Buy buttons hoạt động
  - Đảm bảo category filter hoạt động
  - Hỏi user nếu có thắc mắc

- [x] 10. Property-based tests
  - [ ]* 10.1 Test Property 1: Category filter correctness
    - **Property 1: Category Filter Correctness**
    - Sử dụng fast-check để generate random products và categories
    - Verify: tất cả products hiển thị có category matching selected
    - **Validates: Requirements 3.3**
  - [ ]* 10.2 Test Property 3: Price display format
    - **Property 3: Price Display Format**
    - Sử dụng fast-check để generate random prices và currencies
    - Verify: price được format đúng theo currency locale
    - **Validates: Requirements 5.4**

- [x] 11. Final checkpoint
  - Đảm bảo tất cả tests pass
  - Kiểm tra responsive trên mobile
  - Hỏi user nếu có thắc mắc

## Notes

- Tận dụng existing components: GemsCounter, Header, AffiliateProductCard
- Curated collections là static data cho MVP, có thể move sang database sau
- Affiliate tracking có thể dùng localStorage cho MVP, Supabase cho production
- Focus vào UX smooth và CTA buttons nổi bật để tối ưu conversion

