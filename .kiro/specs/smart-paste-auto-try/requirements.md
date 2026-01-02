# Requirements: Smart Paste & Auto-Try

## Overview

Tính năng "Smart Paste & Auto-Try" giải quyết vấn đề "Thấy là muốn thử ngay" (Impulse Try-On). Thay vì bắt user tải ảnh về máy → mở app → upload → crop → chọn model, tính năng này cho phép thử đồ chỉ với 1-2 thao tác.

## Điều kiện tiên quyết

### REQ-0: Default Model (Người mẫu Mặc định)
- **REQ-0.1**: User phải có Default Body Image đã được lưu trong profile
- **REQ-0.2**: Nếu chưa có Default Body Image, hiển thị BodyImagePrompt để user chọn
- **REQ-0.3**: Default Body Image được sử dụng tự động cho mọi lệnh thử đồ nhanh

## Flow 1: Thử đồ từ Link Mua sắm

### REQ-1: Clipboard Detection (Phát hiện Link)
- **REQ-1.1**: Khi app được focus/mở, tự động kiểm tra Clipboard
- **REQ-1.2**: Detect các domain được hỗ trợ: shopee.vn, shopee.co.th, zara.com, tiktok.com, lazada.vn, amazon.com
- **REQ-1.3**: Hiển thị Toast popup: "Phát hiện link [Platform]. Bạn có muốn thử chiếc [item] này không?"
- **REQ-1.4**: Toast có nút "⚡ Thử Ngay" và nút "Bỏ qua"
- **REQ-1.5**: Lưu link đã xử lý để không hiện lại toast cho cùng link

### REQ-2: Product Image Crawling
- **REQ-2.1**: Edge function crawl ảnh sản phẩm từ URL
- **REQ-2.2**: Hỗ trợ các platform: Shopee, Zara, TikTok Shop, Lazada, Amazon
- **REQ-2.3**: Extract ảnh chính của sản phẩm (không lấy ảnh model mặc)
- **REQ-2.4**: Fallback: Nếu không crawl được, cho phép user paste ảnh thủ công
- **REQ-2.5**: Tự động remove background cho ảnh sản phẩm

### REQ-3: Auto Try-On từ Link
- **REQ-3.1**: Sau khi có ảnh sản phẩm, tự động lấy Default Body Image
- **REQ-3.2**: Gọi AI try-on API với body image + product image
- **REQ-3.3**: Hiển thị ProcessingAnimation trong khi xử lý
- **REQ-3.4**: Hiển thị ResultPreview khi hoàn thành

## Flow 2: Thử đồ từ Screenshot

### REQ-4: Screenshot Upload
- **REQ-4.1**: FAB button (⚡) ở giữa màn hình để mở Quick Try
- **REQ-4.2**: Tab "Dán ảnh / Từ thư viện" trong Quick Try sheet
- **REQ-4.3**: Cho phép chọn ảnh từ gallery hoặc paste từ clipboard
- **REQ-4.4**: Hỗ trợ drag & drop ảnh (desktop)

### REQ-5: Smart Crop (AI Auto-Detect)
- **REQ-5.1**: Tự động nhận diện vùng chứa quần áo trong screenshot
- **REQ-5.2**: Crop tự động, loại bỏ UI elements (status bar, navigation, text)
- **REQ-5.3**: Hiển thị preview crop với option điều chỉnh thủ công
- **REQ-5.4**: Remove background sau khi crop
- **REQ-5.5**: Nếu AI không detect được, fallback về manual crop

### REQ-6: Auto Try-On từ Screenshot
- **REQ-6.1**: Sau khi crop xong, tự động lấy Default Body Image
- **REQ-6.2**: Gọi AI try-on API
- **REQ-6.3**: Hiển thị kết quả trong ResultPreview

## Flow 3: One-Tap Try-On trong App (Đã có - Cần refactor)

### REQ-7: Studio Screen Refactor
- **REQ-7.1**: TryOnPage nhận props: `initialGarmentUrl`, `initialGarmentId`
- **REQ-7.2**: Nếu có `initialGarmentUrl`, tự động set vào Garment slot
- **REQ-7.3**: Tự động fetch Default Body Image và set vào Model slot
- **REQ-7.4**: Hiển thị toast: "Outfit loaded! Ready to generate."
- **REQ-7.5**: Nếu không có initial props, hoạt động như bình thường (manual mode)

### REQ-8: Quick Try Button Enhancement
- **REQ-8.1**: QuickTryButton navigate đến TryOnPage với `initialGarmentUrl`
- **REQ-8.2**: Truyền garment URL từ card được click
- **REQ-8.3**: Hỗ trợ cả outfit (multiple items) và single clothing item

## UX Requirements

### REQ-9: Visual Feedback
- **REQ-9.1**: Toast notification khi phát hiện link
- **REQ-9.2**: Loading animation khi crawl ảnh
- **REQ-9.3**: ProcessingAnimation với fun messages khi AI đang xử lý
- **REQ-9.4**: Haptic feedback trên mobile

### REQ-10: Error Handling
- **REQ-10.1**: Hiển thị lỗi rõ ràng nếu không crawl được ảnh
- **REQ-10.2**: Fallback options khi AI fail
- **REQ-10.3**: Retry button cho mọi error state

### REQ-11: Gem/Quota Management
- **REQ-11.1**: Kiểm tra gem balance trước khi xử lý
- **REQ-11.2**: Hiển thị GemGate nếu không đủ gems
- **REQ-11.3**: Deduct gems sau khi xử lý thành công

## Technical Requirements

### REQ-12: Performance
- **REQ-12.1**: Clipboard check không block UI
- **REQ-12.2**: Image crawling timeout: 10 giây
- **REQ-12.3**: Cache crawled images để tránh re-crawl

### REQ-13: Privacy & Security
- **REQ-13.1**: Chỉ đọc clipboard khi app được focus
- **REQ-13.2**: Không lưu clipboard content vào server
- **REQ-13.3**: User có thể disable clipboard detection trong settings
