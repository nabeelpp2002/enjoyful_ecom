const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Colors matching the brand and reference exactly
const bgSoftPink = '#f7f1f6';
const brandPurple = '#6B429A';
const brandOrange = '#F3A322';

// 512x512 SVG Master
const svgBuffer = Buffer.from(`
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Highly rounded squircle background -->
  <rect x="0" y="0" width="512" height="512" rx="140" fill="${bgSoftPink}" />
  
  <!-- Purple Ring -->
  <!-- Center is 256,256. Radius 130 + stroke 80 = outer 210, inner 50 -->
  <circle cx="256" cy="240" r="140" stroke="${brandPurple}" stroke-width="84" fill="none" />
  
  <!-- Orange Dot (Shifted to bottom-right as per updated reference) -->
  <circle cx="360" cy="345" r="50" fill="${brandOrange}" />
</svg>
`);

// Same SVG but scaled down specifically for tiny sizes (16, 32)
// For tiny sizes, a transparent background and much thicker simpler shapes work better
const tinySvgBuffer = Buffer.from(`
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Subtle background for legibility -->
  <rect x="0" y="0" width="64" height="64" rx="16" fill="${bgSoftPink}" />
  <!-- Thicker ring for pixel perfection -->
  <circle cx="32" cy="28" r="18" stroke="${brandPurple}" stroke-width="12" fill="none" />
  <!-- Massive dot to ensure visibility at bottom-right -->
  <circle cx="45" cy="41" r="9" fill="${brandOrange}" />
</svg>
`);

async function generateFavicons() {
    try {
        console.log('Generating reference favicons...');

        // 1. Generate 512x512 Android Chrome
        await sharp(svgBuffer)
            .resize(512, 512)
            .png()
            .toFile(path.join(publicDir, 'android-chrome-512x512.png'));
        console.log('Created android-chrome-512x512.png');

        // 2. Generate 192x192 Android Chrome
        await sharp(svgBuffer)
            .resize(192, 192)
            .png()
            .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
        console.log('Created android-chrome-192x192.png');

        // 3. Generate 180x180 Apple Touch Icon
        await sharp(svgBuffer)
            .resize(180, 180)
            .png()
            .toFile(path.join(publicDir, 'apple-touch-icon.png'));
        console.log('Created apple-touch-icon.png');

        // 4. Generate 32x32 Favicon (using tiny optimized SVG)
        await sharp(tinySvgBuffer)
            .resize(32, 32)
            .png()
            .toFile(path.join(publicDir, 'favicon-32x32.png'));
        console.log('Created favicon-32x32.png');

        // 5. Generate 16x16 Favicon (using tiny optimized SVG)
        await sharp(tinySvgBuffer)
            .resize(16, 16)
            .png()
            .toFile(path.join(publicDir, 'favicon-16x16.png'));
        console.log('Created favicon-16x16.png');

        // 6. Generate favicon.ico (optional standard fallback, simply copying 32x32)
        // Since ICO generation is tricky with pure sharp without ico plugin,
        // Next.js handles pngs perfectly fine if specified. We'll simply let the PNGs do the work,
        // but just in case, we can write the 32x32 png data to an ico extension format via sharp .png()
        await sharp(tinySvgBuffer)
            .resize(32, 32)
            .toFormat('png')
            .toFile(path.join(publicDir, 'favicon.ico'));
        console.log('Created favicon.ico (as PNG stream)');

        console.log('✅ Custom Reference Favicon generation complete!');
    } catch (error) {
        console.error('Error generating custom reference favicons:', error);
    }
}

generateFavicons();
