# Requirements Document

## Introduction

Tính năng cho phép người dùng sửa và xóa các item quần áo đã tải lên trong tủ đồ (Closet). Hiện tại, các component và hook đã có sẵn (`EditClothingDialog`, `ClothingItemActions`, `useUserClothing`) nhưng chưa được kết nối vào trang ClosetPage. Tính năng này sẽ tích hợp các thành phần có sẵn để người dùng có thể quản lý quần áo của mình.

## Glossary

- **Clothing_Item**: Một món quần áo trong tủ đồ của người dùng, bao gồm thông tin như tên, hình ảnh, danh mục, tags
- **Closet_System**: Hệ thống quản lý tủ đồ cho phép người dùng xem, sửa, xóa quần áo
- **User_Clothing**: Bảng dữ liệu lưu trữ quần áo của người dùng trong Supabase

## Requirements

### Requirement 1

**User Story:** As a user, I want to edit my uploaded clothing items, so that I can update the name and tags of my clothes.

#### Acceptance Criteria

1. WHEN a user taps the menu button on a clothing item THEN the Closet_System SHALL display an action menu with edit option
2. WHEN a user selects the edit option THEN the Closet_System SHALL open the EditClothingDialog with the current item data pre-filled
3. WHEN a user modifies the name or tags and saves THEN the Closet_System SHALL update the Clothing_Item in the database and reflect changes in the UI immediately
4. WHEN a user cancels the edit dialog THEN the Closet_System SHALL close the dialog without making any changes

### Requirement 2

**User Story:** As a user, I want to delete my uploaded clothing items, so that I can remove clothes I no longer want in my closet.

#### Acceptance Criteria

1. WHEN a user taps the menu button on a clothing item THEN the Closet_System SHALL display an action menu with delete option
2. WHEN a user selects the delete option THEN the Closet_System SHALL remove the Clothing_Item from the database
3. WHEN a Clothing_Item is deleted THEN the Closet_System SHALL remove the item from the UI immediately and show a success notification
4. WHEN a delete operation fails THEN the Closet_System SHALL display an error notification and keep the item in the UI

### Requirement 3

**User Story:** As a user, I want to see action buttons on my clothing items, so that I can easily access edit and delete functions.

#### Acceptance Criteria

1. WHEN a user views their clothing items in the closet THEN the Closet_System SHALL display a menu button on each owned item
2. WHEN a user hovers over or taps a clothing item THEN the Closet_System SHALL make the action menu button visible
3. WHEN displaying action menu THEN the Closet_System SHALL only show edit and delete options for items owned by the user
