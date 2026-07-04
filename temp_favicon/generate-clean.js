const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Brand Colors:
// Purple: #735697
// Sand: #F9F5F0
// White: #FFFFFF

// The user wants it to look like Amazon or Flipkart (highly recognizable, very large icon, white & purple combo).
// We'll use a pure white background with a massive, bold, thick Purple 'e' that fills almost the entire box.
// No extra rings or sparkles to maximize the size of the 'e'.

const svgMonogram = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Solid primary purple -->
    <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8a6cba" />
      <stop offset="100%" stop-color="#735697" />
    </linearGradient>
  </defs>

  <!-- Base background (Clean White) -->
  <rect width="512" height="512" rx="100" ry="100" fill="#FFFFFF" />

  <!-- Massive, bold lowercase 'e' filling the space -->
  <text x="50%" y="54%" font-family="Arial, Helvetica, sans-serif" font-size="460" font-weight="900" fill="url(#purpleGradient)" text-anchor="middle" dominant-baseline="middle">e</text>
  
</svg>
`;

const buffer = Buffer.from(svgMonogram);

async function generateFavicons() {
  try {
    console.log('Generating massive purple/white favicon-16x16.png...');
    await sharp(buffer).resize(16, 16).png().toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));

    console.log('Generating massive purple/white favicon-32x32.png...');
    await sharp(buffer).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));

    console.log('Generating massive purple/white apple-touch-icon.png (180x180)...');
    await sharp(buffer).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

    console.log('Generating massive purple/white android-chrome-192x192.png...');
    await sharp(buffer).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));

    console.log('Generating massive purple/white android-chrome-512x512.png...');
    await sharp(buffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));

    console.log('Generating massive purple/white favicon.ico...');
    fs.copyFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), path.join(PUBLIC_DIR, 'favicon.ico'));

    console.log('All massive clean assets generated successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateFavicons();
