# Implementation Plan: TryOn Popup Dialog

## Overview

Triển khai TryOn Dialog để hiển thị giao diện thử đồ dưới dạng popup toàn màn hình. Tái sử dụng logic từ TryOnPage và tích hợp với các trigger points trong app.

## Tasks

- [x] 1. Tạo TryOnDialog component cơ bản
  - [x] 1.1 Tạo file `src/components/tryOn/TryOnDialog.tsx` với Dialog wrapper
    - Sử dụng Sheet component với side="bottom" cho mobile-friendly UX
    - Full-screen height với rounded top corners
    - Header với title và close button
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Tạo TryOnDialogContent component
    - Extract core UI từ TryOnPage vào component riêng
    - Nhận props cho initial state (initialItem, reuseBodyImage, etc.)
    - Quản lý internal state cho body image, selected items, processing
    - _Requirements: 1.3, 6.3_

  - [x] 1.3 Write property test cho dialog initialization
    - **Property 1: Dialog renders with initial items**
    - **Validates: Requirements 3.1, 6.3**

- [x] 2. Implement body image handling trong dialog
  - [x] 2.1 Tích hợp TryOnCanvas component
    - Reuse TryOnCanvas cho body image selection
    - Load default body image từ user profile
    - Handle body image upload và validation
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Implement body image persistence
    - Save body image to localStorage khi thay đổi
    - Load từ localStorage khi dialog mở
    - _Requirements: 2.4_

  - [x] 2.3 Write property tests cho body image
    - **Property 2: Default body image loading**
    - **Property 3: Body image persistence**
    - **Validates: Requirements 2.1, 2.4**

- [x] 3. Implement clothing selection trong dialog
  - [x] 3.1 Tích hợp SelectedClothingList component
    - Hiển thị outfit slots cho các category
    - Handle add/remove clothing items
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 3.2 Tích hợp ClothingPanel cho clothing selection
    - Show panel khi tap vào slot
    - Filter by category
    - Support saved và sample clothing
    - _Requirements: 3.2_

  - [x] 3.3 Write property test cho clothing list
    - **Property 4: Clothing list manipulation**
    - **Validates: Requirements 3.3, 3.4**

- [x] 4. Implement AI try-on processing trong dialog
  - [x] 4.1 Tích hợp useAITryOn hook
    - Connect với AI processing logic
    - Handle progress updates
    - Manage cooldown timer
    - _Requirements: 4.1, 4.2_

  - [x] 4.2 Implement try-on button logic
    - Enable/disable based on body image và clothing selection
    - Show loading state during processing
    - Handle quota check và login requirement
    - _Requirements: 4.1, 4.2_

  - [x] 4.3 Implement result display
    - Show AIResultModal khi processing hoàn thành
    - Handle success và error states
    - _Requirements: 4.3, 4.4_

  - [x] 4.4 Write property tests cho AI processing
    - **Property 5: Try-on button enablement**
    - **Property 6: Result display on success**
    - **Validates: Requirements 4.1, 4.3**

- [x] 5. Implement dialog navigation và close behavior
  - [x] 5.1 Implement close prevention during processing
    - Set canClose=false khi isProcessing=true
    - Block Escape key và close button during processing
    - Show confirmation nếu có unsaved result
    - _Requirements: 6.4_

  - [x] 5.2 Implement proper cleanup on close
    - Reset state khi dialog đóng
    - Cancel ongoing processing nếu có
    - _Requirements: 6.2_

  - [x] 5.3 Write property test cho close behavior
    - **Property 7: Close prevention during processing**
    - **Validates: Requirements 6.4**

- [x] 6. Tạo useTryOnDialog hook
  - [x] 6.1 Implement hook với context provider
    - Manage dialog open/close state
    - Store dialog options (initialItem, etc.)
    - Provide openDialog và closeDialog functions
    - _Requirements: 1.1_

  - [x] 6.2 Tạo TryOnDialogProvider component
    - Wrap app với provider
    - Render TryOnDialog component
    - _Requirements: 1.1_

- [x] 7. Tích hợp với trigger points
  - [x] 7.1 Update MobileNav
    - Replace navigation to `/try-on` với openDialog()
    - _Requirements: 1.1_

  - [x] 7.2 Update ClothingCard
    - "Thử đồ" button gọi openDialog với initialItem
    - _Requirements: 1.1, 3.1_

  - [x] 7.3 Update QuickTryFAB và QuickTrySheet
    - Trigger openDialog với initialGarmentUrl
    - Support autoStart option
    - _Requirements: 7.1, 7.2_

  - [x] 7.4 Write property tests cho Quick Try integration
    - **Property 8: Quick Try initialization**
    - **Property 9: Auto-start processing**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Final integration và polish
  - [x] 9.1 Update HistoryPage retry flow
    - Use openDialog với historyResult data
    - _Requirements: 1.1_

  - [x] 9.2 Add translations cho dialog
    - Add missing translation keys
    - _Requirements: 1.3_

  - [x] 9.3 Test full flows
    - Manual try-on flow
    - Quick Try flow
    - History retry flow
    - _Requirements: All_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tái sử dụng tối đa code từ TryOnPage để giảm duplication
- Sheet component với side="bottom" cho mobile-friendly slide-up animation
- Property tests sử dụng `fast-check` với vitest
- All property tests are required for comprehensive coverage
