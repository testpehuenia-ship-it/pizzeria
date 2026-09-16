const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createOgAssets() {
  const publicDir = path.join(__dirname, '..', 'public');
  const imagesDir = path.join(publicDir, 'images');
  const pizzaPath = path.join(imagesDir, 'pizzas', 'pizza_base_madera.png');
  const brunoPath = path.join(imagesDir, 'brunodescarga.webp');

  console.log('Generating OG and Icon assets...');

  // 1. Prepare pizza image resized with high quality
  const pizzaBuffer = await sharp(pizzaPath)
    .resize(500, 500, { fit: 'inside' })
    .toBuffer();

  // 2. SVG overlay for 1200x630 (Banner Open Graph)
  const svgOverlay = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0e17"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#062117"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Decorative radial glow circles -->
      <circle cx="920" cy="315" r="280" fill="#10b981" opacity="0.16"/>
      <circle cx="120" cy="80" r="160" fill="#10b981" opacity="0.08"/>

      <!-- Outer Frame Accent -->
      <rect x="16" y="16" width="1168" height="598" rx="28" fill="none" stroke="#10b981" stroke-width="2.5" stroke-opacity="0.35"/>

      <!-- Badge -->
      <rect x="70" y="90" width="220" height="46" rx="23" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-width="1.5" stroke-opacity="0.6"/>
      <text x="96" y="120" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#34d399">🍀 0600 BOSTON</text>

      <!-- Main Brand Title -->
      <text x="70" y="215" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="68" font-weight="900" fill="#ffffff" letter-spacing="-1.5">
        0600<tspan fill="#34d399">Boston</tspan>
      </text>

      <!-- Subtitle -->
      <text x="70" y="278" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="800" fill="#f1f5f9">
        Gran Variedad de Pizzas Artesanales
      </text>

      <!-- Bullet features -->
      <g transform="translate(70, 335)">
        <!-- Bullet 1 -->
        <circle cx="10" cy="-6" r="5" fill="#34d399"/>
        <text x="28" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="#cbd5e1">
          Masa madre y los mejores ingredientes frescos
        </text>

        <!-- Bullet 2 -->
        <circle cx="10" cy="40" r="5" fill="#34d399"/>
        <text x="28" y="46" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="#cbd5e1">
          Armá tu pizza con topping interactivo en tiempo real
        </text>

        <!-- Bullet 3 -->
        <circle cx="10" cy="86" r="5" fill="#34d399"/>
        <text x="28" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="#cbd5e1">
          Pedí al instante con tu descuento por WhatsApp
        </text>
      </g>

      <!-- URL Badge / CTA -->
      <rect x="70" y="490" width="370" height="56" rx="18" fill="#10b981" fill-opacity="0.2" stroke="#34d399" stroke-width="2"/>
      <text x="100" y="526" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#ffffff">
        🌐 www.0600boston.com.ar
      </text>
    </svg>
  `);

  // Composite 1200x630 -> saved as JPG (< 150 KB)
  const ogImagePath = path.join(imagesDir, 'og-image.jpg');
  await sharp(svgOverlay)
    .composite([
      {
        input: pizzaBuffer,
        top: 65,
        left: 650,
      }
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(ogImagePath);

  const ogStat = fs.statSync(ogImagePath);
  console.log('✅ og-image.jpg created at:', ogImagePath, 'Size:', ogStat.size, 'bytes');

  // 3. Square version (800x800) for WhatsApp compact thumbnail preview & Facebook/Telegram
  const pizzaSquareBuffer = await sharp(pizzaPath)
    .resize(580, 580, { fit: 'inside' })
    .toBuffer();

  const squareSvg = Buffer.from(`
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sqbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0e17"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#062117"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#sqbg)"/>
      <circle cx="400" cy="450" r="280" fill="#10b981" opacity="0.18"/>
      <rect x="16" y="16" width="768" height="768" rx="32" fill="none" stroke="#10b981" stroke-width="2" stroke-opacity="0.4"/>

      <!-- Brand Header -->
      <text x="400" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-1">
        0600<tspan fill="#34d399">Boston</tspan>
      </text>
      <text x="400" y="125" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#a7f3d0" text-anchor="middle">
        Gran Variedad de Pizzas Artesanales
      </text>
    </svg>
  `);

  const ogSquarePath = path.join(imagesDir, 'og-square.jpg');
  await sharp(squareSvg)
    .composite([
      {
        input: pizzaSquareBuffer,
        top: 155,
        left: 110,
      }
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(ogSquarePath);

  const sqStat = fs.statSync(ogSquarePath);
  console.log('✅ og-square.jpg created at:', ogSquarePath, 'Size:', sqStat.size, 'bytes');

  // 4. Also copy / optimize into src/app/opengraph-image.jpg and src/app/twitter-image.jpg
  // Next.js App Router natively auto-detects these files!
  const appDir = path.join(__dirname, '..', 'src', 'app');
  fs.copyFileSync(ogImagePath, path.join(appDir, 'opengraph-image.jpg'));
  fs.copyFileSync(ogImagePath, path.join(appDir, 'twitter-image.jpg'));
  console.log('✅ Copied opengraph-image.jpg and twitter-image.jpg to src/app/');

  // 5. Generate Favicons: favicon.ico, icon.png (512x512, 192x192), and apple-touch-icon.png
  // Using Bruno / Pizza mascot for standard icons
  const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(brunoPath)
    .resize(180, 180)
    .png({ quality: 90 })
    .toFile(appleIconPath);
  console.log('✅ apple-touch-icon.png created (180x180)');

  const iconPngPath = path.join(publicDir, 'icon.png');
  await sharp(brunoPath)
    .resize(512, 512)
    .png({ quality: 90 })
    .toFile(iconPngPath);
  console.log('✅ icon.png created (512x512)');

  // Also in src/app/icon.png and src/app/apple-icon.png for Next.js App Router standard detection
  fs.copyFileSync(appleIconPath, path.join(appDir, 'apple-icon.png'));
  fs.copyFileSync(iconPngPath, path.join(appDir, 'icon.png'));

  // Favicon 32x32 PNG renamed/converted to favicon.ico in public/ and src/app/
  const faviconIcoPath = path.join(publicDir, 'favicon.ico');
  await sharp(brunoPath)
    .resize(48, 48)
    .png()
    .toFile(faviconIcoPath);
  fs.copyFileSync(faviconIcoPath, path.join(appDir, 'favicon.ico'));
  console.log('✅ favicon.ico created');

  console.log('All image assets created successfully!');
}

createOgAssets().catch(err => {
  console.error('Error creating assets:', err);
  process.exit(1);
});
