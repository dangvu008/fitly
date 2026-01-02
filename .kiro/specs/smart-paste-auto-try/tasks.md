# Implementation Plan: Smart Paste & Auto-Try

## Overview

Triển khai tính năng "Smart Paste & Auto-Try" cho phép user thử đồ nhanh từ link mua sắm, screenshot, hoặc trong app chỉ với 1-2 thao tác.

## Tasks

### Phase 1: TryOnPage Refactor (Foundation)

- [x] 1. Refactor TryOnPage để nhận initial props
  - [x] 1.1 Thêm props mới vào TryOnPageProps
    - `initialGarmentUrl?: string`
    - `initialGarmentId?: string`
    - `autoStart?: boolean`
    - _Requirements: REQ-7.1_
  - [x] 1.2 Implement useEffect logic cho initial garment
    - Tự động set garment vào selectedItems
    - Tự động load Default Body Image
    - Hiển thị toast "Outfit loaded!"
    - _Requirements: REQ-7.2, REQ-7.3, REQ-7.4_
  - [x] 1.3 Implement auto-start logic
    - Nếu `autoStart=true` và có Default Body Image, tự động trigger try-on
    - Nếu không có Default Body Image, hiển thị BodyImagePrompt
    - _Requirements: REQ-7.5, REQ-0.2_
  - [x] 1.4 Property test: Initial Garment Auto-Load
    - **Property 1: Initial Garment URL Sets Selected Items**
    - **Validates: REQ-7.2**

- [x] 2. Cập nhật QuickTryButton để navigate với params
  - [x] 2.1 Thêm navigation logic vào QuickTryButton
    - Navigate đến /try-on với query params
    - Truyền garmentUrl và garmentId
    - _Requirements: REQ-8.1, REQ-8.2_
  - [x] 2.2 Cập nhật Index.tsx để handle Quick Try
    - Thêm handleQuickTry function
    - Truyền props vào TryOnPage
    - _Requirements: REQ-8.1_
  - [x] 2.3 Property test: Quick Try Navigation
    - **Property 2: QuickTryButton Navigates With Garment URL**
    - **Validates: REQ-8.1, REQ-8.2**

- [x] 3. Checkpoint - Verify TryOnPage refactor
  - Đảm bảo TryOnPage hoạt động với initial props
  - Đảm bảo QuickTryButton navigate đúng
  - Test manual mode vẫn hoạt động bình thường

### Phase 2: Clipboard Detection (Flow 1)

- [x] 4. Tạo useClipboardDetection hook
  - [x] 4.1 Implement clipboard reading logic
    - Sử dụng Clipboard API
    - Check permission trước khi đọc
    - _Requirements: REQ-1.1, REQ-13.1_
  - [x] 4.2 Implement shopping link detection
    - Regex patterns cho các platform
    - Detect: Shopee, Zara, TikTok, Lazada, Amazon
    - _Requirements: REQ-1.2_
  - [x] 4.3 Implement processed links tracking
    - Lưu links đã xử lý vào localStorage
    - Không hiện toast cho link đã xử lý
    - _Requirements: REQ-1.5_
  - [x] 4.4 Property test: Shopping Link Detection
    - **Property 3: Valid Shopping URLs Are Detected**
    - **Validates: REQ-1.2**

- [x] 5. Tạo ClipboardLinkToast component
  - [x] 5.1 Tạo UI component
    - Platform icon và tên
    - Message "Phát hiện link..."
    - Nút "⚡ Thử Ngay" và "Bỏ qua"
    - _Requirements: REQ-1.3, REQ-1.4_
  - [x] 5.2 Implement auto-dismiss
    - Auto-dismiss sau 15 giây
    - Dismiss khi user click outside
    - _Requirements: REQ-1.4_
  - [x] 5.3 Property test: Toast Display
    - **Property 4: Toast Shows Platform Info**
    - **Validates: REQ-1.3**

- [x] 6. Tạo crawl-product-image Edge Function
  - [x] 6.1 Setup Edge Function structure
    - CORS headers
    - Request validation
    - _Requirements: REQ-2.1_
  - [x] 6.2 Implement generic crawler
    - Extract og:image meta tag
    - Platform detection
    - _Requirements: REQ-2.2_
  - [x] 6.3 Implement fallback extraction
    - Try multiple meta tags
    - Generic image extraction
    - _Requirements: REQ-2.2, REQ-2.4_
  - [x] 6.4 Implement background removal integration
    - Call existing remove-background service
    - Return processed image
    - _Requirements: REQ-2.5_
  - [x] 6.5 Property test: Product Image Extraction
    - **Property 5: Valid Product URL Returns Image**
    - **Validates: REQ-2.1, REQ-2.3**

- [x] 7. Tạo useSmartPaste hook (orchestration)
  - [x] 7.1 Integrate useClipboardDetection
    - Check clipboard on app focus
    - Manage detected link state
    - _Requirements: REQ-1.1_
  - [x] 7.2 Implement crawl and try flow
    - Call crawl-product-image
    - Navigate to TryOnPage với crawled image
    - _Requirements: REQ-3.1, REQ-3.2_
  - [x] 7.3 Property test: End-to-End Link Flow
    - **Property 6: Detected Link Triggers Crawl And Navigate**
    - **Validates: REQ-3.1, REQ-3.2**

- [x] 8. Integrate clipboard detection vào App
  - [x] 8.1 Add ClipboardLinkToast vào Index.tsx
    - Render toast khi có detected link
    - Handle "Thử Ngay" click
    - _Requirements: REQ-1.3_
  - [x] 8.2 Add focus listener cho clipboard check
    - Check clipboard khi window focus
    - Debounce để tránh spam
    - _Requirements: REQ-1.1, REQ-12.1_

- [x] 9. Checkpoint - Verify Flow 1
  - Test copy link từ Shopee → mở app → toast hiện
  - Test click "Thử Ngay" → crawl → navigate → try-on
  - Test dismiss và processed links tracking

### Phase 3: Screenshot Smart Crop (Flow 2)

- [x] 10. Tạo QuickTryFAB component
  - [x] 10.1 Tạo FAB UI
    - Vị trí center bottom
    - Icon ⚡ với gradient
    - Pulse animation
    - _Requirements: REQ-4.1_
  - [x] 10.2 Property test: FAB Visibility
    - **Property 7: FAB Is Visible On Main Screens**
    - **Validates: REQ-4.1**

- [x] 11. Tạo QuickTrySheet component
  - [x] 11.1 Tạo bottom sheet UI
    - Tabs: "Dán Link", "Từ Thư viện", "Chụp ảnh"
    - Image picker integration
    - _Requirements: REQ-4.2, REQ-4.3_
  - [x] 11.2 Implement paste from clipboard
    - Link input với validation
    - Platform detection
    - _Requirements: REQ-4.3_
  - [x] 11.3 Property test: Image Selection
    - **Property 8: Selected Image Is Passed To Handler**
    - **Validates: REQ-4.3**

- [x] 12. Tạo smart-crop-clothing Edge Function
  - [x] 12.1 Setup Edge Function
    - Accept base64 image
    - Return crop bounds và cropped image
    - _Requirements: REQ-5.1_
  - [x] 12.2 Implement clothing detection
    - Use object detection (Hugging Face hoặc custom)
    - Filter UI elements
    - Return largest clothing item
    - _Requirements: REQ-5.1, REQ-5.2_
  - [x] 12.3 Implement background removal
    - Call existing service
    - Return background-removed image
    - _Requirements: REQ-5.4_
  - [x] 12.4 Property test: Clothing Detection
    - **Property 9: Screenshot With Clothing Returns Crop**
    - **Validates: REQ-5.1, REQ-5.2**

- [x] 13. Tạo SmartCropPreview component
  - [x] 13.1 Tạo preview UI
    - Original vs Cropped side-by-side
    - Highlight crop area
    - _Requirements: REQ-5.3_
  - [x] 13.2 Implement manual adjustment option
    - Allow user to adjust crop bounds
    - Re-process với new bounds
    - _Requirements: REQ-5.3, REQ-5.5_
  - [x] 13.3 Property test: Crop Preview
    - **Property 10: Crop Preview Shows Both Images**
    - **Validates: REQ-5.3**

- [x] 14. Integrate Flow 2 vào App
  - [x] 14.1 Add QuickTryFAB vào main layout
    - Show trên Home, Search, Closet pages
    - Hide khi đang ở TryOnPage
    - _Requirements: REQ-4.1_
  - [x] 14.2 Wire up QuickTrySheet → TryOnPage
    - Full flow từ FAB click đến result
    - _Requirements: REQ-6.1, REQ-6.2, REQ-6.3_

- [x] 15. Checkpoint - Verify Flow 2
  - Test FAB click → sheet → select image → try-on
  - Test link input → crawl → try-on
  - Test error cases

### Phase 4: Polish & Integration

- [x] 16. Error handling và fallbacks
  - [x] 16.1 Implement crawl error handling
    - Show error toast với retry option
    - Fallback to manual upload
    - _Requirements: REQ-10.1, REQ-10.2_
  - [x] 16.2 Implement smart crop fallbacks
    - Manual crop khi AI fail
    - Multiple items selection
    - _Requirements: REQ-5.5, REQ-10.2_
  - [x] 16.3 Property test: Error Recovery
    - **Property 11: Errors Show Fallback Options**
    - **Validates: REQ-10.1, REQ-10.2**

- [x] 17. Gem/Quota integration
  - [x] 17.1 Add gem check trước khi process
    - Check balance trong useSmartPaste
    - Show GemGate nếu không đủ
    - _Requirements: REQ-11.1, REQ-11.2_
  - [x] 17.2 Property test: Gem Gate
    - **Property 12: Insufficient Gems Shows Gate**
    - **Validates: REQ-11.1, REQ-11.2**

- [x] 18. Settings cho clipboard detection
  - [x] 18.1 Add toggle trong Settings page
    - Enable/disable clipboard detection
    - Persist trong localStorage
    - _Requirements: REQ-13.3_
  - [x] 18.2 Property test: Settings Persistence
    - **Property 13: Clipboard Setting Is Persisted**
    - **Validates: REQ-13.3**

- [x] 19. Translations
  - [x] 19.1 Add translations cho tất cả UI strings
    - Toast messages
    - Sheet labels
    - Error messages
    - 6 languages: vi, en, zh, ko, ja, th
    - _Requirements: REQ-9.1_

- [x] 20. Final Checkpoint
  - Test complete Flow 1: Link → Toast → Crawl → Try-On
  - Test complete Flow 2: FAB → Sheet → Crop → Try-On
  - Test complete Flow 3: QuickTryButton → Navigate → Auto-Load
  - Test error cases và fallbacks
  - Test gem deduction
  - Test settings toggle

## Notes

- Phase 1 là foundation, cần hoàn thành trước khi làm Phase 2-3
- Edge functions cần test với real URLs từ các platform
- Smart crop có thể dùng Hugging Face models hoặc custom solution
- Clipboard API có thể không hoạt động trên một số browsers cũ
- Consider rate limiting cho crawl requests

## Dependencies

- Existing: useDefaultBodyImage, useOneTapTryOn, ProcessingAnimation, ResultPreview, GemGate
- New Edge Functions: crawl-product-image, smart-crop-clothing
- External APIs: Có thể cần proxy để crawl một số sites

## Environment Variables

```
# Crawling (optional, for rate limiting bypass)
CRAWL_PROXY_URL=

# Smart Crop (if using external API)
HUGGINGFACE_API_KEY=
```
