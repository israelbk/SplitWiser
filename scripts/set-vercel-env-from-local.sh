#!/bin/bash

# Set Vercel environment variables from .env.local file
# This script reads your local .env.local and sets the values in Vercel

set -e

echo "🔧 Setting Vercel environment variables from .env.local"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    exit 1
fi

# Read values from .env.local
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local${NC}"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found values in .env.local:"
echo "  URL: ${SUPABASE_URL:0:30}..."
echo "  Anon Key: ${SUPABASE_ANON_KEY:0:30}..."
echo ""

echo "⚠️  This will set environment variables in Vercel."
echo "   You'll need to manually confirm each addition."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "📝 Setting NEXT_PUBLIC_SUPABASE_URL..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo ""
echo "📝 Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "Verify with: vercel env ls"
echo "Deploy with: vercel --prod --force"

