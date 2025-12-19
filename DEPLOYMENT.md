# Vercel Deployment Guide

This guide will help you deploy SplitWiser to Vercel using the CLI (no click ops required).

## Prerequisites

- ✅ Build verified: `pnpm run build` works successfully
- ✅ Vercel account created
- ✅ Git repository connected (GitHub/GitLab/Bitbucket)

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
# or
pnpm add -g vercel
```

Verify installation:
```bash
vercel --version
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate. After authentication, you'll be logged in via CLI.

## Step 3: Link Your Project to Vercel

From your project root directory:

```bash
vercel link
```

You'll be prompted to:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account/team
3. **Link to existing project?** → No (for first deployment)
4. **What's your project's name?** → `splitwiser` (or your preferred name)
5. **In which directory is your code located?** → `./` (current directory)
6. **Want to connect your Git repository?** → **No** (we'll do this separately)

**⚠️ Important**: If you get an error about connecting to Git (e.g., "Failed to connect israelbk/SplitWiser"), choose **No** when asked about Git connection. We'll connect Git in Step 6 after ensuring GitHub integration is set up.

This creates a `.vercel` directory (already in `.gitignore`) with your project configuration.

## Step 4: Set Environment Variables

### Option A: Automated Script (Recommended - Less Clickops)

Use the provided script to set up all environment variables at once:

```bash
bash scripts/setup-vercel-env.sh
```

This script will:
- Prompt for your Supabase credentials once
- Add them to Production, Preview, and Development environments automatically
- No manual clicking or repeated prompts

### Option B: Manual CLI Commands (More Control)

Set your Supabase environment variables manually:

```bash
# Add to all environments at once (recommended)
vercel env add NEXT_PUBLIC_SUPABASE_URL
# When prompted, select: Production, Preview, Development (all three)
# Paste your Supabase URL

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# When prompted, select: Production, Preview, Development (all three)
# Paste your Supabase anon key
# Mark as sensitive? → y

# Or add to specific environments individually:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_URL development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
```

### Verify Environment Variables

```bash
vercel env ls
```

This shows all environment variables configured for your project.

## Step 5: Deploy to Production

```bash
vercel --prod
```

This will:
- Build your project
- Deploy to production
- Give you a production URL

## Step 6: Connect to Git Repository (Automatic Deployments)

### Option A: Via Vercel Dashboard (Recommended if CLI fails)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project (`splitwiser`)
3. Go to **Settings** → **Git**
4. Click **Connect Git Repository**
5. Select **GitHub** (or your Git provider)
6. Authorize Vercel to access your repositories if prompted
7. Select `israelbk/SplitWiser` from the list
8. Click **Connect**

### Option B: Via CLI (After GitHub Integration is Set Up)

First, ensure GitHub is connected to your Vercel account:
1. Go to [vercel.com/account/integrations](https://vercel.com/account/integrations)
2. Connect GitHub if not already connected
3. Grant access to your repositories

Then run:
```bash
vercel git connect
```

This will:
1. Detect your Git remote
2. Connect your Vercel project to your Git repository
3. Enable automatic deployments

**Alternative CLI command**: If `vercel git connect` doesn't work, try:
```bash
vercel project connect
```

Then follow the prompts to connect to your Git provider.

### Option C: Create Project with Git from Start

If you want to start fresh, you can create the project directly from Git:

```bash
vercel --yes
```

Then connect Git via the dashboard (Option A above).

## Step 7: Verify Automatic Deployments

After connecting to Git:
- Every push to `main` → Production deployment
- Every push to other branches → Preview deployment
- Every pull request → Preview deployment

You can verify this in your Vercel dashboard or by checking:
```bash
vercel ls
```

## Configuration Files

### `vercel.json`
Already created with:
- Build command: `pnpm run build`
- Framework: Next.js (auto-detected)
- Install command: `pnpm install`

### Environment Variables
Managed via CLI (see Step 4) or can be added to Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Useful Vercel CLI Commands

```bash
# List deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Remove a deployment
vercel remove [deployment-url]

# View project info
vercel inspect

# Pull environment variables (for local .env.local)
vercel env pull .env.local

# View domains
vercel domains ls

# Add custom domain
vercel domains add yourdomain.com
```

## Troubleshooting

### Build Fails
1. Check build locally: `pnpm run build`
2. Check environment variables are set: `vercel env ls`
3. View build logs: `vercel logs [deployment-url]`

### Environment Variables Not Working / "Missing or empty" Error

**Error**: `Missing or empty required environment variable: NEXT_PUBLIC_SUPABASE_URL`

**Solutions**:

1. **Verify Environment Variables Are Set Correctly**:
   ```bash
   vercel env pull .env.check --environment production
   cat .env.check | grep NEXT_PUBLIC
   ```
   Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` have non-empty values.

2. **Re-add Environment Variables** (if they're empty):
   ```bash
   # Remove empty ones
   vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes
   vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
   
   # Re-add with correct values
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Redeploy After Setting Env Vars**:
   ```bash
   vercel --prod --force
   ```
   The `--force` flag ensures a fresh build without cache.

4. **Clear Browser Cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or use incognito/private window

**Note**: `NEXT_PUBLIC_` variables must be available at **build time** to be bundled into client-side code. They're not available at runtime.

### Git Integration Not Working / "Failed to connect" Error

**Error**: `Failed to connect israelbk/SplitWiser to project`

**Solutions**:

1. **Skip Git connection during `vercel link`**:
   - When prompted "Want to connect your Git repository?", choose **No**
   - Complete the project setup first
   - Connect Git later via dashboard (Settings → Git → Connect Git Repository)

2. **Ensure GitHub Integration is Connected**:
   - Go to [vercel.com/account/integrations](https://vercel.com/account/integrations)
   - Connect GitHub if not connected
   - Grant access to your repositories (including private repos if applicable)

3. **Check Repository Access**:
   - Ensure the repository exists: `https://github.com/israelbk/SplitWiser`
   - Verify you have access to it
   - If it's private, make sure Vercel has access via GitHub integration

4. **Manual Connection via Dashboard**:
   - Go to your project → Settings → Git
   - Click "Connect Git Repository"
   - Select GitHub and authorize if needed
   - Choose your repository from the list

5. **Verify Git Remote**:
   ```bash
   git remote -v
   # Should show: origin https://github.com/israelbk/SplitWiser.git
   ```

## Next Steps

After deployment:
1. ✅ Test your production URL
2. ✅ Set up a custom domain (optional)
3. ✅ Configure preview deployments for PRs
4. ✅ Set up monitoring/alerts (optional)

## Quick Reference

```bash
# First-time setup (CLI - No Clickops!)
vercel login
vercel link
bash scripts/setup-vercel-env.sh  # Automated env var setup
vercel git connect  # Or connect via dashboard
vercel --prod

# Future deployments (automatic via Git, or manual)
vercel --prod  # Manual production deploy
```

## Why CLI is Better (Less Clickops)

✅ **Scriptable**: Can be automated and version controlled  
✅ **Repeatable**: Same commands work every time  
✅ **CI/CD Ready**: Can be integrated into deployment pipelines  
✅ **Faster**: No clicking through UI  
✅ **Documented**: Commands are in your repo/history  
✅ **Bulk Operations**: Set multiple env vars quickly  

The automated script (`scripts/setup-vercel-env.sh`) makes it even easier - one command sets up all environments.

