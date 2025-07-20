#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process
const patterns = [
  './app/**/*.ts',
  './app/**/*.tsx',
  './lib/**/*.ts',
  './lib/**/*.tsx'
];

// Skip patterns
const skipPatterns = [
  '**/node_modules/**',
  '**/test/**',
  '**/*.test.*',
  '**/logger.ts' // Don't modify the logger itself
];

// Replacements map
const replacements = {
  'console.log': 'logger.info',
  'console.debug': 'logger.debug',
  'console.info': 'logger.info',
  'console.warn': 'logger.warn',
  'console.error': 'logger.error'
};

let totalReplacements = 0;
let filesModified = 0;

// Process each pattern
patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: skipPatterns });
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let fileReplacements = 0;
    
    // Check if file already imports logger
    const hasLoggerImport = content.includes('import { logger }') || 
                           content.includes('import logger') ||
                           content.includes('{ logger }');
    
    // Replace console statements
    Object.entries(replacements).forEach(([from, to]) => {
      const regex = new RegExp(`${from.replace('.', '\\.')}\\(`, 'g');
      const matches = content.match(regex) || [];
      
      if (matches.length > 0) {
        content = content.replace(regex, `${to}(`);
        fileReplacements += matches.length;
        modified = true;
      }
    });
    
    if (modified) {
      // Add logger import if needed and not already present
      if (!hasLoggerImport && !file.includes('logger.ts')) {
        // Find the first import statement
        const importMatch = content.match(/^import .* from ['"].*['"];?\s*$/m);
        if (importMatch) {
          const insertPosition = importMatch.index + importMatch[0].length;
          content = content.slice(0, insertPosition) + 
                   '\nimport { logger } from \'@/lib/logger\'' + 
                   content.slice(insertPosition);
        } else {
          // No imports found, add at the beginning
          content = 'import { logger } from \'@/lib/logger\'\n\n' + content;
        }
      }
      
      // Write the modified content
      fs.writeFileSync(file, content);
      
      console.log(`Modified ${file}: ${fileReplacements} replacements`);
      totalReplacements += fileReplacements;
      filesModified++;
    }
  });
});

console.log(`\nSummary:`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`);

// Now let's handle special cases that need manual review
console.log('\n⚠️  Files that may need manual review:');
const reviewFiles = glob.sync('./app/api/**/*.ts', { ignore: skipPatterns });
reviewFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('console.') && !content.includes('logger')) {
    console.log(`  - ${file}`);
  }
});