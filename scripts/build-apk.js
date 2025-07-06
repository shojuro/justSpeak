const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building JustSpeak APK...\n');

// Configuration
const APP_NAME = 'JustSpeak';
const APP_ID = 'com.justspeak.app';
const APP_VERSION = '1.0.0';
const APP_ICON = path.join(__dirname, '../public/icon-512.png');

// Step 1: Build the Next.js app
console.log('📦 Building Next.js app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build complete!\n');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Step 2: Create TWA (Trusted Web Activity) configuration
console.log('📱 Creating Android TWA configuration...');

const twaManifest = {
  packageId: APP_ID,
  host: 'localhost',
  name: APP_NAME,
  launcherName: APP_NAME,
  display: 'standalone',
  themeColor: '#FF6B7A',
  navigationColor: '#2C2C2E',
  backgroundColor: '#2C2C2E',
  enableNotifications: true,
  startUrl: '/',
  iconUrl: 'https://localhost:3000/icon-512.png',
  maskableIconUrl: 'https://localhost:3000/icon-512.png',
  splashScreenFadeOutDuration: 300,
  signingKey: {
    alias: 'android',
    path: './android.keystore',
    password: 'android',
    keyPassword: 'android'
  },
  appVersionName: APP_VERSION,
  appVersionCode: 1,
  shortcuts: [
    {
      name: 'Start Conversation',
      shortName: 'Talk',
      url: '/?action=start',
      iconUrl: 'https://localhost:3000/icon-192.png'
    }
  ],
  generatorApp: 'bubblewrap-cli'
};

// Create build directory
const buildDir = path.join(__dirname, '../android-build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Save TWA manifest
fs.writeFileSync(
  path.join(buildDir, 'twa-manifest.json'),
  JSON.stringify(twaManifest, null, 2)
);

console.log('✅ TWA configuration created!\n');

// Step 3: Create build instructions
const buildInstructions = `
# JustSpeak APK Build Instructions

Since building an APK requires Android SDK and specific tools, here are your options:

## Option 1: Use Bubblewrap (Recommended)
1. Install Bubblewrap CLI:
   \`\`\`bash
   npm i -g @bubblewrap/cli
   \`\`\`

2. Initialize the Android project:
   \`\`\`bash
   cd android-build
   bubblewrap init --manifest=./twa-manifest.json
   \`\`\`

3. Build the APK:
   \`\`\`bash
   bubblewrap build
   \`\`\`

## Option 2: Use PWABuilder (Easier)
1. Deploy your app to a public URL (e.g., Vercel)
2. Go to https://www.pwabuilder.com/
3. Enter your app URL
4. Click "Build My PWA"
5. Select "Android" and download the APK

## Option 3: Use Capacitor
1. Install Capacitor:
   \`\`\`bash
   npm install @capacitor/core @capacitor/android
   npx cap init ${APP_NAME} ${APP_ID}
   \`\`\`

2. Build and add Android:
   \`\`\`bash
   npm run build
   npx cap add android
   npx cap sync
   \`\`\`

3. Open in Android Studio:
   \`\`\`bash
   npx cap open android
   \`\`\`

## Current Status:
- ✅ Next.js app built successfully
- ✅ PWA manifest configured
- ✅ Icons ready (192x192 and 512x512)
- ✅ Service worker configured
- ✅ TWA configuration created

## Quick Test (PWA on Mobile):
1. Run: \`npm run build && npm start\`
2. Open https://[your-ip]:3000 on your Android phone
3. Chrome menu > "Add to Home Screen"
4. The PWA will install and work like an app!
`;

fs.writeFileSync(
  path.join(buildDir, 'BUILD_INSTRUCTIONS.md'),
  buildInstructions
);

console.log('📄 Build instructions saved to: android-build/BUILD_INSTRUCTIONS.md');
console.log('\n✨ Preparation complete! Follow the instructions above to generate your APK.');