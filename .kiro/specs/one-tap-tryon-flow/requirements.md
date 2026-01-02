# Requirements Document

## Introduction

Tính năng "One-Tap Try-On Flow" tối ưu hóa trải nghiệm thử đồ ảo để đạt được mục tiêu "1 chạm = thử ngay". Khi người dùng đang lướt feed và thấy một bộ đồ đẹp, họ có thể bấm nút ⚡ Try và ngay lập tức thấy kết quả AI ghép đồ lên ảnh của mình - không cần qua nhiều bước phức tạp.

Tính năng này giải quyết các pain points chính của người dùng:
- "Mẫu mặc thì đẹp, nhưng mình mặc lên trông như... cái bao tải" → Xem ngay trên người mình
- "Cái áo này có hợp với cái quần mình đang có ở nhà không?" → Thử ngay lập tức
- Instant Gratification: Muốn biết mình mặc bộ đó trông ra sao ngay bây giờ

## Glossary

- **One_Tap_Try_On**: Luồng thử đồ tối ưu cho phép người dùng thử đồ chỉ với 1 chạm từ bất kỳ đâu trong app
- **Default_Body_Image**: Ảnh toàn thân mặc định của người dùng, được lưu trong profile để sử dụng cho quick try-on
- **Quick_Try_Button**: Nút ⚡ hiển thị trên mỗi outfit/clothing item cho phép thử ngay lập tức
- **Processing_Animation**: Animation vui nhộn hiển thị trong lúc AI đang xử lý (10-15s)
- **Result_Preview**: Màn hình hiển thị kết quả try-on với các action: Compare, Download, Shop, Share
- **Body_Image_Prompt**: Dialog nhắc người dùng upload ảnh toàn thân nếu chưa có Default_Body_Image
- **Gem_Gate**: Kiểm tra và xử lý thanh toán Gem trước khi chạy AI

## Requirements

### Requirement 1: Default Body Image Setup

**User Story:** Là người dùng, tôi muốn lưu một ảnh toàn thân mặc định để mỗi lần thử đồ không cần chọn lại ảnh, giúp trải nghiệm nhanh hơn.

#### Acceptance Criteria

1. WHEN a user first opens the app THEN the One_Tap_Try_On system SHALL prompt them to upload a Default_Body_Image during onboarding
2. WHEN a user has no Default_Body_Image and taps Quick_Try_Button THEN the One_Tap_Try_On system SHALL display Body_Image_Prompt with options to upload or take a selfie
3. WHEN a user uploads a body image THEN the One_Tap_Try_On system SHALL validate the image contains a full body
4. WHEN a body image is validated successfully THEN the One_Tap_Try_On system SHALL save it as Default_Body_Image in user profile
5. WHEN a user wants to change their Default_Body_Image THEN the One_Tap_Try_On system SHALL provide an option in profile settings
6. IF body image validation fails THEN the One_Tap_Try_On system SHALL display helpful guidance on how to take a proper full-body photo

### Requirement 2: Quick Try Button Placement

**User Story:** Là người dùng đang lướt feed, tôi muốn thấy nút "Try" đập vào mắt trên mỗi outfit để tôi có thể thử ngay với 1 chạm.

#### Acceptance Criteria

1. WHEN displaying an outfit card in feed THEN the One_Tap_Try_On system SHALL show a prominent Quick_Try_Button with ⚡ icon
2. WHEN displaying a clothing item card THEN the One_Tap_Try_On system SHALL show Quick_Try_Button at a consistent position
3. WHEN displaying trending outfits on home page THEN the One_Tap_Try_On system SHALL show Quick_Try_Button on each outfit card
4. WHEN a user hovers or focuses on an outfit card THEN the One_Tap_Try_On system SHALL highlight the Quick_Try_Button
5. THE Quick_Try_Button SHALL use gradient styling (primary to accent) to stand out visually

### Requirement 3: One-Tap Try-On Flow

**User Story:** Là người dùng, tôi muốn bấm nút Try và ngay lập tức thấy kết quả AI ghép đồ lên ảnh của mình, không cần qua nhiều bước.

#### Acceptance Criteria

1. WHEN a user with Default_Body_Image taps Quick_Try_Button THEN the One_Tap_Try_On system SHALL immediately start AI processing without additional prompts
2. WHEN a user without Default_Body_Image taps Quick_Try_Button THEN the One_Tap_Try_On system SHALL show Body_Image_Prompt first
3. WHEN AI processing starts THEN the One_Tap_Try_On system SHALL check Gem balance via Gem_Gate
4. IF user has sufficient Gems THEN the One_Tap_Try_On system SHALL deduct Gems and proceed with AI processing
5. IF user has insufficient Gems THEN the One_Tap_Try_On system SHALL show options: "Watch ad for 1 Gem" or "Purchase Gems"
6. WHEN AI processing is running THEN the One_Tap_Try_On system SHALL display Processing_Animation with fun messages
7. WHEN AI processing completes THEN the One_Tap_Try_On system SHALL display Result_Preview immediately

### Requirement 4: Processing Animation Experience

**User Story:** Là người dùng, tôi muốn thấy animation vui nhộn trong lúc chờ AI xử lý để không cảm thấy sốt ruột.

#### Acceptance Criteria

1. WHILE AI processing is running THEN the One_Tap_Try_On system SHALL display an animated skeleton loader
2. WHILE AI processing is running THEN the One_Tap_Try_On system SHALL show rotating fun messages like "Đang ướm thử vừa vặn với eo của bạn..."
3. WHILE AI processing is running THEN the One_Tap_Try_On system SHALL display estimated time remaining
4. WHEN AI processing takes longer than expected THEN the One_Tap_Try_On system SHALL update message to reassure user
5. THE Processing_Animation SHALL maintain user engagement during the 10-15 second wait time

### Requirement 5: Result Preview Actions

**User Story:** Là người dùng, khi thấy kết quả try-on đẹp, tôi muốn có thể so sánh Before/After, tải về HD, tìm link mua, hoặc chia sẻ ngay.

#### Acceptance Criteria

1. WHEN Result_Preview is displayed THEN the One_Tap_Try_On system SHALL show the try-on result image prominently
2. WHEN a user long-presses on Result_Preview THEN the One_Tap_Try_On system SHALL show Before/After comparison
3. WHEN Result_Preview is displayed THEN the One_Tap_Try_On system SHALL show "Download HD" button (triggers Pro upsell if not subscribed)
4. WHEN Result_Preview is displayed THEN the One_Tap_Try_On system SHALL show "Shop Now" button linking to affiliate purchase
5. WHEN Result_Preview is displayed THEN the One_Tap_Try_On system SHALL show "Share" button for social sharing
6. WHEN Result_Preview is displayed THEN the One_Tap_Try_On system SHALL show "Try Another" button to quickly try different outfit
7. WHEN a user is not satisfied with result THEN the One_Tap_Try_On system SHALL provide "Retry" option with same outfit

### Requirement 6: Scarcity and Monetization Prompts

**User Story:** Là người dùng, tôi muốn được nhắc nhở về việc nạp tiền một cách khéo léo, không thô thiển.

#### Acceptance Criteria

1. WHEN user has 1 free try remaining THEN the One_Tap_Try_On system SHALL display message "Bạn còn 1 lượt thử miễn phí cuối cùng. Hãy chọn bộ đẹp nhất nhé!"
2. WHEN user runs out of Gems THEN the One_Tap_Try_On system SHALL show friendly prompt with watch-ad and purchase options
3. WHEN displaying Gem purchase options THEN the One_Tap_Try_On system SHALL highlight best value package
4. WHEN user completes a successful try-on THEN the One_Tap_Try_On system SHALL show Gem balance subtly
5. THE monetization prompts SHALL use positive, encouraging language rather than blocking messages

### Requirement 7: Background Preservation

**User Story:** Là người dùng, tôi muốn kết quả try-on giữ nguyên bối cảnh ảnh gốc của tôi (ví dụ: đang đứng ở bãi biển) để cảm giác thật hơn.

#### Acceptance Criteria

1. WHEN AI processes try-on THEN the One_Tap_Try_On system SHALL preserve the original background from user's body image
2. WHEN displaying Result_Preview THEN the One_Tap_Try_On system SHALL maintain the same environment/setting as the original photo
3. IF background preservation fails THEN the One_Tap_Try_On system SHALL fall back to neutral background with notification to user

