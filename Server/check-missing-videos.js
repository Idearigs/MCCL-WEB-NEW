const fs = require('fs');
const path = require('path');

const stagingDir = path.join(__dirname, 'temp-video-staging-final');
const uploadList = JSON.parse(fs.readFileSync(path.join(__dirname, 'upload-list-final.json'), 'utf8'));

// Get actual files in staging directory
const actualFiles = fs.readdirSync(stagingDir).filter(f => f.endsWith('.mp4'));

console.log('═══════════════════════════════════════════');
console.log('STAGING DIRECTORY ANALYSIS');
console.log('═══════════════════════════════════════════\n');
console.log('Expected videos (from upload list): ' + uploadList.totalVideos);
console.log('Actual videos in staging dir: ' + actualFiles.length);
console.log('Missing: ' + (uploadList.totalVideos - actualFiles.length));
console.log('');

// Create safe filenames from upload list
const expectedFiles = new Map();
uploadList.videos.forEach(v => {
  const fileExt = path.extname(v.filename);
  const safeFileName = v.productSKU.replace(/[^a-zA-Z0-9-]/g, '_') + fileExt;
  expectedFiles.set(safeFileName, v);
});

const actualFilesSet = new Set(actualFiles);

// Find missing files
const missingFiles = [];
expectedFiles.forEach((video, fileName) => {
  if (!actualFilesSet.has(fileName)) {
    missingFiles.push({
      safeFileName: fileName,
      originalFileName: video.filename,
      productSKU: video.productSKU,
      productName: video.productName,
      localPath: video.localPath
    });
  }
});

console.log('═══════════════════════════════════════════');
console.log('MISSING VIDEO FILES FROM STAGING DIRECTORY');
console.log('═══════════════════════════════════════════\n');

if (missingFiles.length > 0) {
  missingFiles.forEach(v => {
    console.log(`❌ ${v.originalFileName}`);
    console.log(`   SKU: ${v.productSKU} - ${v.productName}`);
    console.log(`   Safe name: ${v.safeFileName}`);
    console.log(`   Original path: ${v.localPath}`);

    // Check if original file exists
    const exists = fs.existsSync(v.localPath);
    console.log(`   File exists: ${exists ? 'YES' : 'NO'}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  console.log(`Total missing: ${missingFiles.length} videos`);
  console.log('These videos were matched to products but not copied to staging directory.\n');

  // Check if originals exist
  const existingOriginals = missingFiles.filter(v => fs.existsSync(v.localPath));
  console.log(`Original files still exist: ${existingOriginals.length}`);
  console.log(`Original files missing: ${missingFiles.length - existingOriginals.length}\n`);

} else {
  console.log('No missing files! All matched videos are in staging directory.\n');
}
