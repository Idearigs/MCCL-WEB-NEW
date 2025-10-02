// Load production environment variables first
require('dotenv').config({ path: '.env.production' });

console.log('🔧 Production environment loaded');
console.log('📊 Database config check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PG_HOST:', process.env.PG_HOST);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Missing');

// Start the server
require('./index.js');