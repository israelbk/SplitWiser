# Vercel Environment Variables - CLI Commands

**Most Robust Approach: Use CLI (No Clickops)**

## Quick Setup (Copy & Paste)

Run these commands one by one. The CLI will prompt you interactively:

```bash
# 1. Add Supabase URL to all environments
vercel env add NEXT_PUBLIC_SUPABASE_URL
# When prompted:
#   - Select: Production, Preview, Development (use spacebar to select all, then Enter)
#   - Paste your Supabase URL
#   - Mark as sensitive? → N

# 2. Add Supabase Anon Key to all environments  
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# When prompted:
#   - Select: Production, Preview, Development (use spacebar to select all, then Enter)
#   - Paste your Supabase anon key
#   - Mark as sensitive? → Y

# 3. Verify
vercel env ls
```

## Why CLI is Better

✅ **Scriptable** - Can be automated  
✅ **Repeatable** - Same commands every time  
✅ **CI/CD Ready** - Integrates with pipelines  
✅ **Faster** - No UI clicking  
✅ **Documented** - Commands in repo/history  
✅ **Bulk Operations** - Set multiple env vars quickly  

## Alternative: Per-Environment Setup

If you want different values per environment:

```bash
# Production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Preview (for PR deployments)
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

# Development (for local testing via Vercel)
vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
```

## Useful Commands

```bash
# List all environment variables
vercel env ls

# Remove an environment variable
vercel env rm NEXT_PUBLIC_SUPABASE_URL production

# Pull environment variables to local file (for reference)
vercel env pull .env.production.local
```

