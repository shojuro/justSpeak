const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl ? '✓ Found' : '✗ Missing')
console.log('Anon Key:', supabaseAnonKey ? '✓ Found' : '✗ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing environment variables!')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('\n1. Testing API connection...')
  try {
    // Test basic API connectivity
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    console.log('✓ API connection successful')
    console.log('Session:', data.session ? 'Active' : 'No active session')
  } catch (error) {
    console.error('✗ API connection failed:', error.message)
  }

  console.log('\n2. Testing database connection...')
  try {
    // Try to query a table (will fail if tables don't exist)
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) throw error
    console.log('✓ Database connection successful')
  } catch (error) {
    console.error('✗ Database query failed:', error.message)
    if (error.message.includes('relation "public.users" does not exist')) {
      console.log('  → Tables not created yet. Run: npx prisma db push')
    }
  }

  console.log('\n3. Testing authentication...')
  try {
    // Check if anonymous sign-in is enabled
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    console.log('✓ Anonymous auth enabled')
    
    // Sign out
    await supabase.auth.signOut()
  } catch (error) {
    if (error.message.includes('Anonymous sign-ins are disabled')) {
      console.log('ℹ Anonymous auth disabled (this is normal)')
    } else {
      console.error('✗ Auth test failed:', error.message)
    }
  }

  console.log('\n4. Testing Realtime connection...')
  try {
    const channel = supabase.channel('test')
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe()
        reject(new Error('Realtime connection timeout'))
      }, 5000)

      channel
        .on('system', { event: '*' }, (payload) => {
          clearTimeout(timeout)
          console.log('✓ Realtime connection successful')
          channel.unsubscribe()
          resolve()
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✓ Realtime subscription active')
          }
        })
    })
  } catch (error) {
    console.error('✗ Realtime connection failed:', error.message)
  }

  console.log('\n--- Test Summary ---')
  console.log('Project URL:', supabaseUrl)
  console.log('Ready for database setup: Run "npx prisma db push" to create tables')
}

testConnection().then(() => {
  console.log('\n✨ Testing complete!')
  process.exit(0)
}).catch((error) => {
  console.error('\n❌ Test failed:', error)
  process.exit(1)
})