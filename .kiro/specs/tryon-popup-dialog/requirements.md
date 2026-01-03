# Requirements Document

## Introduction

Tính năng này cho phép hiển thị trang thử đồ (TryOn) dưới dạng popup/dialog thay vì chuyển trang. Khi người dùng bấm nút "Thử đồ" từ bất kỳ đâu trong ứng dụng, một dialog toàn màn hình sẽ mở ra với đầy đủ chức năng thử đồ AI, giúp trải nghiệm mượt mà hơn và không làm mất context hiện tại của người dùng.

## Glossary

- **TryOn_Dialog**: Dialog toàn màn hình chứa giao diện thử đồ AI
- **Body_Image**: Ảnh toàn thân của người dùng để thử đồ
- **Clothing_Item**: Món đồ quần áo được chọn để thử
- **AI_TryOn**: Quá trình xử lý AI để tạo ảnh thử đồ ảo
- **Quick_Try**: Luồng thử đồ nhanh từ link sản phẩm hoặc ảnh

## Requirements

### Requirement 1: Mở TryOn Dialog

**User Story:** As a user, I want to open the try-on interface as a popup, so that I can try on clothes without leaving my current page.

#### Acceptance Criteria

1. WHEN a user clicks the "Thử đồ" button from any location THEN THE TryOn_Dialog SHALL open as a full-screen modal overlay
2. WHEN THE TryOn_Dialog opens THEN THE System SHALL preserve the user's current page state in the background
3. WHEN THE TryOn_Dialog opens THEN THE System SHALL display the complete try-on interface including body image area, clothing selection, and action buttons
4. IF the user presses the back button or Escape key THEN THE TryOn_Dialog SHALL close and return to the previous view

### Requirement 2: Body Image Selection trong Dialog

**User Story:** As a user, I want to select or upload my body image within the dialog, so that I can start trying on clothes immediately.

#### Acceptance Criteria

1. WHEN THE TryOn_Dialog opens THEN THE System SHALL load the user's default body image if available
2. WHEN a user clicks the body image area THEN THE System SHALL show options to upload new image or select from camera
3. WHEN a user uploads a new body image THEN THE System SHALL display it in the preview area
4. WHEN a body image is selected THEN THE System SHALL persist it for future sessions

### Requirement 3: Clothing Selection trong Dialog

**User Story:** As a user, I want to select clothing items within the dialog, so that I can build my outfit to try on.

#### Acceptance Criteria

1. WHEN THE TryOn_Dialog opens with an initial clothing item THEN THE System SHALL pre-select that item
2. WHEN a user taps a clothing slot THEN THE System SHALL show a panel to select from saved or sample clothing
3. WHEN a user selects a clothing item THEN THE System SHALL add it to the selected items list
4. WHEN a user removes a clothing item THEN THE System SHALL update the selected items list immediately

### Requirement 4: AI Try-On Processing trong Dialog

**User Story:** As a user, I want to generate AI try-on results within the dialog, so that I can see how clothes look on me.

#### Acceptance Criteria

1. WHEN a user has body image and at least one clothing item selected THEN THE System SHALL enable the "Thử đồ AI" button
2. WHEN a user clicks "Thử đồ AI" THEN THE System SHALL show a progress indicator within the dialog
3. WHEN AI processing completes successfully THEN THE System SHALL display the result image in a modal overlay
4. IF AI processing fails THEN THE System SHALL display an error message and allow retry

### Requirement 5: Result Actions trong Dialog

**User Story:** As a user, I want to save, share, or edit my try-on result within the dialog, so that I can manage my results without leaving.

#### Acceptance Criteria

1. WHEN a result is displayed THEN THE System SHALL show action buttons for save, share, edit, and retry
2. WHEN a user clicks save THEN THE System SHALL save the result to their history
3. WHEN a user clicks share THEN THE System SHALL open the share dialog
4. WHEN a user clicks close on the result THEN THE System SHALL return to the try-on interface within the dialog

### Requirement 6: Dialog Navigation và State

**User Story:** As a user, I want smooth navigation within the dialog, so that I can complete my try-on flow without confusion.

#### Acceptance Criteria

1. WHEN THE TryOn_Dialog is open THEN THE System SHALL prevent scrolling on the background page
2. WHEN a user closes THE TryOn_Dialog THEN THE System SHALL restore the previous page state exactly
3. WHEN THE TryOn_Dialog receives props for initial items THEN THE System SHALL initialize with those items
4. WHILE THE TryOn_Dialog is processing THEN THE System SHALL prevent accidental closure

### Requirement 7: Integration với Quick Try Flow

**User Story:** As a user, I want the Quick Try flow to use the popup dialog, so that I have a consistent experience.

#### Acceptance Criteria

1. WHEN a user triggers Quick Try from clipboard link THEN THE System SHALL open TryOn_Dialog with the garment pre-loaded
2. WHEN a user triggers Quick Try from product page THEN THE System SHALL open TryOn_Dialog with the product image
3. WHEN auto-start is enabled THEN THE System SHALL automatically begin AI processing when body image and garment are ready
