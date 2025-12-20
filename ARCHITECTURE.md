# SplitWiser Architecture Guide

> **For AI Assistants**: This document provides comprehensive context for understanding and modifying this codebase. Read this first before making any changes.

## Quick Start for AI

```bash
# Install dependencies
pnpm install

# Run development server (port 3333)
pnpm dev

# Build for production
pnpm build
```

**Key URLs:**
- Dev server: http://localhost:3333
- Supabase: Configured via `.env.local`

---

## Project Overview

SplitWiser is a **proof-of-concept** expense tracking and splitting app built with:

| Tech | Purpose |
|------|---------|
| Next.js 16 (App Router) | Framework, React 19 |
| Supabase | PostgreSQL database |
| TanStack Query v5 | Server state management |
| shadcn/ui + Radix | UI components |
| Tailwind CSS v4 | Styling |
| Zod | Validation |
| react-hook-form | Form handling |
| next-intl | Internationalization (i18n) |

### POC Limitations (intentional simplifications)

1. **No Authentication** - Mock user selector dropdown instead of real auth
2. **No Charts** - Basic summary only
3. **No Recurring Expenses** - Schema ready, UI not implemented

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     PAGES (App Router)                       │
│         src/app/page.tsx, src/app/groups/[id]/page.tsx       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    COMPONENTS LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   layout/   │  │   common/   │  │     features/       │  │
│  │  AppShell   │  │ ExpenseCard │  │ expenses/ExpenseList│  │
│  │   Header    │  │ ExpenseForm │  │ groups/GroupList    │  │
│  │  MobileNav  │  │ DatePicker  │  │ groups/GroupBalances│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      HOOKS LAYER                             │
│              src/hooks/queries/*.ts                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  useAllExpenses, useGroupExpenses, useCreateExpense   │  │
│  │  useGroups, useCreateGroup, useGroupBalances          │  │
│  │  useCurrencyPreferences, useConvertedExpenses         │  │
│  │  useCategories, useUsers                              │  │
│  └───────────────────────────────────────────────────────┘  │
│        TanStack Query: Caching, Mutations, Invalidation      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVICE LAYER                             │
│               src/lib/services/*.ts                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  expenseService  - Business logic for expenses        │  │
│  │  groupService    - Groups and membership              │  │
│  │  balanceService  - Balance calculation & debt         │  │
│  │  currencyService - Exchange rates & conversion        │  │
│  │  categoryService - Expense categories                 │  │
│  │  userService     - User management                    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  REPOSITORY LAYER                            │
│             src/lib/repositories/*.ts                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  BaseRepository - Generic CRUD operations             │  │
│  │  ExpenseRepository - Expense + contributions + splits │  │
│  │  GroupRepository - Groups + members                   │  │
│  │  CurrencyRepository - Exchange rate caching           │  │
│  │  CategoryRepository, UserRepository                   │  │
│  └───────────────────────────────────────────────────────┘  │
│              Supabase client (src/config/supabase.ts)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   DATABASE (Supabase)                        │
│                 supabase/schema.sql                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with Providers
│   ├── page.tsx                 # All expenses page (home)
│   ├── globals.css              # Tailwind + CSS variables
│   └── groups/
│       ├── page.tsx             # Groups list
│       └── [id]/page.tsx        # Single group detail
│
├── components/
│   ├── ui/                      # shadcn/ui primitives (DO NOT EDIT)
│   │   ├── button.tsx, card.tsx, dialog.tsx, etc.
│   │
│   ├── common/                  # Reusable business components
│   │   ├── expense-card.tsx    # Single expense display
│   │   ├── expense-form.tsx    # Add/edit expense modal
│   │   ├── split-config.tsx    # Payment & split configuration (Sheet)
│   │   ├── category-picker.tsx # Category selector
│   │   ├── currency-picker.tsx # Currency selector with priority
│   │   ├── date-picker.tsx     # Calendar date picker
│   │   ├── amount-input.tsx    # Currency-formatted input
│   │   ├── user-avatar.tsx     # User initials/avatar
│   │   ├── balance-display.tsx # Colored balance indicator
│   │   └── empty-state.tsx     # Empty list placeholder
│   │
│   ├── features/               # Feature-specific components
│   │   ├── expenses/
│   │   │   ├── expense-list.tsx    # List with cards
│   │   │   ├── expense-filters.tsx # Filter bar
│   │   │   └── expense-summary.tsx # Summary card
│   │   └── groups/
│   │       ├── group-list.tsx      # Groups grid
│   │       ├── group-card.tsx      # Single group card
│   │       ├── group-form.tsx      # Create group modal
│   │       └── group-balances.tsx  # Balance summary
│   │
│   └── layout/                 # App shell components
│       ├── app-shell.tsx       # Main layout wrapper
│       ├── header.tsx          # Top header with user/currency/language selector
│       ├── currency-selector.tsx # Currency conversion settings
│       ├── language-selector.tsx # Language selection with RTL support
│       ├── nav-tabs.tsx        # Desktop navigation
│       ├── mobile-nav.tsx      # Mobile bottom nav
│       └── user-selector.tsx   # Mock user dropdown
│
├── hooks/
│   ├── use-current-user.ts     # Current user context hook
│   └── queries/                # TanStack Query hooks
│       ├── query-keys.ts       # Centralized query keys
│       ├── use-expenses.ts     # Expense queries/mutations
│       ├── use-groups.ts       # Group queries/mutations
│       ├── use-balances.ts     # Balance calculations
│       ├── use-categories.ts   # Category queries
│       ├── use-users.ts        # User queries
│       └── use-language-preferences.ts # Language preferences
│
├── lib/
│   ├── services/               # Business logic layer
│   │   ├── expense.service.ts  # Expense operations
│   │   ├── group.service.ts    # Group operations
│   │   ├── balance.service.ts  # Balance calculations
│   │   ├── category.service.ts # Category operations
│   │   └── user.service.ts     # User operations
│   │
│   ├── repositories/           # Data access layer
│   │   ├── base.repository.ts  # Generic CRUD
│   │   ├── expense.repository.ts
│   │   ├── group.repository.ts
│   │   ├── category.repository.ts
│   │   └── user.repository.ts
│   │
│   ├── types/                  # TypeScript definitions
│   │   ├── expense.ts          # Expense, Split, Contribution
│   │   ├── group.ts            # Group, GroupMember
│   │   ├── category.ts         # Category
│   │   ├── user.ts             # User
│   │   ├── balance.ts          # Balance, Debt
│   │   └── locale.ts           # Locale types & constants
│   │
│   ├── constants/              # App constants
│   │   ├── categories.ts       # Category definitions
│   │   └── currencies.ts       # Currency config
│   │
│   └── utils.ts                # Utility functions (cn)
│
├── locales/                      # Translation files
│   ├── en.json                 # English translations
│   ├── he.json                 # Hebrew translations (RTL)
│   ├── es.json                 # Spanish translations
│   └── index.ts                # Messages loader
│
├── providers/
│   ├── index.tsx               # Combined providers wrapper
│   ├── query-provider.tsx      # TanStack Query provider
│   ├── user-provider.tsx       # Mock user context
│   └── locale-provider.tsx     # i18n provider with RTL support
│
└── config/
    ├── env.ts                  # Environment variables
    ├── supabase.ts             # Supabase client
    └── i18n.ts                 # Internationalization config
```

---

## Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | Mock users (auth-ready) |
| `categories` | Expense categories with icons/colors |
| `groups` | Expense splitting groups |
| `group_members` | Many-to-many: users ↔ groups |
| `expenses` | All expenses (personal + group) |
| `expense_contributions` | WHO PAID (supports multi-payer) |
| `expense_splits` | WHO OWES (supports various split types) |
| `settlements` | Future: tracking debt payments |

### Key Relationships

```
┌─────────┐     ┌─────────────────┐     ┌──────────┐
│  users  │◄────│  group_members  │────►│  groups  │
└────┬────┘     └─────────────────┘     └────┬─────┘
     │                                       │
     │         ┌───────────────────┐         │
     └────────►│     expenses      │◄────────┘
               └─────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌─────────────┐ ┌────────────┐
│ contributions │ │   splits    │ │ categories │
│  (who paid)   │ │ (who owes)  │ │            │
└───────────────┘ └─────────────┘ └────────────┘
```

### Personal vs Group Expenses

- **Personal expense**: `group_id = NULL`, one user in contributions + splits
- **Group expense**: `group_id = <uuid>`, payer in contributions, all members in splits

---

## Key Data Flows

### 1. Creating a Personal Expense

```
ExpenseForm → useCreateExpense → expenseService.createExpense
    → expenseRepository.createExpense
        → INSERT expense (group_id = NULL)
        → INSERT contribution (user = current user, amount = full)
        → INSERT split (user = current user, amount = full)
    → invalidateQueries(['expenses', 'all', userId])
```

### 2. Creating a Group Expense

```
ExpenseForm → useCreateExpense → expenseService.createExpense
    → expenseRepository.createExpense
        → INSERT expense (group_id = <uuid>)
        → INSERT contributions (from splitConfig.payments)
        → INSERT splits (from splitConfig.splits)
    → invalidateQueries(['expenses', 'group', groupId])
    → invalidateQueries(['groups', groupId, 'balances'])
```

### Split Configuration (SplitConfig Component)

The `SplitConfig` component handles complex payment and split configuration:

```
┌─────────────────────────────────────────────────────────────┐
│ ExpenseForm                                                 │
│   State: currentAmount, splitConfig, splitConfigOpen        │
│                                                             │
│   ┌──────────────────┐     ┌────────────────────────────┐  │
│   │SplitConfigTrigger│────►│ SplitConfig (Sheet)        │  │
│   │ disabled when    │     │                            │  │
│   │ amount <= 0      │     │ Tabs: "Paid by" | "Split"  │  │
│   └──────────────────┘     │                            │  │
│                            │ Split types:               │  │
│                            │  - Equal                   │  │
│                            │  - Exact amounts           │  │
│                            │  - Percentage              │  │
│                            │  - Shares (ratio)          │  │
│                            │                            │  │
│                            │ onSave → setSplitConfig    │  │
│                            └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:** Fully controlled component pattern
- Parent passes `amount` and `initialConfig` as props
- Child initializes internal state from props when opened
- On save, child calls `onSave(config)` callback
- No refs, no race conditions

### 3. Calculating Group Balances

```
useGroupBalances → balanceService.calculateGroupBalances
    → Get all contributions (what each user paid)
    → Get all splits (what each user owes)
    → Calculate net balance: paid - owes
    → Simplify debts using greedy matching algorithm
    → Return { userBalances, simplifiedDebts }
```

---

## Query Keys (Cache Management)

```typescript
// src/hooks/queries/query-keys.ts
queryKeys = {
  users:      { all: ['users'], detail: (id) => ['users', id] },
  categories: { all: ['categories'], system: ['categories', 'system'] },
  groups:     { 
    all: ['groups'], 
    detail: (id) => ['groups', id],
    balances: (id) => ['groups', id, 'balances']
  },
  expenses:   { 
    all: (userId) => ['expenses', 'all', userId],
    personal: (userId) => ['expenses', 'personal', userId],
    group: (groupId) => ['expenses', 'group', groupId]
  },
}
```

**Always invalidate related queries after mutations!**

---

## Type Patterns

### Domain Types vs Database Row Types

```typescript
// Domain type (camelCase, typed)
interface Expense {
  id: string;
  categoryId: string;  // camelCase
  groupId?: string;    // optional
  date: Date;          // Date object
}

// Database row type (snake_case, raw)
interface ExpenseRow {
  id: string;
  category_id: string;  // snake_case
  group_id: string | null; // null not undefined
  date: string;         // ISO string
}

// Transform function (in types file)
function expenseFromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    categoryId: row.category_id,
    groupId: row.group_id ?? undefined,
    date: new Date(row.date),
  };
}
```

---

## Component Patterns

### Client Components

All interactive components use `'use client'` directive:

```typescript
'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreateExpense } from '@/hooks/queries';

export function ExpenseForm() {
  const { currentUser } = useCurrentUser();
  const createExpense = useCreateExpense();
  // ...
}
```

### Form Handling

Using react-hook-form + zod:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { description: '', amount: 0 },
});
```

### Empty States

Always handle loading and empty states:

```typescript
if (isLoading) return <LoadingSkeleton />;
if (!data || data.length === 0) {
  return <EmptyState title="..." description="..." onAction={...} />;
}
return <List data={data} />;
```

---

## Styling

### Tailwind CSS v4

Uses the new Tailwind v4 syntax with CSS variables:

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --primary: oklch(0.55 0.2 260);
  --background: oklch(0.98 0.005 250);
  /* ... */
}
```

### Dark Mode

Supports dark mode via CSS class:

```css
.dark {
  --background: oklch(0.12 0.02 250);
  /* ... */
}
```

### Utility: `cn()`

Use for conditional classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "destructive" && "text-destructive"
)} />
```

---

## Internationalization (i18n)

### Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| en | English | LTR |
| he | Hebrew | RTL |
| es | Spanish | LTR |

### Using Translations

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('expenses');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('noExpenses')}</p>
      {/* With interpolation */}
      <p>{t('deleteConfirmDescription', { description: expense.description })}</p>
    </div>
  );
}
```

### Translation Files Structure

```json
// src/locales/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "expenses": {
    "title": "All Expenses",
    "noExpenses": "No expenses yet"
  }
}
```

### Language Preferences

- Language preference is stored in the `users.language` column
- Use `useLanguageSettings()` hook to get/set language
- RTL is automatically applied via the `dir` attribute on `<html>`

### Adding New Translations

1. Add keys to `src/locales/en.json`
2. Copy to `he.json` and `es.json` with translations
3. Use `useTranslations('namespace')` in components

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

**Note:** `NEXT_PUBLIC_` prefix is required for client-side access.

---

## Common Tasks

### Add a New Page

1. Create `src/app/[route]/page.tsx`
2. Use `AppShell` wrapper
3. Import hooks from `@/hooks/queries`

### Add a New Feature

1. Add types in `src/lib/types/`
2. Add repository in `src/lib/repositories/`
3. Add service in `src/lib/services/`
4. Add query hooks in `src/hooks/queries/`
5. Add components in `src/components/features/`

### Add a New UI Component

Use shadcn/ui CLI:
```bash
npx shadcn@latest add [component-name]
```

### Modify Database Schema

1. Update `supabase/schema.sql`
2. Run in Supabase SQL editor
3. Update TypeScript types
4. Update repositories

---

## Testing the App

1. **User Selection**: Use the dropdown in the header to switch between mock users
2. **Personal Expenses**: Add from the home page
3. **Groups**: Create groups, add members, add group expenses
4. **Balances**: View who owes whom in group detail page

---

## Future Development Roadmap

Ready in schema, needs UI implementation:

- [ ] **Supabase Auth** - Replace mock users
- [x] ~~**Unequal Splits** - Percentage, shares, exact amounts~~ ✅ Implemented
- [x] ~~**Multi-payer Expenses** - Multiple people paid~~ ✅ Implemented
- [x] ~~**Multi-currency** - Exchange rate support~~ ✅ Implemented
- [ ] **Recurring Expenses** - Monthly bills, subscriptions
- [ ] **Settlements** - Track debt payments
- [ ] **Charts** - Spending visualizations
- [ ] **Receipt Scanning** - OCR integration

---

## Troubleshooting

### "Missing environment variable" error
- Check `.env.local` exists and has correct values
- For Vercel: use `vercel env pull .env.local`

### Query not updating after mutation
- Check `invalidateQueries` is called with correct key
- Verify query key matches in `query-keys.ts`

### Supabase RLS errors
- POC uses permissive policies (`USING (true)`)
- For production, implement proper RLS

### Type errors with database rows
- Always use `fromRow()` transform functions
- Check for `null` vs `undefined` handling

---

## AI Assistant Notes

When modifying this codebase:

1. **Follow the layer pattern** - Don't skip layers (e.g., don't call repository from component)
2. **Keep types in sync** - Update both domain types and row types
3. **Invalidate queries** - Always invalidate related queries after mutations
4. **Use existing patterns** - Check similar features for implementation patterns
5. **Respect POC scope** - Don't over-engineer beyond current needs
6. **Test with mock users** - Use the user selector to test multi-user scenarios
7. **Update documentation** - After completing features, update README.md, ARCHITECTURE.md, or .cursorrules as needed (see `.cursorrules` for detailed checklist)

