# JustSpeak Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Vercel account (free tier works)
- API keys for OpenAI and ElevenLabs
- Supabase account (optional, for data persistence)

## Quick Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Set Environment Variables
Copy `.env.production.example` to `.env.production` and fill in your values:
```bash
cp .env.production.example .env.production
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

Follow the prompts to:
- Link to your Vercel account
- Create a new project or link to existing
- Confirm deployment settings

### 4. Set Production Environment Variables
In Vercel Dashboard (vercel.com/dashboard):
1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add each variable from `.env.production`:
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`

## Alternative Deployment Options

### Deploy to Netlify
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Build: `npm run build`
3. Deploy: `netlify deploy --prod --dir=.next`

### Deploy to Railway
1. Connect GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Railway will auto-deploy on push

### Self-Host with Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Post-Deployment Checklist

- [ ] Test microphone permissions on production URL
- [ ] Verify API endpoints are working
- [ ] Check mobile responsiveness
- [ ] Test PWA installation
- [ ] Monitor error logs
- [ ] Set up domain (optional)

## Custom Domain Setup

1. In Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., justspeak.app)
3. Update DNS records as instructed
4. Update CORS origins in:
   - `/app/api/chat/route.ts`
   - `/middleware.ts`

## Monitoring

Consider setting up:
- Vercel Analytics (built-in)
- Sentry for error tracking
- LogRocket for session replay
- Uptime monitoring (e.g., UptimeRobot)

## Security Notes

- Never commit `.env` files
- Rotate API keys regularly
- Enable `REQUIRE_AUTH=true` for private deployments
- Review security headers in `vercel.json`

## Troubleshooting

### Build Fails
- Check Node version (18+)
- Run `npm install` locally
- Check for TypeScript errors: `npm run typecheck`

### API Not Working
- Verify environment variables are set
- Check API key validity
- Review CORS settings

### Mobile Issues
- Test on real devices
- Check microphone permissions
- Verify PWA manifest is accessible

## Cost Considerations

- Vercel: Free tier includes 100GB bandwidth
- OpenAI: ~$0.002 per conversation minute
- ElevenLabs: Check voice synthesis pricing
- Monitor usage to avoid surprises