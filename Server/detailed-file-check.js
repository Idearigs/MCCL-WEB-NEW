const fs = require('fs');
const path = require('path');

const matchReport = JSON.parse(fs.readFileSync(path.join(__dirname, 'video-match-report-improved.json'), 'utf8'));
const stagingDir = path.join(__dirname, 'temp-video-staging-final');

console.log('═══════════════════════════════════════════');
console.log('DETAILED FILE CHECK');
console.log('═══════════════════════════════════════════\n');

const results = {
  bothExist: [],
  originalMissing: [],
  stagedMissing: [],
  bothMissing: []
};

matchReport.matched.forEach(video => {
  const originalExists = fs.existsSync(video.localPath);

  // Create the safe filename that should be in staging
  const fileExt = path.extname(video.filename);
  const safeFileName = video.productSKU.replace(/[^a-zA-Z0-9-]/g, '_') + fileExt;
  const stagingPath = path.join(stagingDir, safeFileName);
  const stagedExists = fs.existsSync(stagingPath);

  const result = {
    original: video.filename,
    sku: video.productSKU,
    productName: video.productName,
    originalPath: video.localPath,
    stagingPath: stagingPath,
    safeFileName: safeFileName
  };

  if (originalExists && stagedExists) {
    results.bothExist.push(result);
  } else if (!originalExists && stagedExists) {
    results.originalMissing.push(result);
  } else if (originalExists && !stagedExists) {
    results.stagedMissing.push(result);
  } else {
    results.bothMissing.push(result);
  }
});

console.log('Summary:');
console.log(`  Both original and staged exist: ${results.bothExist.length}`);
console.log(`  Original missing, staged exists: ${results.originalMissing.length}`);
console.log(`  Original exists, staged missing: ${results.stagedMissing.length}`);
console.log(`  Both missing: ${results.bothMissing.length}\n`);

if (results.stagedMissing.length > 0) {
  console.log('═══════════════════════════════════════════');
  console.log('VIDEOS NOT COPIED TO STAGING');
  console.log('(Original exists but not in staging dir)');
  console.log('═══════════════════════════════════════════\n');

  results.stagedMissing.forEach(v => {
    console.log(`❌ ${v.original}`);
    console.log(`   SKU: ${v.sku} - ${v.productName}`);
    console.log(`   Original path: ${v.originalPath}`);
    console.log(`   Expected staging file: ${v.safeFileName}`);

    // Check if original exists and get its size
    try {
      const stats = fs.statSync(v.originalPath);
      console.log(`   Original file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (e) {
      console.log(`   Error reading file: ${e.message}`);
    }
    console.log('');
  });
}

console.log('\n═══════════════════════════════════════════');
console.log('EXPLANATION');
console.log('═══════════════════════════════════════════\n');
console.log(`Total videos matched: 99`);
console.log(`Videos actually copied to staging: ${results.bothExist.length}`);
console.log(`Videos uploaded to VPS: 81`);
console.log(`Missing from upload: ${99 - 81} videos\n`);
