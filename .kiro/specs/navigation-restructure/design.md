# Design Document: Navigation Restructure

## Overview

Thiết kế lại cấu trúc điều hướng của ứng dụng "VTON GLOBAL" theo PRD mới với phong cách Minimalist, Premium, Social-centric. Hướng đến thị trường Tier 1 (US, EU, KR, JP) với hệ thống monetization lai ghép: Gems (IAP), Subscription (Pro), Affiliate, và Rewarded Ads.

### Kịch bản Monetization chính:
- **Kịch bản A - Impulse Try-On**: User thử đồ từ Community → Cost 1 Gem → Watch Ad hoặc Buy Gems
- **Kịch bản B - Serious Shopper**: User muốn 4K quality → Pro Subscription $4.99/week
- **Kịch bản C - Window Shopper**: User thử xong → "Find Similar on Amazon" → Affiliate commission

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TOP BAR (Fixed)                        │
│  [Logo TryOn]              [💎 123 (+)] [❤️ Saved] [👤 👑]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     MAIN CONTENT AREA                       │
│                                                             │
│    Renders based on activeTab:                              │
│    - home → HomePage                                        │
│    - search → SearchPage (NEW)                              │
│    - community → CommunityFeedPage                          │
│    - wardrobe → WardrobePage                                │
│                                                             │
│    FAB opens TryOnPage in overlay/full-screen               │
│                                                             │
│    Monetization Gates:                                      │
│    - Try-On: 1 Gem per action                               │
│    - 4K Upscale: Pro only (👑)                              │
│    - Affiliate: Post try-on results                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   BOTTOM NAVIGATION (Fixed)                 │
│                                                             │
│   [🏠]      [🔍]      [⚡FAB]      [🌍]      [📂]          │
│   Home     Search    Studio    Community  Wardrobe          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. MobileNav Component (Updated)

```typescript
// src/components/layout/MobileNav.tsx

interface NavItem {
  id: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, labelKey: 'nav_home' },
  { id: 'search', icon: Search, labelKey: 'nav_search' },
  { id: 'studio', icon: Zap, labelKey: 'nav_studio', isFab: true },
  { id: 'community', icon: Globe, labelKey: 'nav_community' },
  { id: 'wardrobe', icon: FolderOpen, labelKey: 'nav_wardrobe' },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenStudio: () => void;
}
```

### 2. FAB (Floating Action Button) Component

```typescript
// src/components/layout/FAB.tsx

interface FABProps {
  onClick: () => void;
  icon?: LucideIcon;
  className?: string;
}

// Styling:
// - Size: 56x56px minimum
// - Background: Primary/Accent color (gradient optional)
// - Position: Center of nav bar, elevated -12px above
// - Shadow: Elevated shadow for depth
// - Animation: Scale on press, subtle pulse on idle (optional)
```

### 3. Header Component (Updated)

```typescript
// src/components/layout/Header.tsx

interface HeaderProps {
  showGems?: boolean;
  showSaved?: boolean;
  showAvatar?: boolean;
  onGemsClick?: () => void;
  onSavedClick?: () => void;
  onAvatarClick?: () => void;
}

// Top Bar Layout:
// Left: Logo + App Name
// Right: [Gems] [Saved] [Avatar]
```

### 4. SearchPage Component (NEW)

```typescript
// src/pages/SearchPage.tsx

interface SearchPageProps {
  onSelectItem: (item: ClothingItem) => void;
}

// Features:
// - Search input with debounce
// - Category filters (horizontal scroll)
// - Trending items section
// - Search results grid
// - Recent searches (local storage)
// - Affiliate product cards with "Shop Now" CTA
```

### 5. Monetization Components (NEW)

```typescript
// src/components/monetization/GemsCounter.tsx
interface GemsCounterProps {
  balance: number;
  onPurchaseClick: () => void;
}

// src/components/monetization/GemsPurchaseDialog.tsx
interface GemsPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd: () => void;
  onPurchase: (packageId: string) => void;
}

// Gem packages:
// - Watch Ad: +1 Gem (free, max 5/day)
// - Small: 10 Gems for $0.99
// - Medium: 50 Gems for $3.99 (Best Value)
// - Large: 120 Gems for $7.99

// src/components/monetization/ProSubscriptionDialog.tsx
interface ProSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

// Pro features:
// - Unlimited 4K Upscale
// - No Gem cost for try-ons
// - Pro badge (👑)
// - Price: $4.99/week

// src/components/monetization/MonetizationGate.tsx
interface MonetizationGateProps {
  type: 'gems' | 'pro';
  onUnlock: () => void;
  gemCost?: number;
}

// src/components/monetization/AffiliateProductCard.tsx
interface AffiliateProductCardProps {
  product: AffiliateProduct;
  onShopNow: (url: string) => void;
}
```

### 6. Index/MainApp Updates

```typescript
// src/pages/Index.tsx

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  // Studio opens as overlay, doesn't change activeTab
  const handleOpenStudio = () => {
    setIsStudioOpen(true);
  };

  const handleCloseStudio = () => {
    setIsStudioOpen(false);
  };

  // Tab rendering
  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage />;
      case 'search': return <SearchPage />;
      case 'community': return <CommunityFeedPage />;
      case 'wardrobe': return <WardrobePage />;
      default: return <HomePage />;
    }
  };

  return (
    <>
      <Header />
      <main>{renderPage()}</main>
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onOpenStudio={handleOpenStudio}
      />
      
      {/* Studio Overlay */}
      {isStudioOpen && (
        <StudioOverlay onClose={handleCloseStudio} />
      )}
    </>
  );
};
```

## Data Models

### Navigation State

```typescript
interface NavigationState {
  activeTab: 'home' | 'search' | 'community' | 'wardrobe';
  isStudioOpen: boolean;
  tabScrollPositions: Record<string, number>;
}
```

### User Monetization State

```typescript
interface UserMonetizationState {
  gems: number;
  isPro: boolean;
  proExpiresAt: string | null;
  adsWatchedToday: number;
  lastAdWatchDate: string | null;
}

interface GemPackage {
  id: string;
  gems: number;
  price: number; // in cents
  currency: string;
  isBestValue?: boolean;
}

interface AffiliateProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  currency: string;
  shopUrl: string; // with affiliate tracking params
  platform: 'amazon' | 'shopee' | 'other';
}

interface MonetizationEvent {
  type: 'gem_purchase' | 'ad_watch' | 'subscription' | 'affiliate_click';
  userId: string;
  amount?: number;
  packageId?: string;
  timestamp: string;
}
```

### Translation Keys (New)

```typescript
// Add to translations.ts
{
  // Navigation
  nav_home: 'Home',
  nav_search: 'Search',
  nav_studio: 'Studio', // For accessibility, not displayed
  nav_community: 'Community',
  nav_wardrobe: 'Wardrobe',
  
  // Search
  search_placeholder: 'Search clothing...',
  search_trending: 'Trending',
  search_categories: 'Categories',
  search_recent: 'Recent Searches',
  
  // Monetization - Gems
  gems_balance: 'Gems',
  gems_cost: 'Cost: {count} Gem',
  gems_insufficient: 'Not enough gems',
  gems_watch_ad: 'Watch Ad for 1 Gem',
  gems_buy_title: 'Get More Gems',
  gems_package_small: '10 Gems',
  gems_package_medium: '50 Gems',
  gems_package_large: '120 Gems',
  gems_best_value: 'Best Value',
  
  // Monetization - Pro
  pro_title: 'Upgrade to Pro',
  pro_price: '$4.99/week',
  pro_feature_4k: 'Unlimited 4K Try-ons',
  pro_feature_no_gems: 'No Gem cost',
  pro_feature_badge: 'Pro Badge',
  pro_subscribe: 'Subscribe Now',
  pro_locked: 'Pro Feature',
  
  // Monetization - Affiliate
  affiliate_find_similar: 'Find Similar Items',
  affiliate_shop_now: 'Shop Now',
  affiliate_on_amazon: 'on Amazon',
  affiliate_on_shopee: 'on Shopee',
  
  // Monetization - Ads
  ads_watch_to_earn: 'Watch ad to earn gems',
  ads_loading: 'Loading ad...',
  ads_limit_reached: 'Daily ad limit reached',
  ads_error: 'Ad failed to load',
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Tab Exclusivity
*For any* navigation state, exactly one tab SHALL be active at any time (excluding FAB which is an action, not a tab).
**Validates: Requirements 1.1, 8.3**

### Property 2: FAB Independence
*For any* FAB tap action, the active tab indicator SHALL remain unchanged (FAB opens overlay, doesn't switch tabs).
**Validates: Requirements 4.4, 8.4**

### Property 3: Tab Order Consistency
*For any* render of the Bottom Navigation, the tabs SHALL always appear in the exact order: Home, Search, FAB, Community, Wardrobe.
**Validates: Requirements 1.1**

### Property 4: Translation Completeness
*For any* supported language, all navigation label keys SHALL have a non-empty translation value.
**Validates: Requirements 10.1, 10.2**

### Property 5: Touch Target Size
*For any* navigation element, the touch target size SHALL be at least 44x44 pixels, and FAB SHALL be at least 56x56 pixels.
**Validates: Requirements 9.2, 9.4**

### Property 6: Gems Balance Non-Negative
*For any* user state, the gems balance SHALL always be >= 0.
**Validates: Requirements 11.1, 11.6**

### Property 7: Monetization Gate Trigger
*For any* try-on action when user has 0 gems and is not Pro, the monetization gate SHALL be displayed.
**Validates: Requirements 11.3, 12.4**

### Property 8: Ad Watch Limit
*For any* user, the number of rewarded ads watched per day SHALL not exceed 5.
**Validates: Requirements 14.5**

### Property 9: Pro Subscription Unlocks 4K
*For any* user with active Pro subscription, the 4K Upscale option SHALL be unlocked without gem cost.
**Validates: Requirements 12.4**

### Property 10: Affiliate Link Tracking
*For any* affiliate link displayed, the URL SHALL contain valid tracking parameters.
**Validates: Requirements 13.3**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid tab ID | Default to 'home' tab |
| Studio fails to open | Show toast error, remain on current tab |
| Missing translation | Fall back to English |
| Navigation state corruption | Reset to default state (home tab) |
| Gem purchase fails | Show error toast, refund if charged |
| Ad fails to load | Show error, offer IAP alternative |
| Subscription verification fails | Retry 3 times, then show error |
| Affiliate link broken | Show toast, hide product card |
| Insufficient gems | Show monetization gate popup |
| Pro subscription expired | Revert to free tier, show renewal prompt |

## Testing Strategy

### Unit Tests
- Test navigation state transitions
- Test FAB click handler isolation
- Test translation key existence for all languages
- Test tab rendering logic

### Property-Based Tests
- Property 1: Generate random tab sequences, verify only one active
- Property 2: Generate FAB clicks at various states, verify tab unchanged
- Property 3: Render navigation multiple times, verify order
- Property 4: Check all translation keys across all languages

### Integration Tests
- Test full navigation flow: Home → Search → FAB → Close → Community
- Test state preservation when switching tabs
- Test deep linking to specific tabs
