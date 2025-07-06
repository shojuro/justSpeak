-- Supabase Setup Script for TalkTime/JustSpeak
-- Run this script in the Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- Create RLS policies for sessions table
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Create RLS policies for messages table
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (session_id IN (
    SELECT id FROM sessions WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create own messages" ON messages
  FOR INSERT WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ));

-- Create RLS policies for assessments table
CREATE POLICY "Users can view own assessments" ON assessments
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own assessments" ON assessments
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Create RLS policies for user_stats table
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments(session_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add a comment to indicate setup is complete
COMMENT ON SCHEMA public IS 'TalkTime/JustSpeak database schema configured';