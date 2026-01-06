const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

const VPS_HOST = '31.97.116.89';
const VPS_USER = 'root';
const CONTAINER_NAME = 'xsgkgg808g0g4oso8cwgkkkk-155857619722';

async function findMissingVideos() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('FINDING MISSING VIDEOS IN CONTAINER');
    console.log('═══════════════════════════════════════════\n');

    // Get list of videos in container
    console.log('Fetching video list from container...');
    const { stdout } = await execPromise(`ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} ls /app/uploads/products/videos/"`);

    const containerVideos = new Set(stdout.trim().split('\n').map(v => v.trim()).filter(v => v));
    console.log(`Videos in container: ${containerVideos.size}\n`);

    // Load staged videos
    const stagedVideos = JSON.parse(fs.readFileSync(path.join(__dirname, 'staged-videos-final.json'), 'utf8'));
    console.log(`Videos in database: ${stagedVideos.length}\n`);

    // Find missing videos
    const missingVideos = [];
    stagedVideos.forEach(video => {
      if (!containerVideos.has(video.safeFileName)) {
        missingVideos.push(video);
      }
    });

    console.log('═══════════════════════════════════════════');
    console.log('MISSING VIDEOS');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Total missing: ${missingVideos.length}\n`);

    if (missingVideos.length > 0) {
      missingVideos.forEach(v => {
        console.log(`❌ ${v.safeFileName}`);
        console.log(`   SKU: ${v.productSKU} - ${v.productName}`);
      });
      console.log('');

      // Save list for upload
      fs.writeFileSync(
        path.join(__dirname, 'missing-videos.json'),
        JSON.stringify(missingVideos, null, 2)
      );

      console.log('✓ Missing videos list saved to: missing-videos.json\n');

      // Create upload instructions
      console.log('═══════════════════════════════════════════');
      console.log('UPLOAD INSTRUCTIONS FOR MISSING VIDEOS');
      console.log('═══════════════════════════════════════════\n');

      console.log('Option 1: Upload just the missing 18 videos (faster)');
      console.log('  - Create a new folder with just these 18 videos');
      console.log('  - Run the scp command for that folder\n');

      console.log('Option 2: Re-upload all 99 videos (simpler)');
      console.log('  - This will overwrite the existing 81');
      console.log('  - Run this command:\n');
      console.log(`  scp -r "C:\\xampp\\htdocs\\testmccl\\McCulloch Website\\McCulloch Website\\Server\\temp-video-staging-final\\*" ${VPS_USER}@${VPS_HOST}:/tmp/product-videos/\n`);
      console.log('  Then SSH in and copy to container:\n');
      console.log(`  ssh ${VPS_USER}@${VPS_HOST}`);
      console.log(`  docker cp /tmp/product-videos/. ${CONTAINER_NAME}:/app/uploads/products/videos/`);
      console.log(`  rm -rf /tmp/product-videos`);
      console.log(`  exit\n`);
    } else {
      console.log('✓ All videos are present in the container!\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

findMissingVideos();
