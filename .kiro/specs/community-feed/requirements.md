# Requirements Document

## Introduction

Trang Community Feed là nơi người dùng có thể xem, tương tác và chia sẻ các outfit từ cộng đồng. Trang này cho phép người dùng duyệt outfit theo các tab (Following, Explore, Ranking), tương tác với bài đăng (like, comment, share), và quan trọng nhất là thử outfit trực tiếp từ feed thông qua nút "TRY ON ME". Người dùng cũng có thể đăng bài mới thông qua floating button.

## Glossary

- **Community_Feed**: Trang hiển thị danh sách outfit được chia sẻ từ cộng đồng
- **Feed_Post**: Một bài đăng outfit trong feed, bao gồm ảnh, caption, thông tin người đăng và các món đồ
- **Following_Tab**: Tab hiển thị outfit từ những người dùng mà user đang follow
- **Explore_Tab**: Tab hiển thị outfit phổ biến và gợi ý từ cộng đồng
- **Ranking_Tab**: Tab hiển thị outfit được xếp hạng theo lượt thích hoặc tương tác
- **Try_On_Action**: Hành động thử outfit từ feed, cho phép user áp dụng outfit lên ảnh của mình

## Requirements

### Requirement 1

**User Story:** As a user, I want to browse community outfits in different tabs, so that I can discover outfits from people I follow and trending content.

#### Acceptance Criteria

1. WHEN a user navigates to the Community Feed page THEN the Community_Feed SHALL display a header with "Community Feed" title, Saved button, and user avatar
2. WHEN a user views the Community Feed THEN the Community_Feed SHALL display three sub-tabs: Following, Explore, and Ranking
3. WHEN a user selects the Following tab THEN the Community_Feed SHALL display outfit posts only from users that the current user follows
4. WHEN a user selects the Explore tab THEN the Community_Feed SHALL display recommended and popular outfit posts from the community
5. WHEN a user selects the Ranking tab THEN the Community_Feed SHALL display outfit posts sorted by likes count in descending order

### Requirement 2

**User Story:** As a user, I want to view outfit posts in an infinite scroll list, so that I can continuously browse content without pagination interruption.

#### Acceptance Criteria

1. WHEN a user scrolls down the feed THEN the Community_Feed SHALL load more posts automatically when approaching the bottom
2. WHEN new posts are being loaded THEN the Community_Feed SHALL display a loading indicator at the bottom of the list
3. WHEN no more posts are available THEN the Community_Feed SHALL display an end-of-feed message
4. WHEN the feed is empty THEN the Community_Feed SHALL display an appropriate empty state message based on the active tab

### Requirement 3

**User Story:** As a user, I want to see detailed information on each outfit post, so that I can understand the outfit and its creator.

#### Acceptance Criteria

1. WHEN displaying a Feed_Post THEN the Community_Feed SHALL show the creator's avatar, username, and post timestamp
2. WHEN displaying a Feed_Post THEN the Community_Feed SHALL show the outfit image in 4:5 or 1:1 aspect ratio
3. WHEN displaying a Feed_Post THEN the Community_Feed SHALL show the caption/description below the image
4. WHEN displaying a Feed_Post THEN the Community_Feed SHALL show like count, comment count, and share button
5. WHEN displaying a Feed_Post THEN the Community_Feed SHALL show a section listing clothing items used in the outfit

### Requirement 4

**User Story:** As a user, I want to try on outfits directly from the feed, so that I can quickly see how an outfit looks on me.

#### Acceptance Criteria

1. WHEN viewing a Feed_Post with clothing items THEN the Community_Feed SHALL display a prominent "TRY ON ME" button
2. WHEN a user taps the "TRY ON ME" button THEN the Community_Feed SHALL open the try-on dialog with the outfit's clothing items pre-selected
3. WHEN the try-on process completes successfully THEN the Community_Feed SHALL navigate to the result page or show the result in a dialog
4. WHEN the try-on process fails THEN the Community_Feed SHALL display an error notification and allow retry

### Requirement 5

**User Story:** As a user, I want to interact with outfit posts, so that I can engage with the community.

#### Acceptance Criteria

1. WHEN a user taps the like button on a Feed_Post THEN the Community_Feed SHALL toggle the like state and update the like count immediately
2. WHEN a user taps the comment button THEN the Community_Feed SHALL open a comments sheet showing existing comments and input field
3. WHEN a user taps the share button THEN the Community_Feed SHALL open a share dialog with sharing options
4. WHEN a user taps on the creator's avatar or username THEN the Community_Feed SHALL navigate to that user's profile page

### Requirement 6

**User Story:** As a user, I want to create new outfit posts, so that I can share my outfits with the community.

#### Acceptance Criteria

1. WHEN viewing the Community Feed THEN the Community_Feed SHALL display a floating action button in the bottom-right corner
2. WHEN a user taps the floating action button THEN the Community_Feed SHALL navigate to the create post flow or open a create post dialog
3. WHEN a user has no try-on results to share THEN the Community_Feed SHALL prompt the user to create a try-on first

</content>
</invoke>