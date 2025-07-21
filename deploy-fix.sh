#!/bin/bash

echo "🚀 JustSpeak Deployment Fix Script"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed!${NC}"
    echo "Please install it with: npm i -g vercel"
    exit 1
fi

echo -e "${BLUE}Step 1: Committing and pushing code changes...${NC}"
git add -A
git commit -m "fix: Complete deployment fixes for production

- Fix middleware redirects to home page instead of non-existent /practice
- Add practice route redirect as fallback
- Simplify authentication for MVP (REQUIRE_AUTH=false)
- Enhance health check endpoint with comprehensive debugging
- Add environment variable validation
- Fix static asset serving

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main

echo ""
echo -e "${BLUE}Step 2: Updating Vercel environment variables...${NC}"

# Function to safely update env vars
update_env() {
    local var_name=$1
    local var_value=$2
    
    echo -e "${GREEN}Updating $var_name...${NC}"
    
    # Remove existing variable
    vercel env rm "$var_name" production --yes 2>/dev/null
    
    # Add variable without trailing newline
    echo -n "$var_value" | vercel env add "$var_name" production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $var_name updated${NC}"
    else
        echo -e "${RED}✗ Failed to update $var_name${NC}"
    fi
}

# Read from .env.local
if [ -f ".env.local" ]; then
    echo "Reading values from .env.local..."
    
    # Parse and update critical variables
    OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env.local | cut -d'=' -f2- | tr -d '\n\r')
    ELEVENLABS_KEY=$(grep "^ELEVENLABS_API_KEY=" .env.local | cut -d'=' -f2- | tr -d '\n\r')
    JWT_SECRET=$(grep "^JWT_SECRET=" .env.local | cut -d'=' -f2- | tr -d '\n\r')
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2- | tr -d '\n\r')
    SUPABASE_ANON=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2- | tr -d '\n\r')
    DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | tr -d '\n\r')
    
    # Update all variables
    update_env "OPENAI_API_KEY" "$OPENAI_KEY"
    update_env "ELEVENLABS_API_KEY" "$ELEVENLABS_KEY"
    update_env "JWT_SECRET" "$JWT_SECRET"
    update_env "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
    update_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON"
    update_env "DATABASE_URL" "$DATABASE_URL"
    
    # Set additional variables
    update_env "REQUIRE_AUTH" "false"
    update_env "NODE_ENV" "production"
    update_env "REDIS_ENABLED" "false"
    
else
    echo -e "${RED}Error: .env.local not found!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit health check: https://just-speak-2155muecy-shojuros-projects.vercel.app/api/health"
echo "2. Test the chat: https://just-speak-2155muecy-shojuros-projects.vercel.app"
echo "3. Check for any trailing newline issues in the health endpoint"
echo ""
echo -e "${BLUE}If issues persist, check:${NC}"
echo "- Vercel Function logs at: https://vercel.com/shojuros-projects/just-speak/functions"
echo "- Health check endpoint for detailed diagnostics"