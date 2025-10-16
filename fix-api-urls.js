const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'Client/src/admin/components/CategoryFormModal.tsx',
  'Client/src/admin/pages/AdminCategories.tsx',
  'Client/src/admin/pages/AdminDashboard.tsx',
  'Client/src/admin/pages/AdminProducts.tsx',
  'Client/src/admin/pages/AdminWatches.tsx',
  'Client/src/components/LuxuryNavigation.tsx',
  'Client/src/components/LuxuryNavigationWhite.tsx',
  'Client/src/components/MainContentSection.tsx',
  'Client/src/components/SearchOverlay.tsx',
  'Client/src/pages/Briston.tsx',
  'Client/src/pages/BristonHeritageCollection.tsx',
  'Client/src/pages/Festina.tsx',
  'Client/src/pages/FestinaClassicCollection.tsx',
  'Client/src/pages/ProductDetail.tsx',
  'Client/src/pages/Rings.tsx',
  'Client/src/pages/Roamer.tsx',
  'Client/src/pages/RoamerSwissTradition.tsx'
];

console.log('🔧 Fixing API URLs in all files...\n');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if import already exists
  const hasApiImport = content.includes('import API_BASE_URL') || content.includes("import { api }");

  // Add import if not exists
  if (!hasApiImport && content.includes('localhost:5000')) {
    // Find the last import statement
    const importMatch = content.match(/(import .+ from .+;\n)/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;

      // Determine correct relative path based on file location
      let relativePath;
      if (filePath.includes('/admin/')) {
        relativePath = '../../config/api';
      } else if (filePath.includes('/pages/') || filePath.includes('/components/')) {
        relativePath = '../config/api';
      } else {
        relativePath = './config/api';
      }

      content = content.slice(0, lastImportIndex) +
                `import API_BASE_URL from '${relativePath}';\n` +
                content.slice(lastImportIndex);
      modified = true;
    }
  }

  // Replace all localhost:5000 URLs with template literals using API_BASE_URL
  const originalContent = content;

  // Pattern 1: 'http://localhost:5000/api/v1/...'
  content = content.replace(/'http:\/\/localhost:5000\/api\/v1([^']*)'/g, '`${API_BASE_URL}$1`');

  // Pattern 2: "http://localhost:5000/api/v1/..."
  content = content.replace(/"http:\/\/localhost:5000\/api\/v1([^"]*)"/g, '`${API_BASE_URL}$1`');

  // Pattern 3: `http://localhost:5000/api/v1/...`
  content = content.replace(/`http:\/\/localhost:5000\/api\/v1([^`]*)`/g, '`${API_BASE_URL}$1`');

  if (content !== originalContent) {
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  Skipped (no changes): ${filePath}`);
  }
});

console.log('\n✨ Done! All files updated.');
console.log('\n📝 Next steps:');
console.log('1. Review the changes: git diff');
console.log('2. Test locally: cd Client && npm run dev');
console.log('3. Commit: git add . && git commit -m "Replace all hardcoded API URLs with environment variable"');
console.log('4. Push: git push');
console.log('5. Redeploy frontend in Coolify');
