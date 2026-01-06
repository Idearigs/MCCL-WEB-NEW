const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

const VPS_HOST = '31.97.116.89';
const VPS_USER = 'root';
const CONTAINER_NAME = 'xsgkgg808g0g4oso8cwgkkkk-155857619722';

async function compareVideos() {
  try {
    console.log('Fetching container video list...\n');

    // Get container videos
    const { stdout } = await execPromise(`ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} ls -1 /app/uploads/products/videos/"`);
    const containerVideos = stdout.trim().split('\n').map(v => v.trim()).filter(v => v && v.endsWith('.mp4'));

    console.log(`Videos in container: ${containerVideos.length}`);

    // Load staged videos
    const stagedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'staged-videos-final.json'), 'utf8'));
    const stagedVideos = stagedData.map(v => v.safeFileName);

    console.log(`Videos in staged list: ${stagedVideos.length}\n`);

    // Create sets for comparison
    const containerSet = new Set(containerVideos);
    const stagedSet = new Set(stagedVideos);

    // Find missing in container
    const missingInContainer = [];
    stagedVideos.forEach(filename => {
      if (!containerSet.has(filename)) {
        const videoData = stagedData.find(v => v.safeFileName === filename);
        missingInContainer.push(videoData);
      }
    });

    // Find extra in container (shouldn't happen)
    const extraInContainer = [];
    containerVideos.forEach(filename => {
      if (!stagedSet.has(filename)) {
        extraInContainer.push(filename);
      }
    });

    console.log('═══════════════════════════════════════════');
    console.log('COMPARISON RESULTS');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Missing from container: ${missingInContainer.length}`);
    console.log(`Extra in container: ${extraInContainer.length}\n`);

    if (missingInContainer.length > 0) {
      console.log('MISSING FROM CONTAINER:');
      console.log('═'.repeat(50));
      missingInContainer.forEach(v => {
        console.log(`❌ ${v.safeFileName}`);
        console.log(`   SKU: ${v.productSKU} - ${v.productName}`);
      });
      console.log('');

      // Save missing videos
      fs.writeFileSync(
        path.join(__dirname, 'missing-from-container.json'),
        JSON.stringify(missingInContainer, null, 2)
      );
      console.log('✓ Saved to: missing-from-container.json\n');
    }

    if (extraInContainer.length > 0) {
      console.log('EXTRA IN CONTAINER (not in staged list):');
      console.log('═'.repeat(50));
      extraInContainer.forEach(f => console.log(`  + ${f}`));
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

compareVideos();
