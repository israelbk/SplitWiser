# SplitWiser

A modern expense tracking and splitting application built with Next.js, combining personal expense management with group expense splitting capabilities.

> **🤖 For AI Assistants**: See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for comprehensive technical documentation and [`/.cursorrules`](./.cursorrules) for coding guidelines.

## Features

### Personal Expenses
- Track your daily spending
- Categorize expenses (Food, Transport, Entertainment, etc.)
- Filter by category and date range
- View spending summary

### Group Expenses
- Create groups for trips, households, or any shared spending
- Split expenses equally among group members
- Automatic balance calculation
- Simplified debt view (who owes whom)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Deployment**: Vercel

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
   
   c. Run the seed data:
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
- **Equal Splits Only**: Expenses are split equally among all group members
- **Single Currency**: ILS by default (schema supports multi-currency)
- **No Recurring Expenses**: Schema ready, UI not implemented
- **No Charts**: Basic summary only

## Future Features

The architecture is ready for:
- [ ] Real authentication (Supabase Auth)
- [ ] Unequal splits (percentage, shares, exact amounts)
- [ ] Multi-payer expenses
- [ ] Recurring expenses
- [ ] Charts and visualizations
- [ ] Settlement tracking
- [ ] Custom categories
- [ ] Multi-currency support
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
