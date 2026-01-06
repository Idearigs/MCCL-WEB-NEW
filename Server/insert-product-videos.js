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

async function insertProductVideos() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Load staged videos list
    const stagedVideosPath = path.join(__dirname, 'staged-videos-final.json');

    if (!fs.existsSync(stagedVideosPath)) {
      console.error('❌ staged-videos-final.json not found.');
      process.exit(1);
    }

    const videoList = JSON.parse(fs.readFileSync(stagedVideosPath, 'utf8'));

    console.log('═══════════════════════════════════════════');
    console.log('INSERTING VIDEOS INTO PRODUCT_VIDEOS TABLE');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Total videos to insert: ${videoList.length}\n`);

    let insertedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const video of videoList) {
      try {
        const videoUrl = `/uploads/products/videos/${video.safeFileName}`;

        await sequelize.query(`
          INSERT INTO product_videos (
            id,
            product_id,
            video_url,
            title,
            sort_order,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            :productId,
            :videoUrl,
            :title,
            0,
            NOW(),
            NOW()
          )
        `, {
          replacements: {
            productId: video.productId,
            videoUrl,
            title: video.productName
          }
        });

        console.log(`✓ ${video.productSKU} - ${video.productName}`);
        console.log(`  → ${videoUrl}`);
        insertedCount++;

        results.push({
          success: true,
          sku: video.productSKU,
          productName: video.productName,
          videoUrl
        });

      } catch (error) {
        console.log(`❌ ${video.productSKU} - ${error.message}`);
        failedCount++;

        results.push({
          success: false,
          sku: video.productSKU,
          error: error.message
        });
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('INSERT SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Inserted: ${insertedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📊 Success rate: ${((insertedCount / videoList.length) * 100).toFixed(1)}%`);
    console.log('');
    console.log('Videos are now linked in the admin panel!');
    console.log('');

    // Save insert report
    fs.writeFileSync(
      path.join(__dirname, 'video-insert-report.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalVideos: videoList.length,
        inserted: insertedCount,
        failed: failedCount,
        results
      }, null, 2)
    );

    console.log('✓ Insert report saved to: video-insert-report.json\n');

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

insertProductVideos();
