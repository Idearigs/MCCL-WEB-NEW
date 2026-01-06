const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const excelPath = path.join(__dirname, '..', 'Product-list.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('═══════════════════════════════════════════');
console.log('    EXCEL FILE ANALYSIS');
console.log('═══════════════════════════════════════════\n');

console.log('📊 Total Rows:', data.length);
console.log('📋 Sheet Name:', sheetName);
console.log('\n📝 Columns Found:');

if (data.length > 0) {
  const columns = Object.keys(data[0]);
  columns.forEach((key, index) => {
    console.log(`   ${index + 1}. "${key}"`);
  });

  console.log('\n📄 First 3 Sample Records:\n');
  data.slice(0, 3).forEach((row, index) => {
    console.log(`Record ${index + 1}:`);
    console.log(JSON.stringify(row, null, 2));
    console.log('');
  });

  // Check for #N/A values
  let naCount = 0;
  let emptyCount = 0;
  data.forEach(row => {
    Object.entries(row).forEach(([key, val]) => {
      const valStr = String(val).trim();
      if (valStr === '#N/A' || valStr === 'N/A' || valStr === '#N/A!' || valStr === '#N/A') {
        naCount++;
      }
      if (!val || valStr === '' || valStr === 'undefined' || valStr === 'null') {
        emptyCount++;
      }
    });
  });

  console.log('⚠️  Statistics:');
  console.log(`   • #N/A Values: ${naCount}`);
  console.log(`   • Empty/Null Values: ${emptyCount}`);

  // Check for missing critical fields
  console.log('\n🔍 Critical Field Analysis:');
  const missingNames = data.filter(row => !row.Name || String(row.Name).trim() === '').length;
  const missingCodes = data.filter(row => !row.Code || String(row.Code).trim() === '').length;
  const missingDescs = data.filter(row => !row.Description || String(row.Description).trim() === '').length;

  console.log(`   • Missing Names: ${missingNames} records`);
  console.log(`   • Missing Codes (SKU): ${missingCodes} records`);
  console.log(`   • Missing Descriptions: ${missingDescs} records`);

  console.log('\n═══════════════════════════════════════════\n');
}
