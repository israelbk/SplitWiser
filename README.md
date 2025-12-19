# SplitWiser

A **mobile-first** expense tracking and splitting application built with Next.js, combining personal expense management with group expense splitting capabilities.

> **📱 Mobile-First**: This app is designed primarily for mobile use, with responsive desktop support. All UI decisions prioritize the mobile experience.

> **🤖 For AI Assistants**: See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for comprehensive technical documentation and [`/.cursorrules`](./.cursorrules) for coding guidelines.

## Features

### Personal Expenses
- Track your daily spending
- Categorize expenses (Food, Transport, Entertainment, etc.)
- Filter by category and date range
- View spending summary

### Group Expenses
- Create groups for trips, households, or any shared spending
- **Flexible expense splitting**:
  - Equal splits among all or selected members
  - Exact amounts per person
  - Percentage-based splits
  - Share-based splits (e.g., 2:1:1 ratio)
- **Multi-payer support**: Record when multiple people paid for an expense
- Automatic balance calculation
- Simplified debt view (who owes whom)

### Multi-Currency Support
- Add expenses in 8 different currencies (ILS, USD, EUR, GBP, JPY, CHF, CAD, AUD)
- **Currency conversion modes**:
  - **Original**: View expenses in their original currencies (percentages still calculated accurately via conversion)
  - **Current Rate**: Convert all expenses using today's exchange rates
  - **Historical Rate**: Convert using the rate from each expense's date
- Powered by Frankfurter API (European Central Bank data)
- Currency preferences stored per user
- New expenses default to user's display currency

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query v5
- **Forms**: react-hook-form + Zod
- **Deployment**: Vercel
- **Design**: Mobile-first responsive design with safe area support

## Quick Start (Development)

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
pnpm dev
# → http://localhost:3333
```

### VS Code Workspace

For the best development experience, open the workspace file:

```bash
code splitwiser.code-workspace
```

This provides:
- Pre-configured tasks (⌘+⇧+B to build)
- Recommended extensions
- Debug configurations
- Tailwind CSS IntelliSense

## Getting Started (Full Setup)

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- A Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd splitwiser
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to the SQL Editor and run the schema:
   ```bash
   # Copy and paste the contents of supabase/schema.sql
   ```
   
   c. Run the migrations (for multi-currency support):
   ```bash
   # Copy and paste the contents of supabase/migrations/001_add_multi_currency.sql
   ```
   
   d. Run the seed data:
   ```bash
   # Copy and paste the contents of supabase/seed.sql
   ```

4. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   Find these values in your Supabase project settings under "API".

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Personal expenses
│   └── groups/            # Group pages
├── components/
│   ├── ui/                # shadcn components
│   ├── common/            # Reusable business components
│   ├── features/          # Feature-specific components
│   └── layout/            # App layout components
├── hooks/
│   └── queries/           # TanStack Query hooks
├── lib/
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   ├── types/             # TypeScript types
│   └── constants/         # App constants
├── providers/             # Context providers
└── config/                # Configuration
```

## Architecture

The app follows a clean architecture pattern:

1. **Repository Layer**: Data access and Supabase operations
2. **Service Layer**: Business logic and data transformation
3. **Hooks Layer**: React Query integration for caching and mutations
4. **Component Layer**: UI components and features

This separation allows for easy testing, maintainability, and future expansion.

## POC Limitations

This is a proof-of-concept with the following simplifications:

- **Mock Users**: No real authentication (user selector dropdown for demo)
- **No Recurring Expenses**: Schema ready, UI not implemented
- **No Charts**: Basic summary only

## Future Features

The architecture is ready for:
- [ ] Real authentication (Supabase Auth)
- [x] ~~Unequal splits (percentage, shares, exact amounts)~~ ✅ Implemented
- [x] ~~Multi-payer expenses~~ ✅ Implemented
- [x] ~~Multi-currency support~~ ✅ Implemented
- [ ] Recurring expenses
- [ ] Charts and visualizations
- [ ] Settlement tracking
- [ ] Custom categories
- [ ] Receipt scanning

## Documentation

| Document | Purpose |
|----------|---------|
| [`README.md`](./README.md) | Project overview and setup |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Technical architecture, layers, patterns |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Vercel deployment guide |
| [`.cursorrules`](./.cursorrules) | AI coding assistant guidelines |
| [`supabase/schema.sql`](./supabase/schema.sql) | Database schema |

## Scripts

```bash
pnpm dev          # Start dev server (port 3333)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## License

MIT
