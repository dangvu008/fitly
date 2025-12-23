# Tech Stack

## Frontend
- React 18 with TypeScript
- Vite (build tool, dev server on port 8080)
- TailwindCSS with custom theme (Instagram-inspired colors)
- shadcn/ui components (Radix UI primitives)
- React Router DOM for routing
- TanStack React Query for server state
- React Hook Form + Zod for forms
- Sonner for toast notifications

## Backend
- Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
- Edge Functions written in Deno/TypeScript
- Lovable AI Gateway for image generation/analysis

## Key Libraries
- `@supabase/supabase-js` - Database client
- `lucide-react` - Icons
- `embla-carousel-react` - Carousels
- `@huggingface/transformers` - Client-side ML (background removal)
- `canvas-confetti` - Animations
- `date-fns` - Date formatting

## Commands

```bash
# Development
npm run dev          # Start dev server (port 8080)

# Build
npm run build        # Production build
npm run build:dev    # Development build

# Quality
npm run lint         # ESLint check

# Preview
npm run preview      # Preview production build
```

## Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
