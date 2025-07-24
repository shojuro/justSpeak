# Vercel Environment Variables Setup

Before deploying, you need to set up the following environment variables in your Vercel dashboard:

1. Go to https://vercel.com/shojuros-projects/just-speak/settings/environment-variables
2. Add the following environment variables:

## Required Environment Variables

### OpenAI API Configuration
- **Variable Name**: `OPENAI_API_KEY`
- **Value**: Your OpenAI API key (starts with sk-proj-)
- **Environment**: Production, Preview, Development

### ElevenLabs API Configuration
- **Variable Name**: `ELEVENLABS_API_KEY`
- **Value**: Your ElevenLabs API key
- **Environment**: Production, Preview, Development

### JWT Secret
- **Variable Name**: `JWT_SECRET`
- **Value**: A secure random string (at least 32 characters)
- **Environment**: Production, Preview, Development

### Supabase Configuration
- **Variable Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Environment**: Production, Preview, Development

- **Variable Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anonymous key
- **Environment**: Production, Preview, Development

- **Variable Name**: `DATABASE_URL`
- **Value**: Your Supabase PostgreSQL connection string
- **Environment**: Production, Preview, Development

## After Setting Environment Variables

Once you've added all the environment variables, you can deploy using:

```bash
vercel --prod
```

Or push to your GitHub repository and Vercel will automatically deploy.