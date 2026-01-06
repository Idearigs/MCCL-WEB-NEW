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
const VPS_UPLOAD_PATH = '/tmp/video-uploads'; // Temporary path on VPS host
const CONTAINER_PATH = '/app/uploads/products/videos'; // Final path inside container

async function uploadVideos() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Load match report
    const reportPath = path.join(__dirname, 'video-match-report.json');
    const matchReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    console.log('═══════════════════════════════════════════');
    console.log('VIDEO UPLOAD TO VPS');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Total matched videos: ${matchReport.matched.length}\n`);
    console.log('⚠️  IMPORTANT: You need to have SSH access to the VPS');
    console.log(`   VPS: ${VPS_USER}@${VPS_HOST}`);
    console.log('');

    let uploadedCount = 0;
    let failedCount = 0;
    const uploadResults = [];

    for (const video of matchReport.matched) {
      try {
        const localPath = video.localPath;
        const fileName = path.basename(localPath);
        const fileExt = path.extname(fileName);

        // Create safe filename using SKU
        const safeFileName = `${video.sku.replace(/[^a-zA-Z0-9-]/g, '_')}${fileExt}`;

        console.log(`\n📤 Uploading: ${fileName}`);
        console.log(`   → Product: ${video.productName}`);
        console.log(`   → SKU: ${video.sku}`);
        console.log(`   → New name: ${safeFileName}`);

        // Check if local file exists
        if (!fs.existsSync(localPath)) {
          console.log(`   ❌ Local file not found: ${localPath}`);
          failedCount++;
          continue;
        }

        const localFileSize = fs.statSync(localPath).size;
        console.log(`   → Size: ${(localFileSize / 1024 / 1024).toFixed(2)} MB`);

        // Step 1: Create temp directory on VPS
        const mkdirCmd = `ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_UPLOAD_PATH}"`;
        await execPromise(mkdirCmd);

        // Step 2: Upload file to VPS temp directory
        const scpCmd = `scp "${localPath}" ${VPS_USER}@${VPS_HOST}:${VPS_UPLOAD_PATH}/${safeFileName}`;
        console.log(`   → Uploading to VPS...`);
        await execPromise(scpCmd);

        // Step 3: Copy from VPS temp to container
        const dockerCpCmd = `ssh ${VPS_USER}@${VPS_HOST} "docker cp ${VPS_UPLOAD_PATH}/${safeFileName} ${CONTAINER_NAME}:${CONTAINER_PATH}/${safeFileName}"`;
        console.log(`   → Copying to container...`);
        await execPromise(dockerCpCmd);

        // Step 4: Verify file in container
        const verifyCmd = `ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} ls -lh ${CONTAINER_PATH}/${safeFileName}"`;
        const { stdout } = await execPromise(verifyCmd);
        console.log(`   → Verified: ${stdout.trim()}`);

        // Step 5: Update database with video URL
        const videoUrl = `/uploads/products/videos/${safeFileName}`;
        await sequelize.query(`
          UPDATE products
          SET video_url = :videoUrl
          WHERE id = :productId
        `, {
          replacements: {
            videoUrl,
            productId: video.productId
          }
        });

        console.log(`   ✅ Upload successful`);
        console.log(`   → URL: ${videoUrl}`);

        uploadedCount++;
        uploadResults.push({
          success: true,
          fileName,
          sku: video.sku,
          productName: video.productName,
          videoUrl
        });

      } catch (error) {
        console.log(`   ❌ Upload failed: ${error.message}`);
        failedCount++;
        uploadResults.push({
          success: false,
          fileName: path.basename(video.localPath),
          sku: video.sku,
          error: error.message
        });
      }
    }

    // Cleanup temp files on VPS
    console.log('\n\n🧹 Cleaning up temporary files...');
    try {
      const cleanupCmd = `ssh ${VPS_USER}@${VPS_HOST} "rm -rf ${VPS_UPLOAD_PATH}"`;
      await execPromise(cleanupCmd);
      console.log('✓ Cleanup complete\n');
    } catch (error) {
      console.log('⚠️  Cleanup failed (non-critical)\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('UPLOAD SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total videos: ${matchReport.matched.length}`);
    console.log(`✅ Uploaded: ${uploadedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`Success rate: ${((uploadedCount / matchReport.matched.length) * 100).toFixed(1)}%`);
    console.log('');

    // Save upload report
    fs.writeFileSync(
      path.join(__dirname, 'video-upload-report.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalVideos: matchReport.matched.length,
        uploaded: uploadedCount,
        failed: failedCount,
        results: uploadResults
      }, null, 2)
    );

    console.log('✓ Upload report saved to: video-upload-report.json\n');

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

uploadVideos();
