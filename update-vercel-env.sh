#!/bin/bash

echo "🔧 Updating Vercel Environment Variables (Removing Trailing Newlines)"
echo "====================================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will update all environment variables to remove trailing newlines.${NC}"
echo -e "${YELLOW}Make sure you have the Vercel CLI logged in and the correct project selected.${NC}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed!${NC}"
    echo "Please install it with: npm i -g vercel"
    exit 1
fi

echo -e "${BLUE}Current project info:${NC}"
vercel project ls 2>/dev/null | head -5
echo ""

# Function to update an environment variable
update_env() {
    local var_name=$1
    local var_value=$2
    
    echo -e "${GREEN}Updating $var_name...${NC}"
    
    # Remove the variable first (ignore errors if it doesn't exist)
    vercel env rm "$var_name" production --yes 2>/dev/null
    
    # Add the variable without trailing newline
    echo -n "$var_value" | vercel env add "$var_name" production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $var_name updated successfully${NC}"
    else
        echo -e "${RED}✗ Failed to update $var_name${NC}"
        return 1
    fi
    echo ""
}

# Read the current .env.local file to get the values
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local file not found!${NC}"
    exit 1
fi

echo "Reading values from .env.local..."
echo ""

# Parse .env.local and update each variable
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove any quotes and trailing whitespace/newlines
    value=$(echo "$value" | sed 's/^["\x27]//;s/["\x27]$//' | tr -d '\n\r')
    
    # Update the variable in Vercel
    case "$key" in
        OPENAI_API_KEY)
            update_env "OPENAI_API_KEY" "$value"
            ;;
        ELEVENLABS_API_KEY)
            update_env "ELEVENLABS_API_KEY" "$value"
            ;;
        JWT_SECRET)
            update_env "JWT_SECRET" "$value"
            ;;
        NEXT_PUBLIC_SUPABASE_URL)
            update_env "NEXT_PUBLIC_SUPABASE_URL" "$value"
            ;;
        NEXT_PUBLIC_SUPABASE_ANON_KEY)
            update_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$value"
            ;;
        DATABASE_URL)
            update_env "DATABASE_URL" "$value"
            ;;
    esac
done < .env.local

# Also update REQUIRE_AUTH and NODE_ENV
echo -e "${GREEN}Setting additional environment variables...${NC}"
update_env "REQUIRE_AUTH" "false"
update_env "NODE_ENV" "production"

echo ""
echo -e "${GREEN}✅ Environment variables updated!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Push your code changes: git push origin main"
echo "2. Redeploy: vercel --prod"
echo ""
echo "Your deployment URL: https://just-speak-2155muecy-shojuros-projects.vercel.app"