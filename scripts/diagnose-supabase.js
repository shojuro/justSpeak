const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== Supabase Connection Diagnostics ===\n')

// Step 1: Verify credentials
console.log('1. CREDENTIAL CHECK:')
console.log('   URL:', supabaseUrl ? '✓ Found' : '✗ Missing')
console.log('   URL format:', supabaseUrl?.endsWith('.supabase.co') ? '✓ Correct (.supabase.co)' : '✗ Incorrect (should end with .supabase.co)')
console.log('   Anon Key:', supabaseAnonKey ? '✓ Found' : '✗ Missing')
console.log('   Key format:', supabaseAnonKey?.startsWith('eyJ') ? '✓ Valid JWT format' : '✗ Invalid format')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing credentials. Cannot proceed.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseConnection() {
  console.log('\n2. API CONNECTION TEST:')
  
  try {
    // Test basic auth connection
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log('   Auth test: ✗ Failed -', authError.message)
    } else {
      console.log('   Auth test: ✓ Successful')
      console.log('   Session:', authData.session ? 'Active' : 'No active session')
    }
  } catch (error) {
    console.log('   Auth test: ✗ Exception -', error.message)
  }

  console.log('\n3. DATABASE ACCESS TEST:')
  
  // Test 1: Try to access a simple table
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation "public.users" does not exist')) {
        console.log('   Table check: ⚠ Tables not created yet')
        console.log('   → Action needed: Run Prisma migration or SQL scripts')
      } else if (error.message.includes('row-level security')) {
        console.log('   RLS check: ⚠ Row Level Security is blocking access')
        console.log('   → Action needed: Create RLS policies or disable RLS')
      } else {
        console.log('   Database error:', error.message)
      }
    } else {
      console.log('   Database access: ✓ Successful')
    }
  } catch (error) {
    console.log('   Database test: ✗ Exception -', error.message)
  }

  console.log('\n4. RPC FUNCTION TEST:')
  
  // First create a test function (this will be done in SQL editor)
  const testFunctionSQL = `
-- Run this in Supabase SQL Editor:
CREATE OR REPLACE FUNCTION test_connection()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'Connection successful!'::text;
$$;

GRANT EXECUTE ON FUNCTION test_connection() TO anon, authenticated;
`
  
  try {
    const { data, error } = await supabase.rpc('test_connection')
    
    if (error) {
      if (error.message.includes('function public.test_connection() does not exist')) {
        console.log('   RPC test: ⚠ Test function not created')
        console.log('   → Action needed: Run this SQL in Supabase dashboard:')
        console.log(testFunctionSQL)
      } else {
        console.log('   RPC error:', error.message)
      }
    } else {
      console.log('   RPC test: ✓ Successful -', data)
    }
  } catch (error) {
    console.log('   RPC test: ✗ Exception -', error.message)
  }

  console.log('\n5. REALTIME CONNECTION TEST:')
  
  try {
    const channel = supabase.channel('test-channel')
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe()
        reject(new Error('Timeout after 5 seconds'))
      }, 5000)

      channel
        .on('system', { event: '*' }, () => {
          clearTimeout(timeout)
          console.log('   Realtime: ✓ Connected')
          channel.unsubscribe()
          resolve()
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('   Subscription: ✓ Active')
            clearTimeout(timeout)
            channel.unsubscribe()
            resolve()
          } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timeout)
            reject(new Error(`Subscription failed: ${status}`))
          }
        })
    })
  } catch (error) {
    console.log('   Realtime: ✗ Failed -', error.message)
  }

  console.log('\n=== DIAGNOSIS SUMMARY ===')
  console.log('\nNext Steps:')
  console.log('1. Go to: https://app.supabase.com/project/yhxnxnmlakahevfvmuxc/sql')
  console.log('2. Run the diagnostic SQL scripts from scripts/supabase-diagnosis.sql')
  console.log('3. Check Row Level Security settings')
  console.log('4. Apply the quick fix script if needed')
}

diagnoseConnection().then(() => {
  console.log('\n✨ Diagnosis complete!')
  process.exit(0)
}).catch((error) => {
  console.error('\n❌ Diagnosis failed:', error)
  process.exit(1)
})