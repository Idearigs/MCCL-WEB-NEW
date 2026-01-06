const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

async function analyzeUploads() {
  try {
    console.log('Fetching container video list...\n');

    const { stdout } = await execPromise('ssh root@31.97.116.89 "docker exec xsgkgg808g0g4oso8cwgkkkk-155857619722 ls /app/uploads/products/videos/"');

    const containerVideos = new Set(
      stdout.trim()
        .split('\n')
        .map(v => v.trim())
        .filter(v => v && v.endsWith('.mp4'))
    );

    const stagedData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'staged-videos-final.json'), 'utf8')
    );

    const missing = stagedData.filter(v => !containerVideos.has(v.safeFileName));

    console.log('═══════════════════════════════════════════');
    console.log('UPLOAD ANALYSIS');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Expected videos: ${stagedData.length}`);
    console.log(`In container: ${containerVideos.size}`);
    console.log(`Missing: ${missing.length}\n`);

    if (missing.length > 0) {
      console.log('MISSING FROM CONTAINER:');
      console.log('═'.repeat(50));
      missing.forEach(v => {
        console.log(`❌ ${v.safeFileName}`);
        console.log(`   SKU: ${v.productSKU} - ${v.productName}`);
        console.log(`   Size: ${v.fileSizeMB.toFixed(2)} MB\n`);
      });

      fs.writeFileSync(
        path.join(__dirname, 'missing-from-upload.json'),
        JSON.stringify(missing, null, 2)
      );

      console.log('✓ Saved to: missing-from-upload.json\n');

      // Calculate total size
      const totalSize = missing.reduce((sum, v) => sum + v.fileSizeMB, 0);
      console.log(`Total size to upload: ${totalSize.toFixed(2)} MB\n`);
    } else {
      console.log('✅ All videos present in container!\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

analyzeUploads();
