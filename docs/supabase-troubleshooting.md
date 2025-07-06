# Supabase Configuration Troubleshooting Guide

## Current Issue
The database connection is failing with error P1001: Can't reach database server.

## Possible Causes & Solutions

### 1. Supabase Project is Paused
**Check:** Go to your Supabase dashboard at https://app.supabase.com
- Look for project: `yhxnxnmlakahevfvmuxc`
- If the project shows as "Paused", click "Restore" to reactivate it
- Free tier projects pause after 1 week of inactivity

### 2. Incorrect Database Password
**Solution:** Reset the database password in Supabase dashboard:
1. Go to Settings > Database
2. Click "Reset database password"
3. Copy the new password
4. Update the DATABASE_URL in both `.env` and `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.yhxnxnmlakahevfvmuxc.supabase.co:5432/postgres
   ```

### 3. Network/Firewall Issues
**Try alternative connection methods:**

#### Option A: Use Connection Pooler (Recommended for serverless)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.yhxnxnmlakahevfvmuxc.supabase.co:6543/postgres?pgbouncer=true
```

#### Option B: Use Direct Connection with SSL
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.yhxnxnmlakahevfvmuxc.supabase.co:5432/postgres?sslmode=require&sslcert=server-ca.pem
```

### 4. Project Deleted or Wrong Credentials
**Verify project exists:**
1. Visit: https://app.supabase.com/project/yhxnxnmlakahevfvmuxc
2. If 404, create a new project and update all credentials

## Manual Setup Steps (If Connection Works)

### 1. Connect to Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query

### 2. Create Tables Manually
If Prisma push fails, run this SQL:

```sql
-- Create tables based on Prisma schema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  age_group TEXT DEFAULT 'adult',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  mode TEXT DEFAULT 'conversation',
  user_talk_time INTEGER DEFAULT 0,
  ai_talk_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  message_id UUID UNIQUE REFERENCES messages(id),
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  corrections JSONB NOT NULL,
  areas_to_improve TEXT[],
  assessment_notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  daily_talk_time INTEGER DEFAULT 0,
  weekly_talk_time INTEGER DEFAULT 0,
  monthly_talk_time INTEGER DEFAULT 0,
  total_talk_time INTEGER DEFAULT 0,
  last_daily_update TIMESTAMPTZ DEFAULT NOW(),
  last_weekly_update TIMESTAMPTZ DEFAULT NOW(),
  last_monthly_update TIMESTAMPTZ DEFAULT NOW(),
  common_issues JSONB,
  improvement_areas JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Run Security Setup
After tables are created, run the SQL script in `scripts/setup-supabase.sql`

## Testing the Connection

### Using Node.js (create test-connection.js):
```javascript
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yhxnxnmlakahevfvmuxc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloeG54bm1sYWthaGV2ZnZtdXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NjIxNDUsImV4cCI6MjA2NzIzODE0NX0.l4YV05SFiIDs7TfAgWIE_rK75sMKnzCIIPakRuyZlH8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Connection failed:', error)
  } else {
    console.log('Connection successful!')
  }
}

testConnection()
```

## If All Else Fails

### Option 1: Create New Supabase Project
1. Create new project at https://app.supabase.com
2. Update all environment variables
3. Run Prisma push to create schema
4. Run security setup SQL

### Option 2: Continue in Local Mode
The app is configured to work without a database. You can:
1. Comment out Supabase credentials in `.env` and `.env.local`
2. Use the app with localStorage for session tracking
3. Set up database later when issues are resolved

## Support
- Supabase Status: https://status.supabase.com/
- Supabase Discord: https://discord.supabase.com/
- Check if your IP might be blocked by Supabase