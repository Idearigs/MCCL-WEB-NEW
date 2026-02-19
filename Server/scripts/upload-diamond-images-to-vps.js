const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// VPS Configuration
const VPS_HOST = '31.97.116.89';
const VPS_USER = 'root';
const CONTAINER_NAME = 'xsgkgg808g0g4oso8cwgkkkk-163155005355';
const CONTAINER_PRODUCTS_PATH = '/app/uploads/products';

// Local path to BJ-* folders
const LOCAL_PRODUCTS_PATH = path.join(__dirname, '..', 'uploads', 'products');

async function run(cmd, label, timeout = 600000) {
  console.log(`   > ${label || cmd}`);
  try {
    const { stdout, stderr } = await execPromise(cmd, { timeout, maxBuffer: 50 * 1024 * 1024 });
    if (stdout.trim()) console.log(`     ${stdout.trim()}`);
    return stdout;
  } catch (err) {
    console.log(`     ERROR: ${err.message.substring(0, 200)}`);
    throw err;
  }
}

async function uploadDiamondImages() {
  console.log('═══════════════════════════════════════════');
  console.log('DIAMOND SIZE IMAGE UPLOAD TO VPS');
  console.log('═══════════════════════════════════════════\n');

  // Find all BJ-* folders
  const entries = fs.readdirSync(LOCAL_PRODUCTS_PATH);
  const bjFolders = entries.filter(e => {
    const fullPath = path.join(LOCAL_PRODUCTS_PATH, e);
    return e.startsWith('BJ-') && fs.statSync(fullPath).isDirectory();
  }).sort();

  console.log(`Found ${bjFolders.length} product folders: ${bjFolders.join(', ')}\n`);

  // Count total files
  let totalFiles = 0;
  for (const folder of bjFolders) {
    const folderPath = path.join(LOCAL_PRODUCTS_PATH, folder);
    const subFolders = fs.readdirSync(folderPath);
    for (const sub of subFolders) {
      const subPath = path.join(folderPath, sub);
      if (fs.statSync(subPath).isDirectory()) {
        totalFiles += fs.readdirSync(subPath).length;
      }
    }
  }
  console.log(`Total files to upload: ${totalFiles}\n`);

  // Strategy: tar each BJ-* folder individually, pipe through SSH, extract on VPS temp, then docker cp
  let uploadedFolders = 0;
  let failedFolders = 0;

  for (const folder of bjFolders) {
    const localFolderPath = path.join(LOCAL_PRODUCTS_PATH, folder);
    const subFolders = fs.readdirSync(localFolderPath).filter(s =>
      fs.statSync(path.join(localFolderPath, s)).isDirectory()
    );

    console.log(`\n[${uploadedFolders + failedFolders + 1}/${bjFolders.length}] Uploading ${folder}...`);
    console.log(`   Diamond sizes: ${subFolders.join(', ')}`);

    // Count files in this folder
    let folderFiles = 0;
    for (const sub of subFolders) {
      const subPath = path.join(localFolderPath, sub);
      folderFiles += fs.readdirSync(subPath).length;
    }
    console.log(`   Files: ${folderFiles}`);

    try {
      // Step 1: Create a tar for this folder and upload via tar-over-ssh
      // tar on local -> pipe via ssh -> extract on remote /tmp/
      const productsDir = LOCAL_PRODUCTS_PATH.replace(/\\/g, '/');

      // Use tar + ssh pipe: cd to products dir, tar the folder, pipe to ssh which extracts
      const cmd = `cd "${productsDir}" && tar cf - "${folder}" | ssh ${VPS_USER}@${VPS_HOST} "mkdir -p /tmp/diamond-upload && cd /tmp/diamond-upload && tar xf -"`;

      console.log(`   > Streaming ${folder} via tar|ssh...`);
      const startTime = Date.now();
      await execPromise(cmd, { timeout: 600000, maxBuffer: 50 * 1024 * 1024 });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   > Uploaded in ${elapsed}s`);

      // Step 2: Docker cp from /tmp/diamond-upload/BJ-XXX to container
      console.log(`   > Copying into container...`);
      await run(
        `ssh ${VPS_USER}@${VPS_HOST} "docker cp /tmp/diamond-upload/${folder} ${CONTAINER_NAME}:${CONTAINER_PRODUCTS_PATH}/${folder}"`,
        `docker cp ${folder}`,
        120000
      );

      // Cleanup this folder from temp
      await execPromise(`ssh ${VPS_USER}@${VPS_HOST} "rm -rf /tmp/diamond-upload/${folder}"`, { timeout: 15000 });

      uploadedFolders++;
      console.log(`   ✅ ${folder} done`);
    } catch (err) {
      console.log(`   ❌ ${folder} failed: ${err.message.substring(0, 200)}`);
      failedFolders++;
    }
  }

  // Verify files in container
  console.log('\n\nVerifying files in container...');
  try {
    const { stdout } = await execPromise(
      `ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} find ${CONTAINER_PRODUCTS_PATH} -name 'BJ-*.png' | wc -l"`,
      { timeout: 30000 }
    );
    console.log(`   Total PNG files in container: ${stdout.trim()}`);

    const { stdout: folders } = await execPromise(
      `ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} ls ${CONTAINER_PRODUCTS_PATH} | grep BJ"`,
      { timeout: 30000 }
    );
    console.log(`   BJ folders in container: ${folders.trim().split('\n').join(', ')}`);
  } catch (err) {
    console.log(`   Verification error: ${err.message.substring(0, 200)}`);
  }

  // Cleanup
  console.log('\nCleaning up...');
  try {
    await execPromise(`ssh ${VPS_USER}@${VPS_HOST} "rm -rf /tmp/diamond-upload /tmp/diamond-images.tar.gz"`, { timeout: 15000 });
    console.log('   ✅ Cleanup complete');
  } catch (err) {
    console.log('   Cleanup failed (non-critical)');
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('UPLOAD SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  console.log(`Total product folders: ${bjFolders.length}`);
  console.log(`Total image files: ${totalFiles}`);
  console.log(`✅ Uploaded: ${uploadedFolders}`);
  console.log(`❌ Failed: ${failedFolders}`);
  console.log('');
}

uploadDiamondImages().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
