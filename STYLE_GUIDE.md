# 🎨 Style Guide - AI Try-On Design System

## Overview

Tài liệu này định nghĩa các quy tắc thiết kế và coding conventions cho dự án AI Try-On.

---

## 🎨 Color System

### Brand Colors (Instagram-inspired)

```css
/* Primary Palette */
--color-primary: hsl(214 100% 59%);        /* Instagram Blue */
--color-accent: hsl(340 82% 52%);          /* Instagram Pink */

/* Instagram Gradient */
--ig-yellow: hsl(45 100% 51%);
--ig-orange: hsl(28 100% 54%);
--ig-pink: hsl(340 82% 52%);
--ig-purple: hsl(280 87% 50%);
--ig-blue: hsl(214 100% 59%);

/* Magic Gradient (CTA) */
--magic-from: hsl(271 73% 53%);            /* #8E2DE2 */
--magic-to: hsl(256 100% 44%);             /* #4A00E0 */

/* Gem Colors */
--gem: hsl(51 100% 50%);                   /* Gold #FFD700 */
--gem-light: hsl(51 100% 63%);
--gem-dark: hsl(51 100% 45%);
```

### Semantic Colors

```css
/* Backgrounds */
--background: hsl(0 0% 100%);              /* Light mode */
--background-dark: hsl(0 0% 0%);           /* Dark mode */
--card: hsl(0 0% 100%);
--muted: hsl(220 14% 96%);

/* Text */
--foreground: hsl(0 0% 7%);
--muted-foreground: hsl(220 9% 46%);

/* Borders */
--border: hsl(220 13% 91%);
--border-dark: hsl(0 0% 20%);

/* States */
--destructive: hsl(0 84% 60%);
--success: hsl(142 76% 36%);
--warning: hsl(38 92% 50%);
```

### Social Brand Colors

```css
/* Use these for social sharing buttons */
--social-facebook: #1877F2;
--social-twitter: #1DA1F2;
--social-messenger: linear-gradient(to right, #00B2FF, #006AFF);
--social-zalo: #0068FF;
--social-google-blue: #4285F4;
--social-google-green: #34A853;
--social-google-yellow: #FBBC05;
--social-google-red: #EA4335;
```

### ❌ DON'T: Hardcode Colors

```tsx
// ❌ Bad
<div style={{ background: '#ec4899' }}>
<div className="bg-[#8B5CF6]">

// ✅ Good
<div className="bg-primary">
<div className="bg-ig-pink">
<div className="gradient-magic">
```

---

## 📐 Spacing Scale

Sử dụng spacing scale 4px-based:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing, icon gaps |
| `space-2` | 8px | Default small gap |
| `space-3` | 12px | Medium gap |
| `space-4` | 16px | Default padding |
| `space-5` | 20px | Section padding |
| `space-6` | 24px | Large gap |
| `space-8` | 32px | Section margins |
| `space-12` | 48px | Page sections |

### Tailwind Mapping

```tsx
// ✅ Preferred spacing classes
gap-1    // 4px
gap-2    // 8px
gap-3    // 12px
gap-4    // 16px
p-4      // 16px padding
py-6     // 24px vertical padding
mb-8     // 32px margin bottom
```

---

## 📝 Typography

### Font Families

```css
--font-display: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Font Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-2xs` | 10px | 400 | Timestamps, badges |
| `text-xs` | 12px | 400 | Captions, labels |
| `text-sm` | 14px | 400 | Body small |
| `text-base` | 16px | 400 | Body default |
| `text-lg` | 18px | 500 | Subheadings |
| `text-xl` | 20px | 600 | Headings |
| `text-2xl` | 24px | 700 | Page titles |

### Heading Styles

```tsx
// Page title
<h1 className="font-display text-2xl font-bold">

// Section heading
<h2 className="font-display text-lg font-semibold">

// Card title
<h3 className="font-body text-base font-medium">
```

---

## 🔘 Button Variants

### Primary Buttons

```tsx
// Default primary
<Button variant="default">Action</Button>

// Instagram gradient
<Button variant="instagram">Share</Button>

// Magic gradient (CTA)
<Button className="btn-magic">Try Now</Button>
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>      // h-8, text-xs
<Button size="default">Default</Button> // h-10, text-sm
<Button size="lg">Large</Button>      // h-12, text-base
<Button size="icon">🔍</Button>       // h-10 w-10
<Button size="iconSm">🔍</Button>     // h-8 w-8
```

### Icon Buttons

```tsx
// Ghost icon button
<Button variant="ghost" size="icon">
  <Heart size={20} />
</Button>

// With hover effect
<button className="icon-btn">
  <Settings size={20} />
</button>
```

---

## 📦 Component Patterns

### Card Component

```tsx
// Standard card
<div className="card-instagram">
  <div className="p-4">
    {/* content */}
  </div>
</div>

// With shadow
<div className="bg-card rounded-xl border border-border shadow-soft">
```

### Input Fields

```tsx
// Standard input
<Input className="input-instagram" placeholder="Search..." />

// With icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
  <Input className="pl-10" />
</div>
```

### Avatar with Story Ring

```tsx
<div className="story-ring">
  <div className="story-ring-inner">
    <Avatar className="h-10 w-10">
      <AvatarImage src={url} />
      <AvatarFallback>U</AvatarFallback>
    </Avatar>
  </div>
</div>
```

---

## 🎬 Animation Guidelines

### Preferred Animations

```tsx
// Fade in
className="animate-fade-in"

// Scale in
className="animate-scale-in"

// Slide up
className="animate-slide-up"

// Staggered animation
style={{ animationDelay: `${index * 0.05}s` }}
```

### Animation Durations

| Type | Duration | Easing |
|------|----------|--------|
| Micro | 100ms | ease-out |
| Fast | 200ms | ease-out |
| Normal | 300ms | ease-out |
| Slow | 500ms | ease-in-out |

### ❌ DON'T: Overuse Inline Styles for Animation

```tsx
// ❌ Bad
style={{ animation: 'bounce 1s infinite', animationDelay: '0.2s' }}

// ✅ Good - Use Tailwind or CSS classes
className="animate-bounce"
// Or create custom utility
className="animate-bounce delay-200"
```

---

## 📁 File Naming Conventions

### Components

```
PascalCase.tsx
├── Button.tsx
├── ClothingCard.tsx
├── TryOnCanvas.tsx
```

### Hooks

```
camelCase with 'use' prefix
├── useAuth.ts
├── useAITryOn.ts
├── useUserClothing.ts
```

### Utilities

```
camelCase.ts
├── imageCompression.ts
├── validationSuggestions.ts
```

### Test Files

```
ComponentName.test.tsx
hookName.test.ts
```

---

## 🏗️ Component Structure

### Recommended Order

```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface Props {
  title: string;
  onAction: () => void;
}

// 3. Constants
const MAX_ITEMS = 10;

// 4. Component
export const MyComponent = ({ title, onAction }: Props) => {
  // 4a. Hooks
  const [state, setState] = useState(false);
  
  // 4b. Derived state
  const isValid = state && title.length > 0;
  
  // 4c. Handlers
  const handleClick = () => {
    onAction();
  };
  
  // 4d. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 4e. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Max Lines per File

| Type | Max Lines |
|------|-----------|
| Component | 300 |
| Hook | 150 |
| Utility | 100 |
| Page | 400 |

---

## 🔒 Security Guidelines

### Environment Variables

```tsx
// ✅ Good - Use import.meta.env
const apiUrl = import.meta.env.VITE_SUPABASE_URL;

// ❌ Bad - Hardcoded values
const apiUrl = 'https://xxx.supabase.co';
```

### User Input

```tsx
// ✅ Always sanitize user input
const sanitizedInput = DOMPurify.sanitize(userInput);

// ✅ Use Zod for validation
const schema = z.string().email();
```

### API Calls

```tsx
// ✅ Always check authentication
const { user } = useAuth();
if (!user) {
  throw new Error('Unauthorized');
}
```

---

## 📋 Checklist for New Components

- [ ] Uses design tokens for colors
- [ ] Uses spacing scale
- [ ] Has TypeScript types
- [ ] Has loading state
- [ ] Has error state
- [ ] Is accessible (aria labels, keyboard nav)
- [ ] Is responsive
- [ ] Has tests
- [ ] Under 300 lines

