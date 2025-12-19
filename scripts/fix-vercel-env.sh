#!/bin/bash

# Fix Vercel Environment Variables
# This script helps you remove and re-add environment variables to ensure they're set correctly

set -e

echo "🔧 Fixing Vercel Environment Variables"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This will remove existing environment variables and you'll need to re-add them${NC}"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Removing existing environment variables..."

# Remove from Production
vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>/dev/null || true

# Remove from Preview
vercel env rm NEXT_PUBLIC_SUPABASE_URL preview --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview --yes 2>/dev/null || true

# Remove from Development (URL only, anon key can't be in dev)
vercel env rm NEXT_PUBLIC_SUPABASE_URL development --yes 2>/dev/null || true

echo -e "${GREEN}✓${NC} Removed existing variables"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Now re-add your environment variables:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Add NEXT_PUBLIC_SUPABASE_URL:"
echo -e "   ${GREEN}vercel env add NEXT_PUBLIC_SUPABASE_URL${NC}"
echo "   When prompted:"
echo "   - Select: Production, Preview, Development (all three)"
echo "   - Paste your Supabase URL (make sure it starts with https://)"
echo "   - Mark as sensitive? → N"
echo ""
echo "2. Add NEXT_PUBLIC_SUPABASE_ANON_KEY:"
echo -e "   ${GREEN}vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
echo "   When prompted:"
echo "   - Select: Production, Preview (NOT Development - sensitive vars can't be in dev)"
echo "   - Paste your Supabase anon key"
echo "   - Mark as sensitive? → Y"
echo ""
echo "3. Verify:"
echo -e "   ${GREEN}vercel env ls${NC}"
echo ""
echo "4. Deploy:"
echo -e "   ${GREEN}vercel --prod${NC}"

