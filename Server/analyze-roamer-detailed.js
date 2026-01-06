const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'Roamer AW25 Price list.xlsx');
const workbook = XLSX.readFile(excelPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

console.log('═══════════════════════════════════════════');
console.log('ROAMER EXCEL RAW DATA ANALYSIS');
console.log('═══════════════════════════════════════════\n');

// Get raw data without parsing to JSON
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log(`Sheet range: ${worksheet['!ref']}`);
console.log(`Rows: ${range.e.r + 1}`);
console.log(`Columns: ${range.e.c + 1}\n`);

// Show first 20 rows
console.log('First 20 rows (raw):\n');

for (let row = 0; row <= Math.min(20, range.e.r); row++) {
  let rowData = [];
  for (let col = 0; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    if (cell && cell.v !== undefined) {
      rowData.push(`${XLSX.utils.encode_col(col)}: ${cell.v}`);
    }
  }
  if (rowData.length > 0) {
    console.log(`Row ${row + 1}: ${rowData.join(' | ')}`);
  }
}

// Try to find the header row by looking for common patterns
console.log('\n\nSearching for header row...\n');

for (let row = 0; row <= Math.min(30, range.e.r); row++) {
  let rowData = [];
  for (let col = 0; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    if (cell && cell.v !== undefined) {
      rowData.push(cell.v);
    }
  }

  const rowText = rowData.join(' ').toLowerCase();
  if (rowText.includes('style') || rowText.includes('sku') || rowText.includes('price') || rowText.includes('description')) {
    console.log(`Potential header at row ${row + 1}:`);
    rowData.forEach((val, idx) => {
      console.log(`  Column ${idx + 1}: ${val}`);
    });
    console.log('');
  }
}

console.log('═══════════════════════════════════════════\n');
