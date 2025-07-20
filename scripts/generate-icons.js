// Simple script to generate placeholder PWA icons
// In production, replace these with proper designed icons

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2C2C2E"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#FF6B7A"/>
  <text x="${size/2}" y="${size/2}" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold">JT</text>
</svg>`;
};

// Generate icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

// Create a special apple-touch-icon
const appleTouchIcon = createSVGIcon(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIcon);
console.log('✓ Generated apple-touch-icon.svg');

// Note for icon-192.png and icon-512.png (required by manifest)
console.log('\n⚠️  Note: The manifest.json references icon-192.png and icon-512.png');
console.log('For production, convert the SVG files to PNG format or use a proper icon generator.');
console.log('You can use tools like:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.pwabuilder.com/imageGenerator');
console.log('- ImageMagick: convert icon-192.svg icon-192.png');