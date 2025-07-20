#!/bin/bash

echo "🚀 JustSpeak Deployment Script"
echo "==============================="
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📝 Starting Vercel deployment..."
echo "When prompted, create a new project"
echo ""

# Deploy to Vercel
vercel

echo ""
echo "✅ Initial deployment complete!"
echo ""
echo "🔐 Now set up environment variables:"
echo ""
echo "Run these commands one by one:"
echo ""
echo "vercel env add OPENAI_API_KEY production"
echo "vercel env add ELEVENLABS_API_KEY production"
echo "vercel env add JWT_SECRET production"
echo "vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"
echo "vercel env add NODE_ENV production"
echo "vercel env add REQUIRE_AUTH production"
echo ""
echo "After adding all environment variables, run:"
echo "vercel --prod"
echo ""
echo "Your app will be live at: https://[your-project-name].vercel.app"