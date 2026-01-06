const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = path.join(__dirname, '..', 'Roamer AW25 Price list.xlsx');
const workbook = XLSX.readFile(excelPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Parse data starting from row 8 (header row)
const data = XLSX.utils.sheet_to_json(worksheet, { range: 7 });

console.log(`Total watches found: ${data.length}\n`);

function extractCollectionName(familyDescription) {
  if (!familyDescription) return null;

  const desc = String(familyDescription).trim();

  // Patterns that indicate we've reached the specific product details
  const detailPatterns = [
    / Blue Dial/i,
    / Black Dial/i,
    / White Dial/i,
    / Silver Dial/i,
    / Green Dial/i,
    / Marine Blue Dial/i,
    / Blue Sunray Dial/i,
    / Black Pattern Dial/i,
    / Scuba Blue Dial/i,
    / Scuba Green Dial/i,
    / Scuba Black Dial/i,
    / Grey Dial/i,
    / Red Dial/i,
    / Brown Dial/i,
    / Rose Gold Dial/i,
    / Steel Bracelet/i,
    / Steel Strap/i,
    / Blue Strap/i,
    / Black Strap/i,
    / Brown Strap/i,
    / Leather Strap/i,
    / Rubber Strap/i,
    / Steel$/i,
    / Bracelet$/i,
    / Strap$/i,
    / Bi-Colour/i,
    / Bicolour/i,
    / Yellow Gold/i,
    / Rose Gold/i,
  ];

  let collectionName = desc;
  let earliestMatch = desc.length;

  // Find the first occurrence of any detail pattern
  for (const pattern of detailPatterns) {
    const match = desc.match(pattern);
    if (match && match.index < earliestMatch) {
      earliestMatch = match.index;
    }
  }

  collectionName = desc.substring(0, earliestMatch).trim();

  // Clean up trailing words
  collectionName = collectionName
    .replace(/ (Dial|Case|Bracelet|Strap|Steel|Gold)$/i, '')
    .trim();

  return collectionName;
}

// Extract all collection names
const collectionMap = new Map();

data.forEach((row, index) => {
  const familyDesc = row['Family'];
  if (!familyDesc) return;

  const collectionName = extractCollectionName(familyDesc);

  if (collectionName) {
    if (!collectionMap.has(collectionName)) {
      collectionMap.set(collectionName, []);
    }
    collectionMap.get(collectionName).push({
      index: index + 1,
      familyDesc,
      styleNumber: row['Style'],
      rrp: row['RRP'],
      cost: row['Cost']
    });
  }
});

console.log('═══════════════════════════════════════════');
console.log('ROAMER WATCH COLLECTIONS');
console.log('═══════════════════════════════════════════\n');

const collections = Array.from(collectionMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

collections.forEach(([collectionName, watches], index) => {
  console.log(`${index + 1}. ${collectionName}`);
  console.log(`   Watches in collection: ${watches.length}`);
  console.log(`   Example: ${watches[0].styleNumber} - ${watches[0].familyDesc}`);
  console.log('');
});

console.log('═══════════════════════════════════════════');
console.log(`✓ Total unique collections: ${collections.length}`);
console.log(`✓ Total watches: ${data.filter(r => r['Family']).length}`);
console.log('═══════════════════════════════════════════\n');

// Save the collections list
const collectionsData = {
  brand: 'Roamer',
  totalCollections: collections.length,
  totalWatches: data.filter(r => r['Family']).length,
  collections: collections.map(([name, watches]) => ({
    name,
    count: watches.length,
    watches: watches.map(w => ({
      styleNumber: w.styleNumber,
      description: w.familyDesc,
      rrp: w.rrp,
      cost: w.cost
    }))
  }))
};

fs.writeFileSync(
  path.join(__dirname, 'roamer-collections-extracted.json'),
  JSON.stringify(collectionsData, null, 2)
);

console.log('✓ Collection data saved to: roamer-collections-extracted.json\n');
