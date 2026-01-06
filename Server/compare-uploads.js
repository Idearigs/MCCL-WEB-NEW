const fs = require('fs');
const path = require('path');

// Load old match report
const oldReportPath = path.join(__dirname, 'video-match-report.json');
const newReportPath = path.join(__dirname, 'video-match-report-improved.json');

if (!fs.existsSync(oldReportPath)) {
  console.log('Old report not found - cannot compare');
  process.exit(0);
}

const oldReport = JSON.parse(fs.readFileSync(oldReportPath, 'utf8'));
const newReport = JSON.parse(fs.readFileSync(newReportPath, 'utf8'));

console.log('═══════════════════════════════════════════');
console.log('COMPARISON: OLD vs NEW MATCHES');
console.log('═══════════════════════════════════════════\n');

console.log('Old matching (previous upload):');
console.log(`  Matched: ${oldReport.matched.length} videos\n`);

console.log('New matching (improved logic):');
console.log(`  Matched: ${newReport.matched.length} videos\n`);

// Get SKUs from both reports
const oldSKUs = new Set(oldReport.matched.map(v => v.sku || v.productSKU));
const newSKUs = new Set(newReport.matched.map(v => v.productSKU));

// Find videos that are in both (already uploaded)
const alreadyUploaded = [];
const newVideos = [];

newReport.matched.forEach(video => {
  if (oldSKUs.has(video.productSKU)) {
    alreadyUploaded.push(video);
  } else {
    newVideos.push(video);
  }
});

console.log('Analysis:');
console.log(`  Already uploaded: ${alreadyUploaded.length} videos`);
console.log(`  NEW videos to upload: ${newVideos.length} videos\n`);

console.log('═══════════════════════════════════════════');
console.log('NEW VIDEOS (not in previous upload)');
console.log('═══════════════════════════════════════════\n');

newVideos.forEach(v => {
  console.log(`  + ${v.productSKU} - ${v.productName} (${v.filename})`);
});

console.log('\n═══════════════════════════════════════════');
console.log('RECOMMENDATION');
console.log('═══════════════════════════════════════════\n');

console.log('DO NOT delete existing videos!');
console.log(`ONLY upload the ${newVideos.length} new videos\n`);

console.log('Benefits:');
console.log('  - Saves upload time');
console.log('  - Avoids re-uploading 1.9GB of data');
console.log(`  - Only need to upload ~${Math.round(newVideos.length * 30)}MB\n`);

// Create new upload list with only new videos
const newUploadList = {
  timestamp: new Date().toISOString(),
  totalVideos: newVideos.length,
  note: 'Only new videos not in previous upload',
  videos: newVideos.map(v => ({
    filename: v.filename,
    productId: v.productId,
    productSKU: v.productSKU,
    productName: v.productName,
    localPath: v.localPath
  }))
};

fs.writeFileSync(
  path.join(__dirname, 'new-videos-only.json'),
  JSON.stringify(newUploadList, null, 2)
);

console.log('✓ New videos list saved to: new-videos-only.json\n');
