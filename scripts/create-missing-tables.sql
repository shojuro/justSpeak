-- Create the missing tables for JustSpeak app
-- Run this in Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  age_group TEXT DEFAULT 'adult',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  mode TEXT DEFAULT 'conversation',
  user_talk_time INTEGER DEFAULT 0,
  ai_talk_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id UUID UNIQUE REFERENCES public.messages(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  corrections JSONB NOT NULL DEFAULT '[]'::jsonb,
  areas_to_improve TEXT[] DEFAULT ARRAY[]::TEXT[],
  assessment_notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_id);

-- Create RLS policies for sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own sessions" ON public.sessions
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- Create RLS policies for messages
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (session_id IN (
    SELECT id FROM public.sessions WHERE user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create own messages" ON public.messages
  FOR INSERT WITH CHECK (session_id IN (
    SELECT id FROM public.sessions WHERE user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  ));

-- Create RLS policies for assessments
CREATE POLICY "Users can view own assessments" ON public.assessments
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own assessments" ON public.assessments
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- Create RLS policies for user_stats
CREATE POLICY "Users can view own stats" ON public.user_stats
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own stats" ON public.user_stats
  FOR UPDATE USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own stats" ON public.user_stats
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON public.assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user into our custom users table
  INSERT INTO public.users (auth_id, email, name, age_group)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'age_group', 'adult')
  );
  
  -- Create initial user stats
  INSERT INTO public.user_stats (user_id)
  VALUES ((SELECT id FROM public.users WHERE auth_id = NEW.id));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test that everything works
SELECT 'Tables created successfully!' as status;