#!/bin/bash

echo "🔐 Setting Vercel Environment Variables"
echo "======================================="
echo ""
echo "This script will guide you through setting up the required environment variables."
echo ""

# Function to add env var
add_env_var() {
    local var_name=$1
    local var_value=$2
    local env_type=${3:-"production preview development"}
    
    echo "Adding $var_name..."
    echo "$var_value" | vercel env add "$var_name" $env_type
}

echo "1. Setting JWT_SECRET (auto-generated)..."
JWT_SECRET="Isfyk5JyEjU9F7TE3oGGQv45N4Nk029FAkqOKYH7X/w="
add_env_var "JWT_SECRET" "$JWT_SECRET"

echo ""
echo "2. For OPENAI_API_KEY:"
echo "   Please copy your OpenAI API key and paste it below."
echo "   (Get it from https://platform.openai.com/api-keys)"
read -p "Enter OPENAI_API_KEY: " OPENAI_API_KEY
if [ ! -z "$OPENAI_API_KEY" ]; then
    add_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"
fi

echo ""
echo "3. For NEXT_PUBLIC_SUPABASE_URL:"
echo "   Using the URL from your .env.local file"
SUPABASE_URL="https://yhxnxnmlakahevfvmuxc.supabase.co"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"

echo ""
echo "4. For NEXT_PUBLIC_SUPABASE_ANON_KEY:"
echo "   Please copy your Supabase anon key from .env.local"
read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
if [ ! -z "$SUPABASE_ANON_KEY" ]; then
    add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
fi

echo ""
echo "5. Setting NODE_ENV..."
add_env_var "NODE_ENV" "production"

echo ""
echo "6. Setting REQUIRE_AUTH..."
add_env_var "REQUIRE_AUTH" "false"

echo ""
echo "7. For ELEVENLABS_API_KEY (optional):"
echo "   Press Enter to skip if you don't have one"
read -p "Enter ELEVENLABS_API_KEY (optional): " ELEVENLABS_API_KEY
if [ ! -z "$ELEVENLABS_API_KEY" ]; then
    add_env_var "ELEVENLABS_API_KEY" "$ELEVENLABS_API_KEY"
fi

echo ""
echo "8. For DATABASE_URL:"
echo "   Press Enter to skip for now (using Supabase client)"
read -p "Enter DATABASE_URL (optional): " DATABASE_URL
if [ ! -z "$DATABASE_URL" ]; then
    add_env_var "DATABASE_URL" "$DATABASE_URL"
fi

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "To verify, run: vercel env ls"
echo "To deploy, run: vercel --prod"