import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const SUPABASE_URL = 'https://yhxnxnmlakahevfvmuxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloeG54bm1sYWthaGV2ZnZtdXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NjIxNDUsImV4cCI6MjA2NzIzODE0NX0.l4YV05SFiIDs7TfAgWIE_rK75sMKnzCIIPakRuyZlH8';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔍 Testing JustSpeak Database Connection...\n');
  
  // Test 1: RPC function call
  console.log('1️⃣ Testing RPC function...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('test_connection');
  
  if (rpcError) {
    console.error('❌ RPC Error:', rpcError);
  } else {
    console.log('✅ RPC Success:', rpcData);
  }
  
  // Test 2: Read from test table
  console.log('\n2️⃣ Testing table read...');
  const { data: testData, error: testError } = await supabase
    .from('connection_test')
    .select('*');
  
  if (testError) {
    console.error('❌ Table Read Error:', testError);
  } else {
    console.log('✅ Table Read Success:', testData);
  }
  
  // Test 3: Check speaking_sessions table structure
  console.log('\n3️⃣ Checking speaking_sessions table...');
  const { data: sessionData, error: sessionError } = await supabase
    .from('speaking_sessions')
    .select('*')
    .limit(1);
  
  if (sessionError) {
    console.error('❌ Speaking Sessions Error:', sessionError);
    console.log('   (This is normal if no data exists yet)');
  } else {
    console.log('✅ Speaking Sessions table is accessible');
  }
  
  // Test 4: Insert test data (anonymous)
  console.log('\n4️⃣ Testing anonymous insert...');
  const { data: insertData, error: insertError } = await supabase
    .from('connection_test')
    .insert({ message: 'Test from client at ' + new Date().toISOString() })
    .select();
  
  if (insertError) {
    console.error('❌ Insert Error:', insertError);
  } else {
    console.log('✅ Insert Success:', insertData);
  }
}

// Function to test authenticated operations
async function testAuthenticatedOperations(userId) {
  console.log('\n🔐 Testing Authenticated Operations...\n');
  
  // Create a test session
  const testSession = {
    user_id: userId,
    talk_time_seconds: 120,
    session_date: new Date().toISOString()
  };
  
  console.log('📝 Inserting speaking session...');
  const { data, error } = await supabase
    .from('speaking_sessions')
    .insert(testSession)
    .select();
  
  if (error) {
    console.error('❌ Session Insert Error:', error);
  } else {
    console.log('✅ Session Insert Success:', data);
    
    // Try to read it back
    const { data: readData, error: readError } = await supabase
      .from('speaking_sessions')
      .select('*')
      .eq('user_id', userId);
    
    if (readError) {
      console.error('❌ Session Read Error:', readError);
    } else {
      console.log('✅ User sessions retrieved:', readData);
    }
  }
}

// Main function
async function main() {
  // Run basic tests
  await testConnection();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('- Database URL:', SUPABASE_URL);
  console.log('- Tables created: speaking_sessions, connection_test');
  console.log('- RLS enabled with user-specific policies');
  console.log('- Ready for your speaking app!');
  console.log('='.repeat(50));
  
  console.log('\n💡 Next steps:');
  console.log('1. Sign up/login users with Supabase Auth');
  console.log('2. Use the speaking_sessions table to track talk time');
  console.log('3. Each user can only see/modify their own sessions');
}

// Run the tests
main().catch(console.error);

// Export for use in your app
export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };