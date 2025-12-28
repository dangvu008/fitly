# Requirements Document

## Introduction

Tích hợp Affiliate Engine sử dụng Visual Search API để tìm quần áo tương tự, Payment Gateway với RevenueCat cho subscription và IAP, cùng với cải thiện UX/UI theo visual guidelines mới.

## Glossary

- **Affiliate_Engine**: Hệ thống tìm kiếm sản phẩm tương tự từ ảnh và trả về link mua hàng có tracking
- **Visual_Search_API**: API tìm kiếm hình ảnh (Google Vision hoặc Bing Visual Search)
- **RevenueCat**: SDK quản lý subscription và IAP cho iOS/Android
- **Haptic_Feedback**: Phản hồi rung khi tương tác
- **Confetti_Effect**: Hiệu ứng pháo hoa giấy khi thành công
- **Progress_Indicator**: Thanh tiến trình với các bước cụ thể

## Requirements

### Requirement 1: Visual Search Integration

**User Story:** As a user, I want to find similar clothing items from my try-on result, so that I can purchase them from online stores.

#### Acceptance Criteria

1. WHEN a user clicks "Find Similar Items" on a try-on result, THE Affiliate_Engine SHALL analyze the clothing image using Visual_Search_API
2. WHEN Visual_Search_API returns results, THE Affiliate_Engine SHALL display matching products from Amazon and Shopee
3. WHEN displaying affiliate products, THE System SHALL show product image, name, price, and platform
4. WHEN a user clicks on an affiliate product, THE System SHALL open the product link with tracking parameters
5. IF Visual_Search_API fails, THEN THE System SHALL display cached/sample products as fallback
6. WHEN searching for similar items, THE System SHALL show a loading state with progress indicator

### Requirement 2: RevenueCat Payment Integration

**User Story:** As a user, I want to purchase gems and subscriptions easily, so that I can access premium features.

#### Acceptance Criteria

1. WHEN the app initializes, THE System SHALL configure RevenueCat SDK with appropriate API keys
2. WHEN a user views gem packages, THE System SHALL fetch current prices from RevenueCat (supporting regional pricing)
3. WHEN a user purchases gems, THE System SHALL process the transaction through RevenueCat
4. WHEN a user subscribes to Pro, THE System SHALL handle subscription through RevenueCat
5. WHEN a purchase completes successfully, THE System SHALL update user's gems/subscription status
6. IF a purchase fails, THEN THE System SHALL display appropriate error message and allow retry
7. WHEN verifying subscription status, THE System SHALL check with RevenueCat for current entitlements

### Requirement 3: Color Theme Updates

**User Story:** As a user, I want a clean and premium visual experience, so that the app feels high-quality.

#### Acceptance Criteria

1. THE System SHALL use white (#FFFFFF) or light gray (#F5F5F7) as background colors
2. THE System SHALL use purple gradient (#8E2DE2 -> #4A00E0) for primary CTA buttons
3. THE System SHALL use gold/amber (#FFD700) for gem-related UI elements
4. WHEN displaying primary buttons, THE System SHALL apply the "Magic" gradient style
5. THE System SHALL maintain consistent color usage across all screens

### Requirement 4: Haptic Feedback

**User Story:** As a user, I want tactile feedback when interacting with the app, so that actions feel responsive.

#### Acceptance Criteria

1. WHEN a user taps the "Generate" button, THE System SHALL trigger a light haptic feedback
2. WHEN a payment completes successfully, THE System SHALL trigger a success haptic feedback
3. WHEN an error occurs, THE System SHALL trigger an error haptic feedback
4. THE System SHALL only trigger haptics on devices that support it

### Requirement 5: Confetti Effect

**User Story:** As a user, I want celebratory feedback when completing important actions, so that achievements feel rewarding.

#### Acceptance Criteria

1. WHEN a payment completes successfully, THE System SHALL display a confetti animation
2. WHEN a user upgrades to Pro subscription, THE System SHALL display a confetti animation
3. THE Confetti_Effect SHALL last approximately 2-3 seconds
4. THE Confetti_Effect SHALL not block user interaction

### Requirement 6: Enhanced Loading States

**User Story:** As a user, I want to see progress during AI processing, so that I know the app is working.

#### Acceptance Criteria

1. WHEN AI try-on is processing, THE Progress_Indicator SHALL show sequential steps: "Scanning Body..." -> "Warping Cloth..." -> "Finalizing..."
2. THE Progress_Indicator SHALL display estimated progress percentage
3. THE Progress_Indicator SHALL animate smoothly between steps
4. THE System SHALL never show a frozen/unresponsive screen during processing
5. WHEN processing takes longer than expected, THE System SHALL update the message to indicate continued progress

### Requirement 7: Regional Pricing

**User Story:** As a user in different regions, I want to see prices in my local currency, so that I can understand the cost.

#### Acceptance Criteria

1. WHEN displaying gem prices, THE System SHALL show prices in user's local currency
2. THE System SHALL support different price tiers for US vs VN markets
3. WHEN RevenueCat provides regional pricing, THE System SHALL display the localized price
4. THE System SHALL format currency according to user's locale

