# Requirements Document

## Introduction

Redesign của Trang chủ (Home) và Cộng đồng (Community) để tạo sự khác biệt rõ ràng giữa hai trang. Home tập trung vào "Khám phá" với lịch sử thử đồ và nội dung cuộn ngang theo chủ đề. Community tập trung vào "Người dùng" với giao diện giống Instagram, ưu tiên nội dung user-generated.

## Glossary

- **Home_Page**: Trang chủ của ứng dụng, nơi user khám phá outfit mới và xem lịch sử thử đồ
- **Community_Page**: Trang cộng đồng, nơi user xem và tương tác với outfit từ người dùng khác
- **History_Section**: Thanh cuộn ngang hiển thị lịch sử thử đồ gần đây của user
- **Horizontal_Scroll_Section**: Mục nội dung cuộn ngang theo chủ đề (New Arrivals, Trending Styles)
- **Outfit_Card**: Thẻ hiển thị thông tin outfit
- **User_Profile_Info**: Thông tin người đăng bao gồm avatar và tên
- **Caption**: Mô tả text của người dùng về outfit
- **Try_Button**: Nút để thử outfit

## Requirements

### Requirement 1: History Section on Home Page

**User Story:** As a user, I want to see my recent try-on history at the top of the Home page, so that I can quickly access and review my previous looks.

#### Acceptance Criteria

1. WHEN the Home page loads, THE Home_Page SHALL display the History_Section immediately below the header
2. THE History_Section SHALL display try-on results as a horizontal scrollable list
3. WHEN user has no try-on history, THE History_Section SHALL display a "NEW" button to start trying on
4. WHEN user taps on a history item, THE Home_Page SHALL navigate to view that result detail
5. THE History_Section SHALL display a maximum of 10 recent items

### Requirement 2: Horizontal Scroll Sections on Home Page

**User Story:** As a user, I want to browse outfits organized by themes in horizontal scroll sections, so that I can discover content more easily without endless vertical scrolling.

#### Acceptance Criteria

1. THE Home_Page SHALL display a "New Arrivals" section with horizontal scrolling
2. THE Home_Page SHALL display a "Trending Styles" section with horizontal scrolling
3. THE Home_Page SHALL display a "For You" section as a vertical grid (2 columns)
4. WHEN user scrolls horizontally in a section, THE section SHALL scroll smoothly with momentum
5. EACH horizontal section SHALL display 6-10 outfit cards
6. THE outfit cards in horizontal sections SHALL maintain the prominent "Try This" button

### Requirement 3: Community Page Instagram-Style Redesign

**User Story:** As a user, I want the Community page to feel more social like Instagram, so that I can connect with other users and their outfit stories.

#### Acceptance Criteria

1. THE Community_Page SHALL display User_Profile_Info prominently with larger avatar (32px) and display name
2. THE Outfit_Card SHALL display Caption text (2-3 lines) from the outfit creator
3. THE Try_Button on Community_Page SHALL be smaller/outline style to not compete with the main content
4. WHEN viewing Community_Page, THE primary action SHALL be viewing/liking, not trying

### Requirement 4: Community Page Layout Options

**User Story:** As a user, I want a layout that emphasizes user content and social interaction, so that I feel more connected to the community.

#### Acceptance Criteria

1. THE Community_Page SHALL support single-column layout option (Instagram-style feed)
2. IF using 2-column grid, THE Community_Page SHALL use Pinterest-style masonry layout with varying heights
3. THE Outfit_Card SHALL prominently display likes and comments count
4. WHEN user taps on an outfit image, THE Community_Page SHALL navigate to outfit detail page
5. THE Community_Page SHALL NOT display the History_Section (differentiating from Home)

### Requirement 5: Outfit Card Design Differentiation

**User Story:** As a user, I want different card designs on Home vs Community, so that I can immediately recognize which page I'm on.

#### Acceptance Criteria

1. THE Home_Page Outfit_Card SHALL have a prominent gradient "Try This" button at the bottom
2. THE Community_Page Outfit_Card SHALL have a subtle outline "Try" icon button
3. THE Community_Page Outfit_Card SHALL display user avatar and name at the top (larger than Home)
4. THE Community_Page Outfit_Card SHALL display caption text below the image
5. THE Home_Page Outfit_Card SHALL focus on the outfit image with minimal user info overlay

### Requirement 6: Visual Hierarchy and Spacing

**User Story:** As a user, I want clear visual hierarchy on both pages, so that I can easily scan and find content.

#### Acceptance Criteria

1. THE Home_Page SHALL use section headers with icons (Clock for History, Flame for Trending, etc.)
2. THE Community_Page SHALL use filter chips at the top (Trending, Latest, Following)
3. WHEN scrolling, THE pages SHALL maintain consistent spacing between sections (16px)
4. THE horizontal scroll sections SHALL have peek indicators showing more content is available
