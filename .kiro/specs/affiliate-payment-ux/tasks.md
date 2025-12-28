# Implementation Plan: Affiliate Engine, Payment Gateway & UX Improvements

## Overview

Triển khai Visual Search API cho affiliate engine, RevenueCat cho payment, và cải thiện UX với màu sắc mới, haptics, confetti, và enhanced loading states.

## Tasks

- [x] 1. Cập nhật Color Theme
  - [x] 1.1 Cập nhật tailwind.config.ts với màu mới
    - Thêm background: #FFFFFF, #F5F5F7
    - Thêm primary gradient: #8E2DE2 -> #4A00E0
    - Thêm gem colors: #FFD700
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 1.2 Tạo variant btn-magic cho Button
    - Gradient từ #8E2DE2 đến #4A00E0
    - Hover effect với brightness
    - _Requirements: 3.2, 3.4_
  - [x] 1.3 Cập nhật GemsCounter với màu vàng
    - Icon và text màu #FFD700
    - _Requirements: 3.3_

- [ ]* 1.4 Property test: Magic Gradient Application
  - **Property 9: Magic Gradient Application**
  - **Validates: Requirements 3.2, 3.4**

- [x] 2. Implement Haptics Service
  - [x] 2.1 Tạo src/services/haptics.ts
    - isSupported() check navigator.vibrate
    - trigger(type) với các loại: light, medium, heavy, success, error
    - Fallback cho devices không hỗ trợ
    - _Requirements: 4.4_
  - [x] 2.2 Tạo useHaptics hook
    - Wrap haptics service
    - Auto-check device support
    - _Requirements: 4.4_
  - [x] 2.3 Tích hợp haptics vào Generate button
    - Trigger light haptic khi bấm
    - _Requirements: 4.1_
  - [x] 2.4 Tích hợp haptics vào payment flow
    - Success haptic khi thanh toán thành công
    - Error haptic khi thất bại
    - _Requirements: 4.2, 4.3_

- [ ]* 2.5 Property test: Haptic Feedback Triggers
  - **Property 3: Haptic Feedback Triggers**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 3. Implement Confetti Service
  - [x] 3.1 Tạo src/services/confetti.ts
    - Sử dụng canvas-confetti (đã có)
    - fireSuccess() config cho payment
    - fireUpgrade() config cho Pro upgrade
    - Duration 2-3 seconds
    - _Requirements: 5.3_
  - [x] 3.2 Tích hợp confetti vào payment success
    - Fire confetti khi mua gems thành công
    - _Requirements: 5.1_
  - [x] 3.3 Tích hợp confetti vào Pro upgrade
    - Fire confetti khi upgrade Pro thành công
    - _Requirements: 5.2_

- [ ]* 3.4 Property test: Confetti on Success Events
  - **Property 4: Confetti on Success Events**
  - **Validates: Requirements 5.1, 5.2**

- [x] 4. Enhanced Loading States
  - [x] 4.1 Cập nhật AIProgressBar với steps mới
    - Steps: "Scanning Body..." -> "Warping Cloth..." -> "Finalizing..."
    - Vietnamese: "Đang quét cơ thể..." -> "Đang điều chỉnh quần áo..." -> "Đang hoàn thiện..."
    - _Requirements: 6.1_
  - [x] 4.2 Thêm progress percentage display
    - Hiển thị % bên cạnh step label
    - Animate smooth giữa các steps
    - _Requirements: 6.2_
  - [x] 4.3 Thêm timeout handling
    - Nếu quá 30s, hiện "Still working..."
    - _Requirements: 6.5_

- [ ]* 4.4 Property test: Progress Step Sequence
  - **Property 5: Progress Step Sequence**
  - **Validates: Requirements 6.1, 6.2, 6.5**

- [x] 5. Checkpoint - UX Improvements
  - ✅ Màu sắc mới: Magic gradient (#8E2DE2 -> #4A00E0), Gem gold (#FFD700)
  - ✅ Haptics: Light on Generate, Success/Error on payment
  - ✅ Confetti: On payment success và Pro upgrade
  - ✅ Loading states: Scanning → Warping → Generating → Finalizing → Complete
  - ✅ Timeout handling sau 30s

- [x] 6. Visual Search Edge Function
  - [x] 6.1 Tạo supabase/functions/visual-search/index.ts
    - Accept image URL hoặc base64
    - Call Google Vision API (Product Search)
    - Fallback to Bing Visual Search nếu fail
    - Return normalized product list
    - _Requirements: 1.1, 1.5_
  - [x] 6.2 Implement Google Vision integration
    - Setup Google Cloud credentials
    - Call Product Search API
    - Parse và normalize results
    - _Requirements: 1.1_
  - [x] 6.3 Implement Bing Visual Search fallback
    - Setup Bing API key
    - Call Visual Search API
    - Parse và normalize results
    - _Requirements: 1.5_
  - [x] 6.4 Implement affiliate link generation
    - Add Amazon affiliate tag
    - Add Shopee affiliate params
    - Include user tracking ID
    - _Requirements: 1.4_

- [ ]* 6.5 Property test: Tracking URL Construction
  - **Property 2: Tracking URL Construction**
  - **Validates: Requirements 1.4**

- [x] 7. Visual Search Frontend
  - [x] 7.1 Tạo useVisualSearch hook
    - Call visual-search edge function
    - Handle loading/error states
    - Cache results
    - _Requirements: 1.1, 1.6_
  - [x] 7.2 Cập nhật FindSimilarItemsSheet
    - Integrate với useVisualSearch
    - Show loading state với progress
    - Display real products từ API
    - Fallback to sample products nếu fail
    - _Requirements: 1.2, 1.5, 1.6_
  - [x] 7.3 Cập nhật AffiliateProductCard
    - Hiển thị đầy đủ: image, name, price, platform
    - Click mở tracking URL
    - Track click trong database
    - _Requirements: 1.3, 1.4_

- [ ]* 7.4 Property test: Affiliate Product Display
  - **Property 1: Affiliate Product Display Completeness**
  - **Validates: Requirements 1.2, 1.3**

- [x] 8. Checkpoint - Visual Search
  - Đảm bảo Visual Search API hoạt động
  - Đảm bảo fallback khi API fail
  - Đảm bảo affiliate links có tracking
  - Hỏi user nếu có thắc mắc

- [x] 9. RevenueCat Setup
  - [x] 9.1 Tạo src/services/revenueCat.ts
    - Initialize RevenueCat SDK
    - Configure API keys (iOS/Android)
    - Setup user identification
    - _Requirements: 2.1_
  - [x] 9.2 Tạo useRevenueCat hook
    - Wrap RevenueCat service
    - Expose offerings, purchase, restore
    - Handle customer info updates
    - _Requirements: 2.1, 2.7_
  - [x] 9.3 Setup RevenueCat products
    - Configure gem packages trong RevenueCat dashboard
    - Configure Pro subscription
    - Setup regional pricing (US/VN)
    - _Requirements: 2.2, 7.2_

- [x] 10. RevenueCat Integration
  - [x] 10.1 Cập nhật GemsPurchaseDialog
    - Fetch prices từ RevenueCat
    - Display localized prices
    - Handle purchase flow
    - _Requirements: 2.2, 2.3, 7.1, 7.3_
  - [x] 10.2 Cập nhật ProSubscriptionDialog
    - Fetch subscription price từ RevenueCat
    - Handle subscription purchase
    - Show success với confetti
    - _Requirements: 2.4, 5.2_
  - [x] 10.3 Cập nhật useUserGems
    - Sync với RevenueCat purchases
    - Update balance sau purchase
    - _Requirements: 2.5_
  - [x] 10.4 Cập nhật useProSubscription
    - Check entitlements từ RevenueCat
    - Handle subscription status
    - _Requirements: 2.7_
  - [x] 10.5 Handle purchase errors
    - Show user-friendly error messages
    - Trigger error haptic
    - Allow retry
    - _Requirements: 2.6_

- [ ]* 10.6 Property test: Purchase State Update
  - **Property 8: Purchase State Update**
  - **Validates: Requirements 2.5**

- [x] 11. Currency Localization
  - [x] 11.1 Tạo src/utils/currency.ts
    - formatPrice(amount, currency, locale)
    - getCurrencySymbol(currency)
    - Support USD, VND
    - _Requirements: 7.1, 7.4_
  - [x] 11.2 Cập nhật price displays
    - Use formatPrice trong GemsPurchaseDialog
    - Use formatPrice trong ProSubscriptionDialog
    - Use formatPrice trong AffiliateProductCard
    - _Requirements: 7.1, 7.3_

- [ ]* 11.3 Property test: Currency Localization
  - **Property 6: Currency Localization**
  - **Validates: Requirements 7.1, 7.3, 7.4**

- [ ]* 11.4 Property test: Regional Price Tiers
  - **Property 7: Regional Price Tiers**
  - **Validates: Requirements 7.2**

- [x] 12. Database Migrations
  - [x] 12.1 Cập nhật affiliate_clicks table
    - Add search_id, search_provider, image_hash columns
    - _Requirements: 1.4_
  - [x] 12.2 Tạo revenuecat_transactions table
    - user_id, transaction_id, product_id
    - purchase_date, expiration_date
    - is_sandbox, store
    - _Requirements: 2.5_

- [x] 13. Final Checkpoint
  - Đảm bảo tất cả UX improvements hoạt động
  - Đảm bảo Visual Search trả về kết quả
  - Đảm bảo RevenueCat purchases hoạt động
  - Đảm bảo currency localization đúng
  - Hỏi user nếu có thắc mắc

- [ ]* 14. Property-based tests tổng hợp
  - [ ]* 14.1 Run all property tests
    - Đảm bảo tất cả properties pass
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- RevenueCat cần setup trong dashboard trước khi test purchases
- Google Vision API cần Google Cloud project với billing enabled
- Bing Visual Search cần Azure subscription
- Haptics chỉ hoạt động trên mobile devices
- Regional pricing cần configure trong RevenueCat dashboard
- Test purchases nên dùng sandbox mode trước

## Environment Variables Needed

```
# Google Vision API
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_API_KEY=

# Bing Visual Search
BING_SEARCH_API_KEY=

# RevenueCat
REVENUECAT_API_KEY_IOS=
REVENUECAT_API_KEY_ANDROID=
REVENUECAT_API_KEY_WEB=

# Affiliate
AMAZON_AFFILIATE_TAG=
SHOPEE_AFFILIATE_ID=
```

