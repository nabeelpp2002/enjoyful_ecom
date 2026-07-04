const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Re-design a high-end luxury favicon based on 'enjoyful life'
// Brand Colors:
// Purple: #735697
// Mustard/Gold: #F4B449
// Onyx: #1A1A1B
// Sand: #F9F5F0

// Luxury aesthetic: Deep rich onyx background with a highly polished gold/mustard gradient symbol.
// We'll use a stylized "e" monogram inside a thin gold ring.
const svgMonogram = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background: Deep Onyx / Charcoal -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a2a2b" />
      <stop offset="100%" stop-color="#1A1A1B" />
    </linearGradient>
    
    <!-- Accent: Premium Gold / Mustard Gradient -->
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE196" />
      <stop offset="50%" stop-color="#F4B449" />
      <stop offset="100%" stop-color="#D18F23" />
    </linearGradient>
    
    <!-- Primary Brand: Rich Purple Accent Gradient -->
     <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8a6cba" />
      <stop offset="100%" stop-color="#735697" />
    </linearGradient>
  </defs>

  <!-- Base background (subtle dark theme adds premium feel) -->
  <rect width="512" height="512" rx="120" ry="120" fill="url(#bgGradient)" />

  <!-- Outer thin elegant gold ring -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="url(#goldGradient)" stroke-width="12" />

  <!-- Inner solid purple core (gives depth) -->
  <circle cx="256" cy="256" r="185" fill="url(#purpleGradient)" opacity="0.15" />

  <!-- Elegant lowercase 'e' using a serif-like polished structure if possible, but we'll use a very clean, thin sans-serif -->
  <text x="49%" y="54%" font-family="Georgia, 'Times New Roman', serif" font-size="320" font-weight="normal" fill="url(#goldGradient)" text-anchor="middle" dominant-baseline="middle" font-style="italic">e</text>
  
  <!-- Tiny subtle sparkle/star at top right of the 'e' -->
  <path d="M 360 170 Q 360 150 380 150 Q 360 150 360 130 Q 360 150 340 150 Q 360 150 360 170" fill="url(#goldGradient)" />
</svg>
`;

const buffer = Buffer.from(svgMonogram);

async function generateFavicons() {
  try {
    console.log('Generating premium favicon-16x16.png...');
    await sharp(buffer).resize(16, 16).png().toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));

    console.log('Generating premium favicon-32x32.png...');
    await sharp(buffer).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));

    console.log('Generating premium apple-touch-icon.png (180x180)...');
    await sharp(buffer).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

    console.log('Generating premium android-chrome-192x192.png...');
    await sharp(buffer).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));

    console.log('Generating premium android-chrome-512x512.png...');
    await sharp(buffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));

    console.log('Generating premium favicon.ico...');
    fs.copyFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), path.join(PUBLIC_DIR, 'favicon.ico'));

    console.log('All luxury assets generated successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateFavicons();
