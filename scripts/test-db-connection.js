const { Client } = require('pg')
require('dotenv').config({ path: '.env' })

const connectionString = process.env.DATABASE_URL

console.log('Testing PostgreSQL connection...')
console.log('Connection string:', connectionString ? 'Found' : 'Missing')

if (!connectionString) {
  console.error('DATABASE_URL not found!')
  process.exit(1)
}

// Parse the connection string
const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
if (match) {
  const [, user, password, host, port, database] = match
  console.log('Host:', host)
  console.log('Port:', port)
  console.log('Database:', database)
  console.log('User:', user)
  console.log('Password:', password.substring(0, 3) + '***')
}

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

async function testConnection() {
  try {
    console.log('\nConnecting to database...')
    await client.connect()
    console.log('✓ Connected successfully!')
    
    // Test query
    const result = await client.query('SELECT NOW()')
    console.log('✓ Query successful:', result.rows[0])
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `)
    
    console.log('\nExisting tables:')
    if (tablesResult.rows.length === 0) {
      console.log('  No tables found - database is empty')
    } else {
      tablesResult.rows.forEach(row => {
        console.log('  -', row.table_name)
      })
    }
    
  } catch (error) {
    console.error('✗ Connection failed!')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    if (error.code === 'ENOTFOUND') {
      console.log('\nPossible issues:')
      console.log('- DNS resolution failed')
      console.log('- Check if the Supabase project URL is correct')
    } else if (error.code === '28P01') {
      console.log('\nAuthentication failed - password may be incorrect')
      console.log('Reset the database password in Supabase dashboard')
    }
  } finally {
    await client.end()
  }
}

testConnection()