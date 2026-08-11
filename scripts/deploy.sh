#!/bin/bash
set -e

echo "🚀 Deploying Scan Story to www.thescanstory.com"
echo "============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
command -v vercel >/dev/null 2>&1 || {
  echo -e "${RED}❌ Vercel CLI not found. Install with: npm i -g vercel${NC}"
  exit 1
}

echo -e "${GREEN}✓ Vercel CLI found${NC}"

# Check if logged in to Vercel
if ! vercel whoami >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please login:${NC}"
  vercel login
fi

echo -e "${GREEN}✓ Logged in to Vercel${NC}"

# Validate environment variables
echo ""
echo "📋 Checking environment variables..."

if [ ! -f .env.local ]; then
  echo -e "${RED}❌ .env.local not found. Copy from .env.local.example and fill in values.${NC}"
  exit 1
fi

source .env.local

# Check critical env vars
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Missing Supabase credentials in .env.local${NC}"
  exit 1
fi

if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "change-me-please-CHANGE-THIS-IN-PRODUCTION" ]; then
  echo -e "${RED}❌ ADMIN_PASSWORD must be changed from default value${NC}"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ] || [ "$NEXT_PUBLIC_APP_URL" != "https://www.thescanstory.com" ]; then
  echo -e "${RED}❌ NEXT_PUBLIC_APP_URL must be set to https://www.thescanstory.com${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Environment variables validated${NC}"

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

echo -e "${GREEN}✓ Tests passed${NC}"

# Run lint
echo ""
echo "🔍 Running linter..."
npm run lint

echo -e "${GREEN}✓ Lint passed${NC}"

# Deploy to production
echo ""
echo "🚀 Deploying to production..."
vercel --prod --confirm

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Configure custom domain in Vercel dashboard (if not already done)"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Update Supabase production project with migrations"
echo "4. Seed admin user in production: npm run db:seed:admin"
echo "5. Test the deployment at https://www.thescanstory.com"
echo "6. Configure Razorpay webhook: https://www.thescanstory.com/api/webhooks/razorpay"
echo ""
echo "🔗 Don't forget to:"
echo "   - Verify domain in Resend dashboard (for emails)"
echo "   - Configure MSG91 for SMS (optional)"
echo "   - Enable Fluid Compute in Vercel (for video compression)"
