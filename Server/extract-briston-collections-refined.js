const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'Briston SS25 Order Form (2).xlsx');
const workbook = XLSX.readFile(excelPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { range: 7 });

console.log(`Total watches found: ${data.length}\n`);

// More sophisticated collection extraction
// The collection name is typically the first 2-4 words before specific details

function extractCollectionName(familyDescription) {
  if (!familyDescription) return null;

  const desc = String(familyDescription).trim();

  // Patterns that indicate we've reached the specific product details (not collection name)
  const detailPatterns = [
    / Black Dial/i,
    / White Dial/i,
    / Rose Dial/i,
    / Green Dial/i,
    / Navy Blue Dial/i,
    / Blue Dial/i,
    / Grey Dial/i,
    / Silver Dial/i,
    / Wood Dial/i,
    / Whire Dial/i, // Typo in data
    / Cardinal Red Dial/i,
    / Ice Blue Dial/i,
    / Midnight Blue Dial/i,
    / Mint Green Dial/i,
    / Olive Green Dial/i,
    / Taupe Dial/i,
    / Berry Dial/i,
    / Cardinal Dial/i,
    / Emerald Dial/i,
    / Peacock Blue Dial/i,
    / Terracotta/i,
    / Safari Case/i,
    / Artic Camo Case/i,
    / Black Case/i,
    / Jungle Black/i,
    / Orange Nato/i,
    / Yellow Nato/i,
    / Blue Nato/i,
    / 25mm/i,
    / 38mm/i,
    / 42mm/i,
  ];

  let collectionName = desc;

  // Find the first occurrence of any detail pattern
  let earliestMatch = desc.length;
  let matchedPattern = null;

  for (const pattern of detailPatterns) {
    const match = desc.match(pattern);
    if (match && match.index < earliestMatch) {
      earliestMatch = match.index;
      matchedPattern = pattern;
    }
  }

  if (matchedPattern) {
    collectionName = desc.substring(0, earliestMatch).trim();
  }

  // Clean up trailing words that are common prefixes to details
  collectionName = collectionName
    .replace(/ (Dial|Case|Nato|Strap|Leather|Silicone)$/i, '')
    .trim();

  return collectionName;
}

// Extract all collection names
const collectionMap = new Map();

data.forEach((row, index) => {
  const familyDesc = row['Family Description'];
  if (!familyDesc) return;

  const collectionName = extractCollectionName(familyDesc);

  if (collectionName) {
    if (!collectionMap.has(collectionName)) {
      collectionMap.set(collectionName, []);
    }
    collectionMap.get(collectionName).push({
      index: index + 1,
      familyDesc,
      styleNumber: row['Style Number'],
      color: row['Colour of Finishings'],
      rrp: row['RRP'],
      cost: row['Cost']
    });
  }
});

console.log('═══════════════════════════════════════════');
console.log('BRISTON WATCH COLLECTIONS');
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
console.log(`✓ Total watches: ${data.filter(r => r['Family Description']).length}`);
console.log('═══════════════════════════════════════════\n');

// Save the collections list
const collectionsData = {
  brand: 'Briston',
  totalCollections: collections.length,
  totalWatches: data.filter(r => r['Family Description']).length,
  collections: collections.map(([name, watches]) => ({
    name,
    count: watches.length,
    watches: watches.map(w => ({
      styleNumber: w.styleNumber,
      description: w.familyDesc,
      color: w.color,
      rrp: w.rrp,
      cost: w.cost
    }))
  }))
};

const fs = require('fs');
fs.writeFileSync(
  path.join(__dirname, 'briston-collections-extracted.json'),
  JSON.stringify(collectionsData, null, 2)
);

console.log('✓ Collection data saved to: briston-collections-extracted.json\n');
