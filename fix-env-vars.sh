#!/bin/bash

echo "🔧 Fixing Vercel Environment Variables"
echo "======================================"
echo ""

# Remove existing variables first
echo "Removing existing environment variables..."
vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null
vercel env rm REQUIRE_AUTH production --yes 2>/dev/null
vercel env rm OPENAI_API_KEY production --yes 2>/dev/null

echo ""
echo "Setting clean environment variables..."
echo ""

# Set clean values without newlines
echo "1. Setting NEXT_PUBLIC_SUPABASE_URL..."
echo -n "https://yhxnxnmlakahevfvmuxc.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo ""
echo "2. Setting REQUIRE_AUTH..."
echo -n "false" | vercel env add REQUIRE_AUTH production

echo ""
echo "3. IMPORTANT: You need to set a valid OpenAI API key"
echo "   Get a new key from: https://platform.openai.com/api-keys"
echo ""
echo "Run this command with your VALID API key:"
echo 'echo -n "YOUR_VALID_OPENAI_API_KEY" | vercel env add OPENAI_API_KEY production'
echo ""
echo "After setting the valid API key, redeploy with: vercel --prod"