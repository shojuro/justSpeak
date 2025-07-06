-- SUPABASE DIAGNOSTIC AND FIX SCRIPT
-- Run these queries in order in the Supabase SQL Editor

-- ========================================
-- STEP 1: CHECK CURRENT STATUS
-- ========================================

-- Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- STEP 2: CREATE DIAGNOSTIC FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION diagnose_access_issues()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check RLS status
  RETURN QUERY
  SELECT 
    'RLS Status'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
      ) THEN 'ENABLED'
      ELSE 'DISABLED'
    END,
    jsonb_build_object(
      'tables_with_rls', (
        SELECT jsonb_agg(tablename) 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
      )
    );
  
  -- Check policies
  RETURN QUERY
  SELECT 
    'Policy Count'::TEXT,
    COUNT(*)::TEXT,
    jsonb_build_object(
      'policies', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'table', tablename,
            'policy', policyname,
            'command', cmd
          )
        )
        FROM pg_policies
        WHERE schemaname = 'public'
      )
    )
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Check auth schema
  RETURN QUERY
  SELECT 
    'Auth Schema'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'auth'
      ) THEN 'EXISTS'
      ELSE 'MISSING'
    END,
    jsonb_build_object(
      'user_count', (
        SELECT COUNT(*) FROM auth.users
      )
    );
  
  -- Check table existence
  RETURN QUERY
  SELECT 
    'Tables'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ) THEN 'EXIST'
      ELSE 'MISSING'
    END,
    jsonb_build_object(
      'table_list', (
        SELECT jsonb_agg(table_name)
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      )
    );
  
  -- Check permissions
  RETURN QUERY
  SELECT 
    'API Permissions'::TEXT,
    'CHECK'::TEXT,
    jsonb_build_object(
      'anon_permissions', (
        SELECT jsonb_agg(DISTINCT privilege_type)
        FROM information_schema.role_table_grants
        WHERE grantee = 'anon'
        AND table_schema = 'public'
      ),
      'authenticated_permissions', (
        SELECT jsonb_agg(DISTINCT privilege_type)
        FROM information_schema.role_table_grants
        WHERE grantee = 'authenticated'
        AND table_schema = 'public'
      )
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION diagnose_access_issues() TO anon, authenticated;

-- Run the diagnostic
SELECT * FROM diagnose_access_issues();

-- ========================================
-- STEP 3: CREATE TEST FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION test_connection()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'Connection successful!'::text;
$$;

GRANT EXECUTE ON FUNCTION test_connection() TO anon, authenticated;

-- ========================================
-- STEP 4: QUICK FIX FOR PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ========================================
-- STEP 5: CREATE TABLES (IF NOT EXISTS)
-- ========================================

-- Check if tables exist first
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- If no tables exist, you need to either:
-- 1. Run: npx prisma db push (from your terminal)
-- 2. Or manually create them using the SQL below:

/*
-- Manual table creation (uncomment and run if needed)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  age_group TEXT DEFAULT 'adult',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  message_id UUID UNIQUE REFERENCES messages(id),
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  corrections JSONB NOT NULL DEFAULT '[]'::jsonb,
  areas_to_improve TEXT[] DEFAULT ARRAY[]::TEXT[],
  assessment_notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
*/

-- ========================================
-- STEP 6: DISABLE RLS FOR TESTING
-- ========================================

-- If you want to temporarily disable RLS for testing:
/*
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
*/

-- ========================================
-- STEP 7: CREATE BASIC RLS POLICIES
-- ========================================

-- If RLS is enabled but no policies exist, create basic ones:

DO $$
BEGIN
  -- Check if users table exists and has RLS enabled
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'users'
    AND rowsecurity = true
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users'
  ) THEN
    -- Create basic policy for authenticated users
    EXECUTE 'CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Enable insert for authenticated users only" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_id)';
    EXECUTE 'CREATE POLICY "Enable update for users based on auth_id" ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_id) WITH CHECK (auth.uid() = auth_id)';
  END IF;
  
  -- Similar for other tables...
END $$;

-- ========================================
-- STEP 8: FINAL CHECK
-- ========================================

-- Run diagnostic again to see if issues are resolved
SELECT * FROM diagnose_access_issues();