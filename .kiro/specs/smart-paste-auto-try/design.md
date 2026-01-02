# Design: Smart Paste & Auto-Try

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Smart Paste System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Clipboard   │    │  Screenshot  │    │   In-App     │       │
│  │  Detection   │    │   Upload     │    │  Quick Try   │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              useSmartPaste Hook                       │       │
│  │  - detectClipboardLink()                              │       │
│  │  - processScreenshot()                                │       │
│  │  - triggerQuickTry()                                  │       │
│  └──────────────────────────┬───────────────────────────┘       │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐        │
│  │  Crawl     │      │  Smart     │      │  Default   │        │
│  │  Product   │      │  Crop      │      │  Body      │        │
│  │  Image     │      │  Service   │      │  Image     │        │
│  └─────┬──────┘      └─────┬──────┘      └─────┬──────┘        │
│        │                   │                   │                │
│        └───────────────────┼───────────────────┘                │
│                            ▼                                    │
│                 ┌──────────────────┐                            │
│                 │  AI Try-On API   │                            │
│                 │  (existing)      │                            │
│                 └────────┬─────────┘                            │
│                          ▼                                      │
│                 ┌──────────────────┐                            │
│                 │  ResultPreview   │                            │
│                 │  (existing)      │                            │
│                 └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. ClipboardLinkToast

Toast component hiển thị khi phát hiện link shopping trong clipboard.

```typescript
interface ClipboardLinkToastProps {
  platform: 'shopee' | 'zara' | 'tiktok' | 'lazada' | 'amazon';
  productUrl: string;
  productName?: string;
  onTryNow: () => void;
  onDismiss: () => void;
}
```

**UI Design:**
- Slide-in từ bottom
- Icon platform (Shopee, Zara, etc.)
- Text: "Phát hiện link [Platform]"
- Subtext: "Bạn có muốn thử chiếc [item] này không?"
- Button gradient: "⚡ Thử Ngay"
- Button secondary: "Bỏ qua"
- Auto-dismiss sau 10 giây

### 2. QuickTrySheet

Bottom sheet cho Flow 2 (Screenshot upload).

```typescript
interface QuickTrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelected: (imageUrl: string) => void;
}
```

**Tabs:**
1. "Dán Link" - Input để paste URL
2. "Từ Thư viện" - Image picker
3. "Chụp ảnh" - Camera capture

### 3. SmartCropPreview

Preview component sau khi AI detect clothing trong screenshot.

```typescript
interface SmartCropPreviewProps {
  originalImage: string;
  croppedImage: string;
  cropBounds: { x: number; y: number; width: number; height: number };
  onConfirm: () => void;
  onAdjust: () => void;
  onRetry: () => void;
}
```

**UI Design:**
- Side-by-side: Original vs Cropped
- Highlight vùng được crop trên original
- Button: "Dùng ảnh này" (primary)
- Button: "Điều chỉnh" (secondary)

### 4. QuickTryFAB

Floating Action Button ở giữa màn hình.

```typescript
interface QuickTryFABProps {
  onClick: () => void;
}
```

**UI Design:**
- Vị trí: Center bottom, trên MobileNav
- Icon: ⚡ (Zap)
- Gradient background
- Pulse animation để thu hút attention

## Hook Design

### useSmartPaste

Main orchestration hook cho Smart Paste feature.

```typescript
interface UseSmartPasteReturn {
  // Clipboard detection
  detectedLink: DetectedLink | null;
  isCheckingClipboard: boolean;
  checkClipboard: () => Promise<void>;
  dismissDetectedLink: () => void;
  
  // Screenshot processing
  processScreenshot: (imageUrl: string) => Promise<ProcessedImage>;
  isProcessingScreenshot: boolean;
  
  // Quick try trigger
  triggerQuickTry: (garmentUrl: string, garmentId?: string) => void;
  
  // State
  error: Error | null;
}

interface DetectedLink {
  platform: string;
  url: string;
  productName?: string;
  productImage?: string;
}

interface ProcessedImage {
  originalUrl: string;
  croppedUrl: string;
  backgroundRemovedUrl: string;
  cropBounds: CropBounds;
}
```

### useClipboardDetection

Hook riêng cho clipboard monitoring.

```typescript
interface UseClipboardDetectionReturn {
  clipboardContent: string | null;
  isShoppingLink: boolean;
  platform: string | null;
  checkClipboard: () => Promise<void>;
  clearClipboard: () => void;
}
```

**Supported Platforms:**
- `shopee.vn`, `shopee.co.th`, `shopee.sg`
- `zara.com`
- `tiktok.com/*/product`
- `lazada.vn`, `lazada.co.th`
- `amazon.com`, `amazon.vn`

## Edge Function Design

### crawl-product-image

Edge function để crawl ảnh sản phẩm từ URL.

```typescript
// Request
interface CrawlProductRequest {
  url: string;
  platform?: string; // Auto-detect if not provided
}

// Response
interface CrawlProductResponse {
  success: boolean;
  productImage?: string; // Base64 or URL
  productName?: string;
  productPrice?: string;
  platform: string;
  error?: string;
}
```

**Implementation Strategy:**
1. Parse URL để detect platform
2. Fetch HTML content
3. Extract product image using platform-specific selectors:
   - Shopee: `.product-image img`, `meta[property="og:image"]`
   - Zara: `.media-image img`, `meta[property="og:image"]`
   - TikTok: `.product-card img`
4. Validate image (check if it's clothing, not model)
5. Return image URL or base64

### smart-crop-clothing

Edge function để AI detect và crop clothing từ screenshot.

```typescript
// Request
interface SmartCropRequest {
  imageBase64: string;
  removeBackground?: boolean;
}

// Response
interface SmartCropResponse {
  success: boolean;
  croppedImage?: string; // Base64
  backgroundRemovedImage?: string; // Base64
  cropBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  detectedItems?: Array<{
    type: string;
    confidence: number;
    bounds: CropBounds;
  }>;
  error?: string;
}
```

**Implementation Strategy:**
1. Use object detection model (YOLO or similar)
2. Detect clothing items in image
3. Filter out UI elements (status bar, navigation)
4. Return largest/most prominent clothing item
5. Optionally remove background

## Navigation Flow

### Flow 1: Link Detection → Try-On

```
App Focus
    │
    ▼
useClipboardDetection.checkClipboard()
    │
    ▼ (if shopping link detected)
ClipboardLinkToast appears
    │
    ▼ (user clicks "Thử Ngay")
crawl-product-image Edge Function
    │
    ▼
Navigate to TryOnPage with:
  - initialGarmentUrl: crawled image
  - autoStart: true
    │
    ▼
TryOnPage auto-loads:
  - Default Body Image
  - Garment Image
    │
    ▼
Auto-trigger AI Try-On
    │
    ▼
ResultPreview
```

### Flow 2: Screenshot → Try-On

```
User clicks QuickTryFAB
    │
    ▼
QuickTrySheet opens
    │
    ▼ (user selects image)
smart-crop-clothing Edge Function
    │
    ▼
SmartCropPreview shows
    │
    ▼ (user confirms)
Navigate to TryOnPage with:
  - initialGarmentUrl: cropped image
  - autoStart: true
    │
    ▼
Auto-trigger AI Try-On
    │
    ▼
ResultPreview
```

### Flow 3: In-App Quick Try

```
User clicks QuickTryButton on card
    │
    ▼
Navigate to TryOnPage with:
  - initialGarmentUrl: card's image URL
  - initialGarmentId: card's item ID (if from DB)
    │
    ▼
TryOnPage auto-loads:
  - Default Body Image
  - Garment Image
    │
    ▼
Show toast: "Outfit loaded! Ready to generate."
    │
    ▼ (user can click Generate or modify)
AI Try-On
    │
    ▼
ResultPreview
```

## TryOnPage Refactor

### New Props

```typescript
interface TryOnPageProps {
  // Existing props
  initialItem?: ClothingItem;
  reuseBodyImage?: string;
  reuseClothingItems?: ClothingItem[];
  historyResult?: HistoryResultData;
  
  // New props for Smart Paste
  initialGarmentUrl?: string;
  initialGarmentId?: string;
  autoStart?: boolean; // Auto-trigger try-on on mount
}
```

### useEffect Logic

```typescript
useEffect(() => {
  if (initialGarmentUrl) {
    // 1. Set garment image
    const garmentItem: ClothingItem = {
      id: initialGarmentId || `quick-${Date.now()}`,
      name: 'Quick Try Item',
      imageUrl: initialGarmentUrl,
      category: 'all', // AI will detect
    };
    setSelectedItems([garmentItem]);
    
    // 2. Load default body image
    if (profile?.default_body_image_url) {
      setBodyImage(profile.default_body_image_url);
    } else {
      // Show BodyImagePrompt
      setShowBodyImageSourceDialog(true);
      return;
    }
    
    // 3. Show ready toast
    toast.success('Outfit loaded! Ready to generate.');
    
    // 4. Auto-start if requested
    if (autoStart && profile?.default_body_image_url) {
      setTimeout(() => handleAITryOn(), 500);
    }
  }
}, [initialGarmentUrl, initialGarmentId, autoStart, profile?.default_body_image_url]);
```

## State Management

### ClipboardContext (Optional)

Nếu cần share clipboard state across components:

```typescript
interface ClipboardContextValue {
  detectedLink: DetectedLink | null;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  dismissLink: () => void;
}
```

### Local Storage Keys

```typescript
const STORAGE_KEYS = {
  CLIPBOARD_ENABLED: 'smart_paste_clipboard_enabled',
  PROCESSED_LINKS: 'smart_paste_processed_links', // Array of URLs already shown
  LAST_CLIPBOARD_CHECK: 'smart_paste_last_check',
};
```

## Error Handling

### Crawl Errors

| Error | User Message | Action |
|-------|--------------|--------|
| Network timeout | "Không thể tải ảnh sản phẩm. Vui lòng thử lại." | Retry button |
| Invalid URL | "Link không hợp lệ" | Dismiss toast |
| Platform not supported | "Chưa hỗ trợ platform này" | Show manual upload option |
| No product image found | "Không tìm thấy ảnh sản phẩm" | Show manual upload option |

### Smart Crop Errors

| Error | User Message | Action |
|-------|--------------|--------|
| No clothing detected | "Không tìm thấy quần áo trong ảnh" | Show manual crop option |
| Multiple items | "Phát hiện nhiều món đồ. Vui lòng chọn một." | Show selection UI |
| Processing failed | "Không thể xử lý ảnh" | Retry button |

## Performance Considerations

1. **Clipboard Check Debounce**: Check clipboard max 1 lần/giây
2. **Image Caching**: Cache crawled images trong session
3. **Lazy Loading**: Load edge functions on-demand
4. **Optimistic UI**: Show loading state immediately

## Security Considerations

1. **Clipboard Permission**: Request permission trước khi đọc clipboard
2. **URL Validation**: Validate URL trước khi crawl
3. **Rate Limiting**: Limit crawl requests per user
4. **Content Validation**: Validate crawled content is image
