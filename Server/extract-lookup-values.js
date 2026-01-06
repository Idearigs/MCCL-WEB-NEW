const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const excelPath = path.join(__dirname, '..', 'Product-list.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

// Extract unique values for ring styles, stone shapes, and stone types
const ringStyles = new Set();
const stoneShapes = new Set();
const stoneTypes = new Set();

data.forEach(row => {
  // Ring Styles (columns 1-4, Ring Style-5 doesn't exist in Excel)
  ['Ring Style-1', 'Ring Style-2', 'Ring Style-3', 'Ring Style-4'].forEach(col => {
    const value = row[col];
    if (value && String(value).trim() !== '' && String(value) !== '#N/A') {
      ringStyles.add(String(value).trim());
    }
  });

  // Stone Shape
  if (row['Stone Shape'] && String(row['Stone Shape']).trim() !== '' && String(row['Stone Shape']) !== '#N/A') {
    stoneShapes.add(String(row['Stone Shape']).trim());
  }

  // Stone Type
  if (row['Stone Type'] && String(row['Stone Type']).trim() !== '' && String(row['Stone Type']) !== '#N/A') {
    stoneTypes.add(String(row['Stone Type']).trim());
  }
});

console.log('═══════════════════════════════════════════');
console.log('    UNIQUE VALUES EXTRACTED FROM EXCEL');
console.log('═══════════════════════════════════════════\n');

console.log(`💍 RING STYLES (${ringStyles.size} unique values):`);
Array.from(ringStyles).sort().forEach((style, index) => {
  console.log(`   ${index + 1}. ${style}`);
});

console.log(`\n💎 STONE SHAPES (${stoneShapes.size} unique values):`);
Array.from(stoneShapes).sort().forEach((shape, index) => {
  console.log(`   ${index + 1}. ${shape}`);
});

console.log(`\n🔷 STONE TYPES (${stoneTypes.size} unique values):`);
Array.from(stoneTypes).sort().forEach((type, index) => {
  console.log(`   ${index + 1}. ${type}`);
});

console.log('\n═══════════════════════════════════════════\n');

// Export as JSON for the import script
const lookupData = {
  ringStyles: Array.from(ringStyles).sort(),
  stoneShapes: Array.from(stoneShapes).sort(),
  stoneTypes: Array.from(stoneTypes).sort()
};

require('fs').writeFileSync(
  path.join(__dirname, 'lookup-data.json'),
  JSON.stringify(lookupData, null, 2)
);

console.log('✓ Lookup data saved to lookup-data.json\n');
