# Vercel Deployment Instructions

## Method 1: Deploy via Vercel CLI (Recommended)

### Step 1: Deploy First
```bash
vercel
```

When prompted:
- Set up and deploy: Y
- Which scope: Select your account
- Link to existing project? N (create new)
- Project name: justspeak (or your choice)
- Directory: ./ (current directory)
- Override settings? N

### Step 2: Set Environment Variables
After deployment, set your environment variables:

```bash
# Set each environment variable
vercel env add OPENAI_API_KEY production
vercel env add ELEVENLABS_API_KEY production
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add DATABASE_URL production
vercel env add NODE_ENV production
vercel env add REQUIRE_AUTH production
```

For each variable, paste the value when prompted.

### Step 3: Redeploy with Environment Variables
```bash
vercel --prod
```

## Method 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure environment variables in the dashboard:
   - Click "Environment Variables"
   - Add each variable from `.env.local`
4. Click "Deploy"

## Environment Variables Needed

```
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_SUPABASE_URL=https://yhxnxnmlakahevfvmuxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
NODE_ENV=production
REQUIRE_AUTH=false
```

## Quick Copy-Paste Commands

```bash
# Copy these and replace with your actual values
vercel env add OPENAI_API_KEY production
# Paste: sk-proj-...your_key...

vercel env add ELEVENLABS_API_KEY production
# Paste: sk_...your_key...

vercel env add JWT_SECRET production
# Paste: dBMxnaPFpHH/RKjFPSQsr/rLbGHb+feRRRcuveKydu4=

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://yhxnxnmlakahevfvmuxc.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: eyJhbGc...your_key...

vercel env add NODE_ENV production
# Paste: production

vercel env add REQUIRE_AUTH production
# Paste: false
```

## Troubleshooting

### If you get environment variable errors:
1. Make sure you've added ALL required variables
2. Use `vercel env ls` to list current variables
3. Redeploy with `vercel --prod` after adding variables

### If build fails:
1. Check `vercel logs`
2. Ensure all dependencies are in package.json
3. Try building locally first: `npm run build`

## After Deployment

Your app will be available at:
- https://justspeak.vercel.app (or your-project-name.vercel.app)

To add a custom domain:
1. Go to your Vercel dashboard
2. Click on your project
3. Go to Settings → Domains
4. Add your domain