# Quick Environment Setup for Vercel

## Required Environment Variables

Run these commands one by one in your terminal. Copy the values from your `.env.local` file:

```bash
# 1. Set JWT_SECRET (use this generated value)
echo "Isfyk5JyEjU9F7TE3oGGQv45N4Nk029FAkqOKYH7X/w=" | vercel env add JWT_SECRET production preview development

# 2. Set OPENAI_API_KEY (replace with your actual key)
echo "YOUR_OPENAI_API_KEY_HERE" | vercel env add OPENAI_API_KEY production preview development

# 3. Set Supabase URL
echo "https://yhxnxnmlakahevfvmuxc.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development

# 4. Set Supabase Anon Key (copy from .env.local)
echo "YOUR_SUPABASE_ANON_KEY_HERE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

# 5. Set NODE_ENV
echo "production" | vercel env add NODE_ENV production

# 6. Set REQUIRE_AUTH
echo "false" | vercel env add REQUIRE_AUTH production preview development
```

## Optional Variables

```bash
# ElevenLabs API Key (if you have one)
echo "YOUR_ELEVENLABS_KEY_HERE" | vercel env add ELEVENLABS_API_KEY production preview development

# Database URL (if using direct connection)
echo "YOUR_DATABASE_URL_HERE" | vercel env add DATABASE_URL production preview development
```

## After Setting Variables

1. Verify they're set:
   ```bash
   vercel env ls
   ```

2. Deploy to production:
   ```bash
   vercel --prod
   ```

## Quick Copy Commands

If you have your `.env.local` file ready, you can quickly extract values:

```bash
# Show your current .env.local values (don't share these!)
cat .env.local
```

Then copy the values and use them in the commands above.