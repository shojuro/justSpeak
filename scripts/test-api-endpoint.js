#!/usr/bin/env node

/**
 * Script to test the chat API endpoint
 * Usage: node scripts/test-api-endpoint.js [production|local]
 */

const mode = process.argv[2] || 'production';

const endpoints = {
  production: 'https://just-speak-2155muecy-shojuros-projects.vercel.app',
  local: 'http://localhost:3000'
};

const endpoint = endpoints[mode];

if (!endpoint) {
  console.error('Invalid mode. Use "production" or "local"');
  process.exit(1);
}

console.log(`Testing ${mode} endpoint: ${endpoint}`);

async function testHealthEndpoint() {
  console.log('\n1. Testing health endpoint...');
  try {
    const response = await fetch(`${endpoint}/api/health`);
    console.log(`   Status: ${response.status}`);
    const data = await response.text();
    console.log(`   Response: ${data}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
}

async function testChatEndpoint() {
  console.log('\n2. Testing chat endpoint...');
  
  const testMessage = {
    message: "Hello, how are you?",
    context: [],
    ageGroup: "adult",
    mode: "conversation"
  };

  try {
    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.log(`   Error Message: ${data.error}`);
      }
      if (data.reply) {
        console.log(`   AI Reply: ${data.reply.substring(0, 100)}...`);
      }
    } catch (e) {
      // If not JSON, show raw response (might be HTML error page)
      console.log(`   Raw Response: ${responseText.substring(0, 200)}...`);
    }
  } catch (error) {
    console.error(`   Network Error: ${error.message}`);
  }
}

async function testConfigStatus() {
  console.log('\n3. Testing config status endpoint...');
  try {
    const response = await fetch(`${endpoint}/api/config/status`);
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Config:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('Starting API tests...');
  console.log('='.repeat(50));
  
  await testHealthEndpoint();
  await testConfigStatus();
  await testChatEndpoint();
  
  console.log('\n' + '='.repeat(50));
  console.log('Tests completed.');
}

runTests();