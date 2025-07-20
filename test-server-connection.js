const http = require('http');

// Test connection to localhost:3000
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/config/status',
  method: 'GET',
  timeout: 5000
};

console.log('Testing connection to http://localhost:3000/api/config/status...');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Connection failed:', error.message);
  console.log('\nPossible issues:');
  console.log('1. Next.js dev server is not running. Start it with: npm run dev');
  console.log('2. Server is running on a different port');
  console.log('3. Firewall or security software blocking the connection');
});

req.on('timeout', () => {
  console.error('Connection timed out');
  req.destroy();
});

req.end();