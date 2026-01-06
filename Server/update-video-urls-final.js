const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

async function checkVideoUrls() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Check sample video URLs
    const [videos] = await sequelize.query(`
      SELECT id, product_id, video_url, title
      FROM product_videos
      LIMIT 5
    `);

    console.log('═══════════════════════════════════════════');
    console.log('SAMPLE VIDEO URLS IN DATABASE');
    console.log('═══════════════════════════════════════════\n');

    videos.forEach(v => {
      console.log(`Title: ${v.title}`);
      console.log(`URL: ${v.video_url}\n`);
    });

    await sequelize.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkVideoUrls();
