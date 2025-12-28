# Requirements Document

## Introduction

Trang Search & Shop là trang tìm kiếm và mua sắm được thiết kế để tối ưu doanh thu Affiliate. Trang này cho phép người dùng tìm kiếm sản phẩm thời trang qua link hoặc từ khóa, duyệt theo danh mục, và xem các bộ sưu tập được curate với sản phẩm affiliate. Mỗi sản phẩm có nút "Try On" (thử đồ) và "Buy" (mua) với link affiliate.

## Glossary

- **Search_Shop_Page**: Trang tìm kiếm và mua sắm với focus vào affiliate monetization
- **Visual_Category**: Danh mục sản phẩm hiển thị dạng icon (Dresses, Tops, Pants, Outerwear)
- **Curated_Collection**: Bộ sưu tập sản phẩm được curate với tiêu đề hấp dẫn (ví dụ: "Top 10 Date Night Outfits from Amazon")
- **Affiliate_Product**: Sản phẩm có link affiliate, hiển thị với nút Try On và Buy
- **Product_Card**: Card hiển thị sản phẩm với ảnh, tên, nút Try On và nút Buy với giá

## Requirements

### Requirement 1: Page Header

**User Story:** As a user, I want to see a clean header with search functionality and quick access to my gems and saved items, so that I can easily navigate and track my resources.

#### Acceptance Criteria

1. WHEN a user navigates to the Search & Shop page THEN the Search_Shop_Page SHALL display a header with title "SEARCH & SHOP"
2. WHEN viewing the header THEN the Search_Shop_Page SHALL display the gem counter with current balance and "+" button
3. WHEN viewing the header THEN the Search_Shop_Page SHALL display a heart icon for saved items
4. WHEN viewing the header THEN the Search_Shop_Page SHALL display the user avatar

### Requirement 2: Search Input

**User Story:** As a user, I want to search for products by pasting a link or typing keywords, so that I can find specific items to try on and buy.

#### Acceptance Criteria

1. WHEN viewing the Search & Shop page THEN the Search_Shop_Page SHALL display a prominent search input with placeholder "Paste Link or Search 'Denim Jacket'..."
2. WHEN a user pastes a product URL THEN the Search_Shop_Page SHALL detect the URL and trigger visual search
3. WHEN a user types a keyword and submits THEN the Search_Shop_Page SHALL search for matching products
4. WHEN search is in progress THEN the Search_Shop_Page SHALL display a loading indicator

### Requirement 3: Visual Categories

**User Story:** As a user, I want to browse products by visual categories, so that I can quickly find items in specific clothing types.

#### Acceptance Criteria

1. WHEN viewing the Search & Shop page THEN the Search_Shop_Page SHALL display a "VISUAL CATEGORIES" section
2. WHEN viewing Visual Categories THEN the Search_Shop_Page SHALL display category buttons: Dresses (👗), Tops (👔), Pants (👖), Outerwear (🧥)
3. WHEN a user taps a category button THEN the Search_Shop_Page SHALL filter products to show only items in that category
4. WHEN a category is selected THEN the Search_Shop_Page SHALL highlight the selected category button

### Requirement 4: Curated Collections

**User Story:** As a user, I want to browse curated collections with affiliate products, so that I can discover trending outfits and easily purchase them.

#### Acceptance Criteria

1. WHEN viewing the Search & Shop page THEN the Search_Shop_Page SHALL display a "CURATED COLLECTIONS" section
2. WHEN viewing a collection THEN the Search_Shop_Page SHALL display a catchy title (e.g., "Top 10 Date Night Outfits from Amazon")
3. WHEN viewing a collection THEN the Search_Shop_Page SHALL display products in a horizontal scrollable row
4. WHEN viewing a collection THEN the Search_Shop_Page SHALL display multiple collections vertically

### Requirement 5: Product Card Display

**User Story:** As a user, I want to see product cards with try-on and buy options, so that I can quickly try items and purchase them.

#### Acceptance Criteria

1. WHEN displaying an Affiliate_Product THEN the Product_Card SHALL show the product image
2. WHEN displaying an Affiliate_Product THEN the Product_Card SHALL show the product name/brand
3. WHEN displaying an Affiliate_Product THEN the Product_Card SHALL show a "⚡ Try On" button
4. WHEN displaying an Affiliate_Product THEN the Product_Card SHALL show a "🛒 Buy $XX" button with the price
5. WHEN a user taps "Try On" THEN the Product_Card SHALL navigate to try-on flow with the product image
6. WHEN a user taps "Buy" THEN the Product_Card SHALL open the affiliate link in a new tab and track the click

### Requirement 6: Affiliate Tracking

**User Story:** As a business, I want to track affiliate clicks and conversions, so that I can measure revenue and optimize collections.

#### Acceptance Criteria

1. WHEN a user clicks a "Buy" button THEN the Search_Shop_Page SHALL record the click event with product ID, source, and timestamp
2. WHEN tracking a click THEN the Search_Shop_Page SHALL include the user ID if logged in
3. WHEN displaying products THEN the Search_Shop_Page SHALL prioritize products with higher conversion rates

