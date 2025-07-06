#!/bin/bash

echo "🚀 JustSpeak Quick APK Builder"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is required but not installed.${NC}"
    exit 1
fi

# Build the Next.js app
echo -e "${BLUE}📦 Building Next.js app...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Create APK directory
mkdir -p apk-output

# Create deployment info
cat > apk-output/DEPLOY_FOR_APK.md << EOF
# JustSpeak APK Deployment Guide

Your Next.js app is built and ready for APK conversion!

## Quick Option: PWABuilder (Recommended)

1. **Deploy to Vercel** (Free & Easy):
   \`\`\`bash
   npx vercel
   \`\`\`
   Follow prompts to deploy your app.

2. **Generate APK**:
   - Visit: https://www.pwabuilder.com/
   - Enter your Vercel URL
   - Click "Build My PWA"
   - Download the Android package

## Alternative: Test as PWA First

1. **Run locally**:
   \`\`\`bash
   npm start
   \`\`\`

2. **On your Android phone**:
   - Connect to same WiFi
   - Open Chrome
   - Visit: http://[your-computer-ip]:3000
   - Menu > "Add to Home Screen"

## Manual APK Build with Capacitor

1. **Install dependencies**:
   \`\`\`bash
   npm install -D @capacitor/core @capacitor/cli @capacitor/android
   \`\`\`

2. **Initialize Capacitor**:
   \`\`\`bash
   npx cap init JustSpeak com.justspeak.app --web-dir=.next
   \`\`\`

3. **Add Android platform**:
   \`\`\`bash
   npx cap add android
   \`\`\`

4. **Sync and open**:
   \`\`\`bash
   npx cap sync
   npx cap open android
   \`\`\`

5. **Build APK in Android Studio**:
   - Build > Build Bundle(s) / APK(s) > Build APK(s)

## Your App Details:
- Name: JustSpeak
- Package: com.justspeak.app
- Theme Color: #FF6B7A
- Background: #2C2C2E
EOF

echo ""
echo -e "${GREEN}✨ Build preparation complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Deploy your app online (easiest: npx vercel)"
echo "2. Use PWABuilder.com to generate APK"
echo "   OR"
echo "3. Follow manual Capacitor steps in apk-output/DEPLOY_FOR_APK.md"
echo ""
echo -e "${GREEN}📱 For quick testing:${NC}"
echo "Run 'npm start' and access from your Android phone browser"
echo "Then 'Add to Home Screen' for instant PWA installation!"