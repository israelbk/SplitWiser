#!/bin/bash

# Setup Vercel Environment Variables - Interactive Guide
# This script guides you through setting up environment variables via CLI
# Run: bash scripts/setup-vercel-env.sh

set -e

echo "🚀 Vercel Environment Variables Setup Guide"
echo ""
echo "This script will guide you through setting up environment variables"
echo "using the Vercel CLI (most robust, no clickops approach)."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Install it with: npm i -g vercel"
    exit 1
fi

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Project is not linked to Vercel. Run: vercel link"
    exit 1
fi

echo -e "${GREEN}✓${NC} Vercel CLI installed"
echo -e "${GREEN}✓${NC} Project linked to Vercel"
echo ""

echo "📝 You'll need your Supabase credentials."
echo "   Find them in your Supabase project settings under 'API'"
echo ""

read -p "Press Enter to continue..."

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Add NEXT_PUBLIC_SUPABASE_URL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Run this command (it will prompt you interactively):"
echo ""
echo -e "${GREEN}vercel env add NEXT_PUBLIC_SUPABASE_URL${NC}"
echo ""
echo "When prompted:"
echo "  1. Select: Production, Preview, Development (use spacebar to select all)"
echo "  2. Paste your Supabase URL"
echo "  3. Mark as sensitive? → N (it's a public URL)"
echo ""

read -p "Press Enter after you've run the command above..."

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Add NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Run this command:"
echo ""
echo -e "${GREEN}vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
echo ""
echo "When prompted:"
echo "  1. Select: Production, Preview, Development (use spacebar to select all)"
echo "  2. Paste your Supabase anon key"
echo "  3. Mark as sensitive? → Y (this should be kept secret)"
echo ""

read -p "Press Enter after you've run the command above..."

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Verify Environment Variables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Verify your environment variables are set:"
echo ""
echo -e "${GREEN}vercel env ls${NC}"
echo ""

read -p "Press Enter to run the verification command..."
vercel env ls

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  🚀 Deploy to production: ${GREEN}vercel --prod${NC}"
echo "  📋 View deployments: ${GREEN}vercel ls${NC}"
echo ""

