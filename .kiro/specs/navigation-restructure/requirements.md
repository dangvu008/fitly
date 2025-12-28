# Requirements Document

## Introduction

Cập nhật cấu trúc điều hướng (navigation) của ứng dụng "VTON GLOBAL" theo PRD mới, hướng đến thị trường Tier 1 (US, EU, KR, JP). Thay đổi từ cấu trúc 5 tab hiện tại sang cấu trúc mới với FAB (Floating Action Button) ở giữa để mở Studio thử đồ, thêm tab Search, và tích hợp hệ thống monetization lai ghép (Gems, Subscription, Affiliate, Ads).

### Chiến lược Monetization
- **IAP (Gems/Credits)**: Thu tiền lẻ từ người dùng vãng lai (Pay-as-you-go)
- **Subscription (Pro)**: Thu tiền định kỳ từ người dùng thường xuyên với tính năng 4K
- **Affiliate**: Thu hoa hồng từ link mua sắm (Amazon, Shopee, etc.)
- **Ads**: Tận dụng người dùng miễn phí (Watch Ad to earn Gems)

## Glossary

- **Bottom_Navigation**: Thanh điều hướng cố định ở dưới cùng màn hình với 5 vị trí
- **FAB**: Floating Action Button - Nút nổi ở giữa thanh navigation để mở Studio thử đồ
- **Top_Bar**: Thanh trên cùng cố định với logo, Gems, Saved, và Avatar
- **Studio**: Màn hình thử đồ full-screen (TryOnPage hiện tại)
- **Wardrobe**: Tủ đồ kết quả - nơi lưu trữ các outfit đã tạo (Output)
- **Closet**: Tủ quần áo - nơi lưu trữ các item quần áo (Input)
- **Gems**: Đơn vị tiền tệ ảo trong app, dùng để thử đồ (1 Gem = 1 lần try-on)
- **Pro_Subscription**: Gói đăng ký trả phí với tính năng 4K Upscale không giới hạn
- **Monetization_Gate**: Rào cản yêu cầu thanh toán trước khi sử dụng tính năng
- **Affiliate_Link**: Link mua sắm có gắn mã theo dõi để nhận hoa hồng

## Requirements

### Requirement 1: Cấu trúc Bottom Navigation mới

**User Story:** As a user, I want a clear and intuitive bottom navigation, so that I can easily access all main features of the app.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL display exactly 5 positions in the following order: Home, Search, FAB, Community, Wardrobe
2. WHEN the FAB is tapped, THE System SHALL open the Studio (TryOnPage) in full-screen mode
3. THE FAB SHALL be visually distinct from other tabs with a larger size and accent color
4. THE FAB SHALL be positioned at the center of the Bottom_Navigation with elevated styling
5. WHEN any regular tab is active, THE System SHALL highlight that tab with visual feedback

### Requirement 2: Home Tab (Tab 1)

**User Story:** As a user, I want the Home tab to show my recent activity and quick actions, so that I can quickly resume my fashion journey.

#### Acceptance Criteria

1. WHEN the Home tab is selected, THE System SHALL display the HomePage with recent try-on history
2. THE Home tab SHALL use a house icon (🏠) with label "Home"
3. THE HomePage SHALL include quick access to recent try-on results
4. THE HomePage SHALL include featured/trending outfits section

### Requirement 3: Search Tab (Tab 2) - NEW

**User Story:** As a user, I want to search and discover clothing items, so that I can find items to try on.

#### Acceptance Criteria

1. WHEN the Search tab is selected, THE System SHALL display a search interface
2. THE Search tab SHALL use a search/magnifying glass icon (🔍) with label "Search"
3. THE Search_Page SHALL include a search input field at the top
4. THE Search_Page SHALL display clothing categories for browsing
5. THE Search_Page SHALL show trending/popular items when no search query is entered
6. WHEN a user searches for items, THE System SHALL display matching results from the clothing database

### Requirement 4: FAB - Studio Access (Tab 3 - Center)

**User Story:** As a user, I want quick access to the try-on studio, so that I can start trying on clothes immediately.

#### Acceptance Criteria

1. THE FAB SHALL be positioned at the center of the Bottom_Navigation
2. THE FAB SHALL have a distinct visual style: larger size, accent/primary color, elevated shadow
3. THE FAB SHALL use a lightning bolt icon (⚡) or plus icon
4. WHEN the FAB is tapped, THE System SHALL navigate to the TryOnPage (Studio)
5. THE FAB SHALL NOT have a text label to maintain clean design
6. THE FAB SHALL be visually elevated above the navigation bar

### Requirement 5: Community Tab (Tab 4)

**User Story:** As a user, I want to browse community outfits and interact with other users, so that I can get inspiration and share my creations.

#### Acceptance Criteria

1. WHEN the Community tab is selected, THE System SHALL display the CommunityFeedPage
2. THE Community tab SHALL use a globe/world icon (🌍) with label "Community"
3. THE CommunityFeedPage SHALL maintain existing functionality (Following, Explore, Ranking tabs)

### Requirement 6: Wardrobe Tab (Tab 5)

**User Story:** As a user, I want to access my saved outfits and try-on results, so that I can review and manage my virtual wardrobe.

#### Acceptance Criteria

1. WHEN the Wardrobe tab is selected, THE System SHALL display the user's saved try-on results
2. THE Wardrobe tab SHALL use a folder/wardrobe icon (📂) with label "Wardrobe"
3. THE Wardrobe_Page SHALL display outfit results in a grid layout
4. THE Wardrobe_Page SHALL allow users to view, share, or delete saved outfits

### Requirement 7: Top Bar Updates

**User Story:** As a user, I want the top bar to provide quick access to my gems, saved items, and profile, so that I can manage my account easily.

#### Acceptance Criteria

1. THE Top_Bar SHALL display on all screens except Studio (full-screen mode)
2. THE Top_Bar left side SHALL show the app logo
3. THE Top_Bar right side SHALL display in order: Gems balance with (+) button, Saved button (❤️), Avatar
4. WHEN the Gems button is tapped, THE System SHALL show gems balance and purchase options
5. WHEN the Saved button is tapped, THE System SHALL navigate to saved items (Closet - input items)
6. WHEN the Avatar is tapped, THE System SHALL show profile menu and settings
7. THE Gems counter SHALL display current balance with a prominent (+) icon for quick purchase

### Requirement 8: Navigation State Management

**User Story:** As a user, I want the app to remember my navigation state, so that I have a consistent experience.

#### Acceptance Criteria

1. WHEN switching between tabs, THE System SHALL preserve the state of each tab
2. WHEN returning to a previously visited tab, THE System SHALL restore the previous scroll position
3. THE System SHALL highlight the currently active tab in the Bottom_Navigation
4. WHEN the Studio is opened via FAB, THE System SHALL NOT change the active tab indicator

### Requirement 9: Responsive and Accessible Design

**User Story:** As a user, I want the navigation to be accessible and work well on all devices, so that I can use the app comfortably.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL be fixed at the bottom with safe area padding
2. THE navigation elements SHALL have minimum touch target size of 44x44 pixels
3. THE navigation SHALL support screen readers with proper aria labels
4. THE FAB SHALL have a minimum size of 56x56 pixels for easy tapping

### Requirement 10: Translation Support

**User Story:** As a user, I want navigation labels in my language, so that I can understand the app easily.

#### Acceptance Criteria

1. THE System SHALL provide translation keys for all navigation labels
2. THE translations SHALL be available in all 6 supported languages (vi, en, zh, ko, ja, th)
3. WHEN the language is changed, THE navigation labels SHALL update immediately

### Requirement 11: Gems System (Monetization - IAP)

**User Story:** As a user, I want to use gems to try on outfits, so that I can pay only for what I use.

#### Acceptance Criteria

1. THE System SHALL display Gems balance in Top_Bar with format "💎 {balance}"
2. WHEN a user taps "Try This On Me" button, THE System SHALL display "Cost: 1 Gem" on the button
3. IF user has insufficient Gems, THEN THE System SHALL show a Monetization_Gate popup with options:
   - "Watch Ad to get 1 Gem" (Rewarded Ad)
   - "Buy 10 Gems for $0.99" (IAP)
   - "Buy 50 Gems for $3.99" (IAP - Best Value)
4. WHEN user completes ad viewing, THE System SHALL credit 1 Gem immediately
5. WHEN user completes IAP purchase, THE System SHALL credit Gems immediately
6. THE Gems balance SHALL sync with backend and persist across sessions

### Requirement 12: Pro Subscription (Monetization - Subscription)

**User Story:** As a serious user, I want unlimited 4K quality try-ons, so that I can see fabric details clearly.

#### Acceptance Criteria

1. THE System SHALL offer a Pro subscription tier at $4.99/week
2. WHEN a non-Pro user selects "4K Upscale" option, THE System SHALL display a 👑 lock icon
3. WHEN a non-Pro user taps the locked 4K option, THE System SHALL show subscription pricing dialog
4. WHILE user has active Pro subscription, THE System SHALL unlock all 4K features without Gem cost
5. THE Pro badge (👑) SHALL display next to username for Pro subscribers
6. THE System SHALL handle subscription status via App Store/Play Store

### Requirement 13: Affiliate Integration (Monetization - Affiliate)

**User Story:** As a user who likes an outfit, I want to find similar items to buy, so that I can purchase what I tried on.

#### Acceptance Criteria

1. WHEN displaying try-on results, THE System SHALL show "Find Similar Items" button
2. WHEN user taps "Find Similar Items", THE System SHALL display affiliate links to:
   - Amazon (primary)
   - Shopee (for SEA markets)
   - Other regional e-commerce platforms
3. THE affiliate links SHALL include tracking parameters for 24-hour cookie attribution
4. THE System SHALL display product cards with: image, name, price, and "Shop Now" CTA
5. WHEN user taps affiliate link, THE System SHALL open external browser/app with tracking

### Requirement 14: Rewarded Ads (Monetization - Ads)

**User Story:** As a free user, I want to watch ads to earn gems, so that I can try on outfits without paying.

#### Acceptance Criteria

1. WHEN user has 0 Gems and attempts try-on, THE System SHALL offer "Watch Ad for 1 Gem" option
2. THE rewarded ad SHALL be 15-30 seconds video ad
3. WHEN ad completes successfully, THE System SHALL credit 1 Gem immediately
4. IF ad fails to load, THEN THE System SHALL show error and offer retry or IAP alternative
5. THE System SHALL limit rewarded ads to maximum 5 per day per user
6. THE System SHALL track ad views and prevent abuse
