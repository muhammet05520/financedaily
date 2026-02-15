/**
 * Generate all favicon/icon/OG-image assets from SVG
 * Run: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const PUBLIC = path.join(__dirname, '..', 'public');

// Finance chart icon - blue bg with white chart line
function drawIcon(ctx, size) {
  const s = size;

  // Background with rounded corners
  const radius = s * 0.2;
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(s - radius, 0);
  ctx.quadraticCurveTo(s, 0, s, radius);
  ctx.lineTo(s, s - radius);
  ctx.quadraticCurveTo(s, s, s - radius, s);
  ctx.lineTo(radius, s);
  ctx.quadraticCurveTo(0, s, 0, s - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Chart line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = s * 0.06;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.25, s * 0.65);
  ctx.lineTo(s * 0.40, s * 0.45);
  ctx.lineTo(s * 0.55, s * 0.55);
  ctx.lineTo(s * 0.75, s * 0.30);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(s * 0.65, s * 0.30);
  ctx.lineTo(s * 0.75, s * 0.30);
  ctx.lineTo(s * 0.75, s * 0.40);
  ctx.stroke();
}

function drawOGImage(ctx, w, h) {
  // Dark gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative chart lines in background
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, h * 0.3 + i * 40);
    for (let x = 0; x < w; x += 50) {
      ctx.lineTo(x, h * 0.3 + i * 40 + Math.sin(x * 0.01 + i) * 30);
    }
    ctx.stroke();
  }

  // Blue accent bar at top
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, w, 6);

  // Icon
  const iconSize = 80;
  const iconX = 80;
  const iconY = h / 2 - 80;
  ctx.save();
  ctx.translate(iconX, iconY);
  drawIcon(ctx, iconSize);
  ctx.restore();

  // Title text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.fillText('FinanceDaily', iconX + iconSize + 30, iconY + 55);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '28px Arial, sans-serif';
  ctx.fillText('Financial News • Market Analysis • Investment Insights', iconX, iconY + iconSize + 50);

  // Domain
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('financedailyus.com', iconX, h - 60);

  // Bottom gradient line
  const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
  lineGrad.addColorStop(0, '#2563eb');
  lineGrad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, h - 4, w, 4);
}

// Generate icons at different sizes
const sizes = [
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

for (const { name, size } of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(PUBLIC, name), buffer);
  console.log(`✓ Created ${name} (${size}x${size})`);
}

// Generate OG image (1200x630)
const ogCanvas = createCanvas(1200, 630);
const ogCtx = ogCanvas.getContext('2d');
drawOGImage(ogCtx, 1200, 630);
fs.writeFileSync(path.join(PUBLIC, 'og-image.png'), ogCanvas.toBuffer('image/png'));
console.log('✓ Created og-image.png (1200x630)');

// Generate logo (same as 512 icon for now)
const logoCanvas = createCanvas(512, 512);
const logoCtx = logoCanvas.getContext('2d');
drawIcon(logoCtx, 512);
fs.writeFileSync(path.join(PUBLIC, 'logo.png'), logoCanvas.toBuffer('image/png'));
console.log('✓ Created logo.png (512x512)');

// Generate ICO file (simple approach - 32x32 PNG as ICO)
// ICO format: header + directory + image data
function createIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // Reserved
  header.writeUInt16LE(1, 2);     // ICO type
  header.writeUInt16LE(1, 4);     // Number of images

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size, 0);      // Width
  dirEntry.writeUInt8(size, 1);      // Height
  dirEntry.writeUInt8(0, 2);         // Color palette
  dirEntry.writeUInt8(0, 3);         // Reserved
  dirEntry.writeUInt16LE(1, 4);      // Color planes
  dirEntry.writeUInt16LE(32, 6);     // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8);  // Image size
  dirEntry.writeUInt32LE(22, 12);    // Offset to image data

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

const favicon32 = fs.readFileSync(path.join(PUBLIC, 'favicon-32.png'));
const icoBuffer = createIco(favicon32, 32);
fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), icoBuffer);
console.log('✓ Created favicon.ico');

console.log('\n✅ All icons generated successfully!');
