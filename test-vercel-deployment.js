const { chromium } = require('playwright');

async function testVercelDeployment() {
  console.log('Starting Vercel deployment test...');
  
  // Launch Chromium (not Chrome)
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Navigating to Vercel deployment...');
    const response = await page.goto('https://just-speak-q1n7mhv5u-shojuros-projects.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`Response status: ${response.status()}`);
    console.log(`Response URL: ${response.url()}`);
    
    if (response.status() === 401) {
      console.log('\n❌ ERROR: 401 Unauthorized');
      console.log('The Vercel deployment requires authentication or has restricted access.');
      console.log('Possible reasons:');
      console.log('- The deployment is password protected');
      console.log('- The deployment URL has expired');
      console.log('- The project has authentication enabled');
      
      // Check if there's any auth-related content
      const content = await page.content();
      if (content.includes('password') || content.includes('auth')) {
        console.log('\nAuth-related content detected on the page.');
      }
    } else if (response.ok()) {
      console.log('\n✅ Page loaded successfully!');
      
      // Take a screenshot
      await page.screenshot({ 
        path: 'vercel-deployment-screenshot.png',
        fullPage: true 
      });
      console.log('Screenshot saved as vercel-deployment-screenshot.png');
      
      // Get page title
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      // Check for main elements
      const hasConversationScreen = await page.locator('[data-testid="conversation-screen"]').count() > 0;
      const hasStartButton = await page.locator('button:has-text("Start Conversation")').count() > 0;
      
      console.log(`\nPage Analysis:`);
      console.log(`- Has conversation screen: ${hasConversationScreen}`);
      console.log(`- Has start button: ${hasStartButton}`);
      
      // Check for any console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`Console error: ${msg.text()}`);
        }
      });
      
      // Wait a bit to catch any delayed errors
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\nTest completed.');
  }
}

// Run the test
testVercelDeployment().catch(console.error);