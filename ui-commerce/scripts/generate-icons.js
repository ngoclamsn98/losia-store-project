/**
 * Script to generate PWA icons and OG images
 * Run: node scripts/generate-icons.js
 * 
 * Requirements: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const iconsDir = path.join(__dirname, '../public/icons');
const assetsDir = path.join(__dirname, '../public/assets');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Favicon sizes
const faviconSizes = [16, 32, 180]; // 180 for apple-touch-icon

// Create a simple Circ logo SVG
const createLogoSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">L</text>
</svg>
`;

// Create OG image SVG
const createOGImageSVG = (title, subtitle) => `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-grad)"/>
  
  <!-- Pattern overlay -->
  <g opacity="0.1">
    <circle cx="100" cy="100" r="50" fill="white"/>
    <circle cx="1100" cy="530" r="80" fill="white"/>
    <circle cx="300" cy="500" r="40" fill="white"/>
    <circle cx="900" cy="150" r="60" fill="white"/>
  </g>
  
  <!-- Content -->
  <text x="600" y="250" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">
    ${title}
  </text>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" opacity="0.9">
    ${subtitle}
  </text>
  
  <!-- Logo -->
  <circle cx="600" cy="480" r="60" fill="white" opacity="0.2"/>
  <text x="600" y="490" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">
    Circ
  </text>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  for (const size of iconSizes) {
    const svg = createLogoSVG(size);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`✅ Created: icon-${size}x${size}.png`);
  }
}

async function generateFavicons() {
  console.log('\n🎨 Generating favicons...');

  for (const size of faviconSizes) {
    const svg = createLogoSVG(size);
    let outputPath;

    if (size === 180) {
      outputPath = path.join(__dirname, '../public/apple-touch-icon.png');
    } else {
      outputPath = path.join(__dirname, `../public/favicon-${size}x${size}.png`);
    }

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`✅ Created: ${path.basename(outputPath)}`);
  }

  // Generate favicon.ico from 32x32
  const svg32 = createLogoSVG(32);
  const faviconPath = path.join(__dirname, '../public/favicon.ico');

  await sharp(Buffer.from(svg32))
    .png()
    .toFile(faviconPath);

  console.log(`✅ Created: favicon.ico`);
}

async function generateOGImages() {
  console.log('\n🎨 Generating OG images...');

  const ogImages = [
    {
      filename: 'og-image.jpg',
      title: 'Circ',
      subtitle: 'Thời Trang Secondhand Cao Cấp',
    },
    {
      filename: 'og-products.jpg',
      title: 'Sản Phẩm',
      subtitle: 'Khám phá 1000+ sản phẩm like-new',
    },
    {
      filename: 'og-about.jpg',
      title: 'Về Chúng Tôi',
      subtitle: 'Câu chuyện Circ',
    },
  ];

  for (const { filename, title, subtitle } of ogImages) {
    const svg = createOGImageSVG(title, subtitle);
    const outputPath = path.join(assetsDir, filename);

    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    console.log(`✅ Created: ${filename}`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting icon and image generation...\n');

    await generateIcons();
    await generateFavicons();
    await generateOGImages();

    console.log('\n✨ All icons and images generated successfully!');
    console.log('\n📁 Generated files:');
    console.log('   - public/icons/icon-*.png (PWA icons)');
    console.log('   - public/favicon-*.png (Favicons)');
    console.log('   - public/apple-touch-icon.png');
    console.log('   - public/favicon.ico');
    console.log('   - public/assets/og-*.jpg (OG images)');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();

