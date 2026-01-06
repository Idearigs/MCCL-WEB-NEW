const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'Product-list.xlsx');
const workbook = XLSX.readFile(excelPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Searching for ALL occurrences of BJ-072 in Excel:\n');
let found = false;
data.forEach((row, index) => {
  const code = row['code '] ? String(row['code ']).trim() : null;
  if (code === 'BJ-072') {
    found = true;
    console.log(`Row ${index + 1}: SKU ${code}`);
    console.log(`  Name: ${row['Name']}`);
    console.log(`  Stone Shape: '${row['Stone Shape']}' (type: ${typeof row['Stone Shape']})`);
    console.log(`  Ring Style-1: ${row['Ring Style-1']}`);
    console.log(`  Ring Style-2: ${row['Ring Style-2']}`);
    console.log('');
  }
});

if (!found) {
  console.log('❌ No BJ-072 found in Excel');
} else {
  console.log('✓ Found BJ-072 occurrence(s)\n');
}

// Count total occurrences
const bj072Count = data.filter(row => {
  const code = row['code '] ? String(row['code ']).trim() : null;
  return code === 'BJ-072';
}).length;

console.log(`Total occurrences of BJ-072: ${bj072Count}`);
