/**
 * Copies scraped images from output folder → Server/uploads/watches/
 * Run from Server/ directory:
 *   node scripts/briston-scraper/copy-images.js <collection-handle>
 * Example:
 *   node scripts/briston-scraper/copy-images.js clubmaster-classic
 */
const fs = require('fs');
const path = require('path');

const handle = process.argv[2];
if (!handle) { console.error('Usage: node copy-images.js <collection-handle>'); process.exit(1); }

const srcRoot  = path.resolve(__dirname, 'output', handle, 'images');
const destRoot = path.resolve(__dirname, '..', '..', 'uploads', 'watches');

if (!fs.existsSync(srcRoot)) {
  console.error(`Source not found: ${srcRoot}`);
  process.exit(1);
}

fs.mkdirSync(destRoot, { recursive: true });

let copied = 0, skipped = 0;

const products = fs.readdirSync(srcRoot);
for (const productHandle of products) {
  const srcDir  = path.join(srcRoot, productHandle);
  const destDir = path.join(destRoot, productHandle);
  if (!fs.statSync(srcDir).isDirectory()) continue;
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const ext      = path.extname(file);
    const pos      = path.basename(file, ext);          // e.g. "1"
    const destName = `${productHandle}-${pos}${ext}`;   // e.g. "clubmaster-classic-13140-sa-t-1-nk-1.jpg"
    const destPath = path.join(destDir, destName);
    const srcPath  = path.join(srcDir, file);

    if (fs.existsSync(destPath)) { skipped++; continue; }
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }
}

console.log(`Done: ${copied} copied, ${skipped} already existed`);
console.log(`Destination: ${destRoot}`);
