# Design Document - Project Audit & Refactoring

## Overview

Tài liệu này mô tả thiết kế chi tiết cho việc audit và refactoring dự án AI Try-On, bao gồm các phát hiện từ quá trình phân tích và giải pháp đề xuất.

## Architecture

### Current State Analysis

```
src/
├── components/          # 50+ components, some >1000 lines
│   ├── ui/             # shadcn/ui - well organized
│   ├── layout/         # Header, MobileNav
│   ├── clothing/       # 8 components
│   ├── tryOn/          # 5 components
│   ├── outfit/         # Multiple dialogs
│   ├── feed/           # Social features
│   ├── home/           # Homepage sections
│   ├── monetization/   # Gems, Pro, Ads
│   └── shop/           # E-commerce
├── hooks/              # 31 hooks (some stubs)
├── pages/              # 17 pages
├── contexts/           # 3 contexts
├── services/           # 3 services (mixed concerns)
└── utils/              # 5 utilities
```

### Proposed Architecture

```
src/
├── components/
│   ├── ui/             # Base UI components (shadcn)
│   ├── common/         # Shared components (Avatar, Card, etc.)
│   ├── features/       # Feature-specific components
│   │   ├── try-on/
│   │   ├── wardrobe/
│   │   ├── feed/
│   │   └── monetization/
│   └── layout/         # App layout components
├── hooks/
│   ├── queries/        # React Query hooks
│   ├── mutations/      # Mutation hooks
│   └── utils/          # Utility hooks
├── lib/
│   ├── api/            # API client functions
│   ├── utils/          # Pure utility functions
│   └── validators/     # Zod schemas
├── pages/              # Route pages only
├── contexts/           # Global state
└── types/              # TypeScript types
```

## Components and Interfaces

### Design Token Interface

```typescript
// src/lib/design-tokens.ts
export const colors = {
  // Brand
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent))',
  
  // Instagram gradient
  ig: {
    yellow: 'hsl(var(--ig-yellow))',
    orange: 'hsl(var(--ig-orange))',
    pink: 'hsl(var(--ig-pink))',
    purple: 'hsl(var(--ig-purple))',
    blue: 'hsl(var(--ig-blue))',
  },
  
  // Social
  social: {
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    zalo: '#0068FF',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;
```

### Logging Utility Interface

```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error): void;
}

const isProduction = import.meta.env.PROD;

export const logger: Logger = {
  debug: (msg, data) => !isProduction && console.debug(msg, data),
  info: (msg, data) => console.info(msg, data),
  warn: (msg, data) => console.warn(msg, data),
  error: (msg, err) => console.error(msg, err),
};
```

## Data Models

### Audit Finding Model

```typescript
interface AuditFinding {
  id: string;
  category: 'security' | 'ui' | 'code' | 'architecture';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  files: string[];
  solution: string;
  status: 'open' | 'in_progress' | 'resolved';
}
```

### Findings Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 2 | 1 | 0 |
| UI/UX | 0 | 3 | 2 | 1 |
| Code | 0 | 1 | 4 | 2 |
| Architecture | 0 | 0 | 2 | 3 |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Color Token Consistency
*For any* component in the codebase, all color values SHALL reference design tokens or CSS variables, NOT hardcoded hex values.
**Validates: Requirements 1.2**

### Property 2: No Exposed Secrets
*For any* client-side code file, the file SHALL NOT contain hardcoded API keys, secrets, or credentials.
**Validates: Requirements 3.1**

### Property 3: Authentication Validation
*For any* Edge Function that processes user data, the function SHALL validate authentication before processing.
**Validates: Requirements 3.3**

### Property 4: Component Size Limit
*For any* component file, the file SHALL contain fewer than 400 lines of code.
**Validates: Requirements 4.1**

### Property 5: Naming Convention Compliance
*For any* hook file, the filename SHALL match the pattern `use[A-Z][a-zA-Z]+\.ts`.
**Validates: Requirements 4.1**

## Error Handling

### Security Error Handling

```typescript
// Edge Function pattern
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: corsHeaders }
  );
}
```

### Client Error Handling

```typescript
// React Query error handling
const { error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  onError: (err) => {
    logger.error('Failed to fetch data', err);
    toast.error('Không thể tải dữ liệu');
  },
});
```

## Testing Strategy

### Unit Tests
- Test design token exports
- Test utility functions
- Test validation schemas

### Property-Based Tests
- Color token compliance checker
- File naming convention validator
- Component size analyzer

### Integration Tests
- Authentication flow
- API error handling
- Form validation

### Test Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

## Migration Plan

### Phase 1: Security (Immediate)
1. Add `.env` to `.gitignore`
2. Create `.env.example`
3. Audit CORS configuration
4. Add input sanitization

### Phase 2: Design System (Week 1-2)
1. Create design token file
2. Update Tailwind config
3. Migrate hardcoded colors
4. Document in STYLE_GUIDE.md

### Phase 3: Code Cleanup (Week 2-3)
1. Remove unused code
2. Split large components
3. Consolidate duplicates
4. Add missing types

### Phase 4: Architecture (Week 3-4)
1. Reorganize file structure
2. Rename files consistently
3. Add error boundaries
4. Improve loading states

