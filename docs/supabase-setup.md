# Supabase Setup Guide for TalkTime

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `talktime`
   - Database password: (save this securely!)
   - Region: Choose closest to you
5. Click "Create new project"

## 2. Get Your API Keys

Once your project is created:

1. Go to Settings → API
2. Copy these values to your `.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
   ```

## 3. Run Database Migrations

1. Install Prisma CLI if you haven't:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Push the schema to Supabase:
   ```bash
   npx prisma db push
   ```

## 4. Enable Row Level Security (RLS)

In Supabase dashboard:

1. Go to Authentication → Policies
2. Enable RLS for these tables:
   - `users`
   - `sessions`
   - `messages`
   - `assessments`
   - `user_stats`

3. Create policies for each table:

### Users Table Policy
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);
```

### Sessions Table Policy
```sql
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() IN (
    SELECT auth_id FROM users WHERE id = user_id
  ));

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT auth_id FROM users WHERE id = user_id
  ));

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() IN (
    SELECT auth_id FROM users WHERE id = user_id
  ));
```

### Similar policies for messages, assessments, and user_stats tables

## 5. Set Up Authentication

1. Go to Authentication → Providers
2. Enable Email provider (enabled by default)
3. (Optional) Enable social providers:
   - Google
   - GitHub
   - etc.

## 6. Configure Email Templates (Optional)

1. Go to Authentication → Email Templates
2. Customize the confirmation email
3. Add your app branding

## 7. Test Your Setup

1. Start your app: `npm run dev`
2. Go to http://localhost:3000/auth
3. Sign up with an email
4. Check your email for confirmation
5. Sign in and test the features

## Troubleshooting

- **Database connection issues**: Make sure your DATABASE_URL is correct
- **Auth not working**: Check that your SUPABASE_URL and ANON_KEY are correct
- **RLS errors**: Make sure you've enabled RLS and created the policies
- **Migration errors**: Try `npx prisma db push --force-reset` (WARNING: This will delete all data)

## Next Steps

- Set up regular database backups in Supabase dashboard
- Monitor usage in the Supabase dashboard
- Consider upgrading to Pro plan for production use