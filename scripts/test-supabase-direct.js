const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase SQL Editor approach...')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTablesViaAPI() {
  console.log('\nAttempting to check existing tables via REST API...')
  
  try {
    // Try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation "public.users" does not exist')) {
        console.log('✓ Tables do not exist yet')
        console.log('\nNext steps:')
        console.log('1. Go to: https://app.supabase.com/project/yhxnxnmlakahevfvmuxc/sql')
        console.log('2. Create a new query')
        console.log('3. Copy and paste the SQL from: scripts/setup-supabase.sql')
        console.log('4. Also create the tables manually using the SQL in docs/supabase-troubleshooting.md')
        console.log('5. Run the query to create all tables and security policies')
        
        // Generate the direct link
        const sqlEditorUrl = `https://app.supabase.com/project/yhxnxnmlakahevfvmuxc/sql/new`
        console.log(`\nDirect link to SQL editor: ${sqlEditorUrl}`)
      } else {
        console.error('Error:', error.message)
      }
    } else {
      console.log('✓ Users table exists!')
      console.log('Tables are already created.')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTablesViaAPI()