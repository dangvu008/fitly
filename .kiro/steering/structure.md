# Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── layout/         # Header, navigation, layout wrappers
│   ├── clothing/       # Clothing cards, dialogs, category UI
│   ├── tryOn/          # Try-on canvas, progress, result editing
│   ├── outfit/         # Outfit sharing, display components
│   ├── feed/           # Social feed cards, comments
│   ├── home/           # Homepage sections
│   └── auth/           # Authentication dialogs
├── pages/              # Route page components
├── hooks/              # Custom React hooks (data fetching, state)
├── contexts/           # React contexts (Auth, Language, Compare)
├── integrations/
│   └── supabase/       # Supabase client and generated types
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (image processing)
├── data/               # Static/sample data
├── i18n/               # Translations (6 languages)
└── lib/                # Shared utilities (cn helper)

supabase/
├── functions/          # Deno Edge Functions
│   ├── virtual-try-on/         # AI try-on generation
│   ├── analyze-clothing-image/ # Clothing categorization
│   ├── analyze-body-image/     # Body image validation
│   └── edit-try-on-result/     # Result editing
└── migrations/         # Database migrations
```

## Conventions

- Path alias: `@/` maps to `src/`
- Components use PascalCase filenames
- Hooks prefixed with `use` (e.g., `useUserClothing.ts`)
- Pages suffixed with `Page` (e.g., `TryOnPage.tsx`)
- UI components in `components/ui/` follow shadcn patterns
- Database types auto-generated in `integrations/supabase/types.ts`
- Edge functions use Deno imports from esm.sh and deno.land
