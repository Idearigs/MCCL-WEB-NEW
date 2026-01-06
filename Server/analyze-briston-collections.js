const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'Briston SS25 Order Form (2).xlsx');
const workbook = XLSX.readFile(excelPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { range: 7 });

console.log(`Total watches found: ${data.length}\n`);

// Extract collection names from Family Description
// The collection name appears to be the first part before specific details like dial color, strap, etc.

function extractCollectionName(familyDescription) {
  if (!familyDescription) return null;

  const desc = String(familyDescription).trim();

  // Common patterns to identify where the collection name ends:
  // - Before specific dial colors (Black Dial, White Dial, Rose Dial, etc.)
  // - Before case descriptions
  // - Before strap descriptions

  // Split by common separators
  const patterns = [
    / Black Dial/i,
    / White Dial/i,
    / Rose Dial/i,
    / Green Dial/i,
    / Navy Blue Dial/i,
    / Whire Dial/i, // Typo in data
    / Safari Case/i,
    / Artic Camo Case/i,
    / and /i, // "and Nato Strap", "and Black Nato"
  ];

  let collectionName = desc;

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) {
      collectionName = desc.substring(0, match.index).trim();
      break;
    }
  }

  return collectionName;
}

// Extract all collection names
const collectionMap = new Map();

data.forEach((row, index) => {
  const familyDesc = row['Family Description'];
  const collectionName = extractCollectionName(familyDesc);

  if (collectionName) {
    if (!collectionMap.has(collectionName)) {
      collectionMap.set(collectionName, []);
    }
    collectionMap.get(collectionName).push({
      index: index + 1,
      familyDesc,
      styleNumber: row['Style Number']
    });
  }
});

console.log('═══════════════════════════════════════════');
console.log('EXTRACTED COLLECTIONS');
console.log('═══════════════════════════════════════════\n');

const collections = Array.from(collectionMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

collections.forEach(([collectionName, watches], index) => {
  console.log(`${index + 1}. ${collectionName}`);
  console.log(`   Watch count: ${watches.length}`);
  console.log(`   First watch: ${watches[0].familyDesc}`);
  if (watches.length > 1) {
    console.log(`   Last watch: ${watches[watches.length - 1].familyDesc}`);
  }
  console.log('');
});

console.log('═══════════════════════════════════════════');
console.log(`Total unique collections: ${collections.length}`);
console.log(`Total watches: ${data.length}`);
console.log('═══════════════════════════════════════════\n');

// Check for any watches without collection
const withoutCollection = data.filter(row => !extractCollectionName(row['Family Description']));
if (withoutCollection.length > 0) {
  console.log('⚠️  Watches without collection extracted:');
  withoutCollection.forEach(row => {
    console.log(`   - ${row['Style Number']}: ${row['Family Description']}`);
  });
}
