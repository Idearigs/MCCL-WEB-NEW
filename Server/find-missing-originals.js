const fs = require('fs');
const path = require('path');

const matchReport = JSON.parse(fs.readFileSync(path.join(__dirname, 'video-match-report-improved.json'), 'utf8'));

console.log('═══════════════════════════════════════════');
console.log('CHECKING WHICH ORIGINAL VIDEO FILES EXIST');
console.log('═══════════════════════════════════════════\n');

const existingFiles = [];
const missingFiles = [];

matchReport.matched.forEach(video => {
  const exists = fs.existsSync(video.localPath);

  if (exists) {
    existingFiles.push(video);
  } else {
    missingFiles.push(video);
  }
});

console.log(`Total matched videos: ${matchReport.matched.length}`);
console.log(`Original files exist: ${existingFiles.length}`);
console.log(`Original files MISSING: ${missingFiles.length}\n`);

if (missingFiles.length > 0) {
  console.log('═══════════════════════════════════════════');
  console.log('MISSING ORIGINAL VIDEO FILES');
  console.log('═══════════════════════════════════════════\n');

  missingFiles.forEach(video => {
    console.log(`❌ ${video.filename}`);
    console.log(`   SKU: ${video.productSKU} - ${video.productName}`);
    console.log(`   Expected path: ${video.localPath}`);
    console.log('');
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  console.log(`${missingFiles.length} matched videos don't have original files in the "Edited Videos" folder.`);
  console.log('These were matched to products but the video files are missing from disk.\n');
}

console.log('This explains why only ' + existingFiles.length + ' videos were uploaded instead of ' + matchReport.matched.length + '.\n');
