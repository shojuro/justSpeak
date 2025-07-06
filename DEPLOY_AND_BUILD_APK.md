# 🚀 Deploy to Vercel & Build APK

## Step 1: Deploy to Vercel (2 minutes)

### Option A: Via Browser (Recommended)
1. Visit https://vercel.com/new
2. Import your GitHub repository or upload the project
3. Set these environment variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `DATABASE_URL` = your PostgreSQL connection string
   - `JWT_SECRET` = generate a random string (32+ characters)

### Option B: Via CLI
```bash
# First login to Vercel
npx vercel login

# Then deploy
npx vercel

# Follow prompts and add environment variables when asked
```

## Step 2: Build APK with PWABuilder (5 minutes)

Once deployed to Vercel:

1. Visit https://www.pwabuilder.com/
2. Enter your Vercel URL (e.g., `https://justspeak-abc123.vercel.app`)
3. Click "Start" or "Build My PWA"
4. Wait for analysis (it will show your app is PWA-ready! ✅)
5. Click "Build" → "Android"
6. Choose "Unsigned APK" for testing
7. Download the APK

## Step 3: Install & Test

1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in Settings
3. Install and test!

## Alternative: Quick Test Without APK

On your Android phone:
1. Open Chrome browser
2. Visit your Vercel URL
3. Tap menu (⋮) → "Add to Home Screen"
4. Open from home screen - works like an app!

## Your App Status ✅
- All Prisma references removed
- TypeScript errors fixed
- Supabase integration complete
- PWA-ready with manifest & service worker
- Ready for deployment!

## Environment Variables Needed:
```
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
JWT_SECRET=[generate-random-32-char-string]
```