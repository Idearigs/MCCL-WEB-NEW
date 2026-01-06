const { exec } = require('child_process');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

// VPS Configuration
const VPS_HOST = '31.97.116.89';
const VPS_USER = 'root';
const CONTAINER_NAME = 'xsgkgg808g0g4oso8cwgkkkk-155857619722';

async function batchUploadVideos() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Load match report
    const reportPath = path.join(__dirname, 'video-match-report.json');
    const matchReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    console.log('═══════════════════════════════════════════');
    console.log('BATCH VIDEO UPLOAD TO VPS');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Total matched videos: ${matchReport.matched.length}\n`);

    // Step 1: Test SSH connection
    console.log('Step 1: Testing SSH connection...');
    try {
      const testCmd = `ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} "echo 'Connection successful'"`;
      const { stdout } = await execPromise(testCmd);
      console.log(`✓ ${stdout.trim()}\n`);
    } catch (error) {
      console.error('❌ SSH connection failed. Please ensure:');
      console.error('   1. You can SSH to the VPS: ssh root@31.97.116.89');
      console.error('   2. SSH key is configured or you have the password');
      console.error(`\n   Error: ${error.message}\n`);
      process.exit(1);
    }

    // Step 2: Create temporary staging directory
    console.log('Step 2: Preparing videos for upload...');
    const stagingDir = path.join(__dirname, 'temp-video-staging');
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true });
    }
    fs.mkdirSync(stagingDir, { recursive: true });

    // Copy and rename videos to staging directory
    const videoMapping = [];
    let copiedCount = 0;

    for (const video of matchReport.matched) {
      const localPath = video.localPath;
      const fileName = path.basename(localPath);
      const fileExt = path.extname(fileName);

      // Create safe filename using SKU
      const safeFileName = `${video.sku.replace(/[^a-zA-Z0-9-]/g, '_')}${fileExt}`;
      const stagingPath = path.join(stagingDir, safeFileName);

      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, stagingPath);
        copiedCount++;
        videoMapping.push({
          originalName: fileName,
          safeFileName,
          productId: video.productId,
          productName: video.productName,
          sku: video.sku
        });
      } else {
        console.log(`⚠️  Skipped (not found): ${fileName}`);
      }
    }

    console.log(`✓ Prepared ${copiedCount} videos\n`);

    // Step 3: Upload all videos using SCP
    console.log('Step 3: Uploading videos to VPS (this may take a few minutes)...');
    const scpCmd = `scp -r "${stagingDir}"/* ${VPS_USER}@${VPS_HOST}:/tmp/product-videos/`;
    console.log(`   Creating remote directory and uploading...`);

    // Create remote directory first
    await execPromise(`ssh ${VPS_USER}@${VPS_HOST} "mkdir -p /tmp/product-videos"`);

    // Upload all files
    await execPromise(scpCmd);
    console.log(`✓ Upload complete\n`);

    // Step 4: Copy videos from VPS to container
    console.log('Step 4: Copying videos to container...');
    const dockerCpCmd = `ssh ${VPS_USER}@${VPS_HOST} "docker cp /tmp/product-videos/. ${CONTAINER_NAME}:/app/uploads/products/videos/"`;
    await execPromise(dockerCpCmd);
    console.log(`✓ Videos copied to container\n`);

    // Step 5: Verify and update database
    console.log('Step 5: Updating database with video URLs...');
    let updatedCount = 0;

    for (const mapping of videoMapping) {
      try {
        const videoUrl = `/uploads/products/videos/${mapping.safeFileName}`;

        // Verify file exists in container
        const verifyCmd = `ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} test -f /app/uploads/products/videos/${mapping.safeFileName} && echo 'exists'"`;
        const { stdout } = await execPromise(verifyCmd);

        if (stdout.trim() === 'exists') {
          // Update database
          await sequelize.query(`
            UPDATE products
            SET video_url = :videoUrl
            WHERE id = :productId
          `, {
            replacements: {
              videoUrl,
              productId: mapping.productId
            }
          });

          console.log(`  ✓ ${mapping.sku} → ${mapping.productName}`);
          updatedCount++;
        } else {
          console.log(`  ❌ ${mapping.sku} → File not found in container`);
        }
      } catch (error) {
        console.log(`  ❌ ${mapping.sku} → ${error.message}`);
      }
    }

    console.log(`\n✓ Updated ${updatedCount} products\n`);

    // Step 6: Cleanup
    console.log('Step 6: Cleaning up...');

    // Remove local staging directory
    fs.rmSync(stagingDir, { recursive: true });
    console.log('  ✓ Local staging directory removed');

    // Remove temp files on VPS
    await execPromise(`ssh ${VPS_USER}@${VPS_HOST} "rm -rf /tmp/product-videos"`);
    console.log('  ✓ VPS temp directory removed\n');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('UPLOAD COMPLETE');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Successfully uploaded and linked: ${updatedCount} videos`);
    console.log(`📊 Success rate: ${((updatedCount / matchReport.matched.length) * 100).toFixed(1)}%`);
    console.log('');
    console.log('Videos are now accessible at:');
    console.log('  https://api.buymediamonds.co.uk/uploads/products/videos/[filename]');
    console.log('');

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

batchUploadVideos();
