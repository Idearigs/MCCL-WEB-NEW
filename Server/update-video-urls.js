const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

async function updateVideoUrls() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Load staged videos list
    const stagedVideosPath = path.join(__dirname, 'staged-videos.json');

    if (!fs.existsSync(stagedVideosPath)) {
      console.error('❌ staged-videos.json not found. Please run upload-videos.ps1 first.\n');
      process.exit(1);
    }

    const videoList = JSON.parse(fs.readFileSync(stagedVideosPath, 'utf8'));

    console.log('═══════════════════════════════════════════');
    console.log('UPDATING DATABASE WITH VIDEO URLS');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Total videos to update: ${videoList.length}\n`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const video of videoList) {
      try {
        const videoUrl = `/uploads/products/videos/${video.safeFileName}`;

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

        console.log(`✓ ${video.sku} - ${video.productName}`);
        console.log(`  → ${videoUrl}`);
        updatedCount++;

      } catch (error) {
        console.log(`❌ ${video.sku} - ${error.message}`);
        failedCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('UPDATE SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📊 Success rate: ${((updatedCount / videoList.length) * 100).toFixed(1)}%`);
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

updateVideoUrls();
