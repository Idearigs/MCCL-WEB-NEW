const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'Roamer AW25 Price list.xlsx');
const workbook = XLSX.readFile(excelPath);

console.log('═══════════════════════════════════════════');
console.log('ROAMER EXCEL FILE ANALYSIS');
console.log('═══════════════════════════════════════════\n');

console.log('Available sheets:');
workbook.SheetNames.forEach((name, index) => {
  console.log(`  ${index + 1}. ${name}`);
});

console.log('\n');

// Analyze first sheet
const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(firstSheet);

console.log(`Sheet: ${workbook.SheetNames[0]}`);
console.log(`Total rows: ${data.length}\n`);

if (data.length > 0) {
  console.log('Column headers:');
  Object.keys(data[0]).forEach((key, index) => {
    console.log(`  ${index + 1}. ${key}`);
  });

  console.log('\n');
  console.log('First 5 rows sample:\n');

  data.slice(0, 5).forEach((row, index) => {
    console.log(`Row ${index + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  });
}

console.log('═══════════════════════════════════════════\n');
