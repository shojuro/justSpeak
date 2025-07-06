#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 JustSpeak Android Build Process\n');

const steps = [
  {
    name: 'Install Capacitor',
    command: 'npm install -D @capacitor/core @capacitor/cli @capacitor/android',
    check: () => fs.existsSync('node_modules/@capacitor/core')
  },
  {
    name: 'Build Next.js',
    command: 'npm run build',
    check: () => fs.existsSync('.next')
  },
  {
    name: 'Initialize Capacitor',
    command: 'npx cap init JustSpeak com.justspeak.app --web-dir=out',
    check: () => fs.existsSync('capacitor.config.json'),
    skipIfExists: true
  },
  {
    name: 'Export Static Build',
    command: 'npx next export',
    check: () => fs.existsSync('out')
  },
  {
    name: 'Add Android Platform',
    command: 'npx cap add android',
    check: () => fs.existsSync('android'),
    skipIfExists: true
  },
  {
    name: 'Copy Web Assets',
    command: 'npx cap copy android',
    check: () => true
  },
  {
    name: 'Update Android Project',
    command: 'npx cap update android',
    check: () => true
  },
  {
    name: 'Sync Android Project',
    command: 'npx cap sync android',
    check: () => true
  }
];

async function runStep(step, index) {
  console.log(`\n[${index + 1}/${steps.length}] ${step.name}...`);
  
  if (step.skipIfExists && step.check()) {
    console.log(`✓ Already completed, skipping...`);
    return;
  }
  
  try {
    execSync(step.command, { stdio: 'inherit' });
    
    if (!step.check()) {
      throw new Error(`Step failed: ${step.name}`);
    }
    
    console.log(`✅ ${step.name} completed!`);
  } catch (error) {
    console.error(`❌ Failed at step: ${step.name}`);
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  // Update next.config.js for static export
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (!nextConfig.includes('output:')) {
    console.log('📝 Updating next.config.js for static export...');
    nextConfig = nextConfig.replace(
      'const nextConfig = {',
      `const nextConfig = {
  output: 'export',`
    );
    fs.writeFileSync(nextConfigPath, nextConfig);
  }
  
  // Run all steps
  for (let i = 0; i < steps.length; i++) {
    await runStep(steps[i], i);
  }
  
  console.log('\n✨ Android build preparation complete!\n');
  console.log('📱 Next steps:');
  console.log('1. To open in Android Studio:');
  console.log('   npx cap open android\n');
  console.log('2. In Android Studio:');
  console.log('   - Wait for Gradle sync to complete');
  console.log('   - Build > Build Bundle(s) / APK(s) > Build APK(s)');
  console.log('   - Find APK in: android/app/build/outputs/apk/debug/\n');
  console.log('3. Or build from command line:');
  console.log('   cd android && ./gradlew assembleDebug');
  console.log('   APK will be at: android/app/build/outputs/apk/debug/app-debug.apk\n');
}

main().catch(console.error);