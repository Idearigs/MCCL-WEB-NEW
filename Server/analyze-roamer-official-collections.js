const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Official Roamer collections with expected counts
const officialCollections = {
  'Allegra': 4,
  'Cassandra Diamond': 5,
  'Classico Gents': 12,
  'Classico Ladies': 12,
  'Competence Skeleton IV': 6,
  'Deep Sea Automatic': 4,
  'Deep Sea 200': 6,
  'Deep Sea 200 Ladies': 5,
  'Elegance Diamond': 3,
  'Eleganza': 3,
  'EOS Classic': 3,
  'Gran Sportivo': 3,
  'Helios Power': 3,
  'Mechano': 3,
  'Mercury Chrono': 4,
  'Montalbano Gents': 5,
  'Montalbano Ladies': 4,
  'Olivia Diamond': 4,
  'Premier': 7,
  'Premier Skeleton': 3,
  'Pro Auto 42mm': 4,
  'Pro Chrono': 11,
  'Pro Diver 200': 4,
  'R-Line Classic': 5,
  'R8 Gents': 3,
  'R8 Ladies': 3,
  'Rockshell Mark III Scuba': 8,
  'Scala': 5,
  'Searock Master': 3,
  'Slim-Line Classic Gents': 4,
  'Slim-Line Classic Ladies': 3,
  'SOLEURE': 8,
  'Sportiva': 4,
  'Stella': 6,
  'Valais Gents': 4,
  'Valais Ladies': 6,
  'Venus Diamond': 8
};

const excelPath = path.join(__dirname, '..', 'Roamer AW25 Price list.xlsx');
const workbook = XLSX.readFile(excelPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { range: 7 });

function mapToOfficialCollection(familyDescription) {
  if (!familyDescription) return null;

  const desc = String(familyDescription).trim();
  const lowerDesc = desc.toLowerCase();

  // Map patterns to official collections
  if (lowerDesc.includes('allegra')) return 'Allegra';
  if (lowerDesc.includes('cassandra')) return 'Cassandra Diamond';
  if (lowerDesc.includes('classico gents')) return 'Classico Gents';
  if (lowerDesc.includes('classico ladies')) return 'Classico Ladies';
  if (lowerDesc.includes('competence skeleton')) return 'Competence Skeleton IV';
  if (lowerDesc.includes('deep sea 200 automatic')) return 'Deep Sea Automatic';
  if (lowerDesc.includes('deep sea 200 ladies') || lowerDesc.includes('deep sea ladies')) return 'Deep Sea 200 Ladies';
  if (lowerDesc.includes('deep sea 200')) return 'Deep Sea 200';
  if (lowerDesc.includes('dreamline')) return 'SOLEURE'; // Dreamline might be SOLEURE
  if (lowerDesc.includes('elegance diamond')) return 'Elegance Diamond';
  if (lowerDesc.includes('eleganza')) return 'Eleganza';
  if (lowerDesc.includes('elite boxed')) return 'Premier'; // Elite might be Premier
  if (lowerDesc.includes('eos classic')) return 'EOS Classic';
  if (lowerDesc.includes('gran sportivo')) return 'Gran Sportivo';
  if (lowerDesc.includes('helios')) return 'Helios Power';
  if (lowerDesc.includes('mechano')) return 'Mechano';
  if (lowerDesc.includes('mercury chrono')) return 'Mercury Chrono';
  if (lowerDesc.includes('montalbano gents')) return 'Montalbano Gents';
  if (lowerDesc.includes('montalbano ladies')) return 'Montalbano Ladies';
  if (lowerDesc.includes('olivia')) return 'Olivia Diamond';
  if (lowerDesc.includes('premier')) return 'Premier';
  if (lowerDesc.includes('primeline')) return 'Premier Skeleton';
  if (lowerDesc.includes('pro auto skeleton')) return 'Pro Auto 42mm';
  if (lowerDesc.includes('pro chrono')) return 'Pro Chrono';
  if (lowerDesc.includes('pro diver')) return 'Pro Diver 200';
  if (lowerDesc.includes('r-line classic')) return 'R-Line Classic';
  if (lowerDesc.includes('r8 gents')) return 'R8 Gents';
  if (lowerDesc.includes('r8 ladies')) return 'R8 Ladies';
  if (lowerDesc.includes('rockshell')) return 'Rockshell Mark III Scuba';
  if (lowerDesc.includes('scala')) return 'Scala';
  if (lowerDesc.includes('searock automatic')) return 'Deep Sea Automatic'; // Might be Deep Sea Automatic
  if (lowerDesc.includes('searock master')) return 'Searock Master';
  if (lowerDesc.includes('slim-line classic') && lowerDesc.includes('ladies')) return 'Slim-Line Classic Ladies';
  if (lowerDesc.includes('slimline classic') && lowerDesc.includes('ladies')) return 'Slim-Line Classic Ladies';
  if (lowerDesc.includes('slim-line classic') || lowerDesc.includes('slimline classic')) return 'Slim-Line Classic Gents';
  if (lowerDesc.includes('stella')) return 'Stella';
  if (lowerDesc.includes('valais gents')) return 'Valais Gents';
  if (lowerDesc.includes('valais ladies')) return 'Valais Ladies';
  if (lowerDesc.includes('venus')) return 'Venus Diamond';

  return 'UNKNOWN';
}

// Map watches to official collections
const collectionMap = new Map();

// Initialize all official collections
Object.keys(officialCollections).forEach(name => {
  collectionMap.set(name, []);
});

// Add unknown collection
collectionMap.set('UNKNOWN', []);

data.forEach((row, index) => {
  const familyDesc = row['Family'];
  if (!familyDesc) return;

  const collectionName = mapToOfficialCollection(familyDesc);

  if (collectionName) {
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
console.log('ROAMER OFFICIAL COLLECTIONS MAPPING');
console.log('═══════════════════════════════════════════\n');

const collections = Array.from(collectionMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

let totalMapped = 0;
let mismatchCount = 0;

collections.forEach(([collectionName, watches], index) => {
  const expected = officialCollections[collectionName] || 0;
  const actual = watches.length;
  const status = expected === actual ? '✅' : (collectionName === 'UNKNOWN' ? '❓' : '⚠️');

  if (expected !== actual && collectionName !== 'UNKNOWN') {
    mismatchCount++;
  }

  if (watches.length > 0) {
    console.log(`${status} ${collectionName}`);
    console.log(`   Expected: ${expected}, Found: ${actual}`);
    if (watches.length <= 3) {
      watches.forEach(w => {
        console.log(`   - ${w.styleNumber}: ${w.familyDesc}`);
      });
    } else {
      console.log(`   - ${watches[0].styleNumber}: ${watches[0].familyDesc}`);
      console.log(`   - ... (${watches.length - 1} more)`);
    }
    console.log('');
  }

  totalMapped += watches.length;
});

console.log('═══════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════\n');
console.log(`Total watches mapped: ${totalMapped}`);
console.log(`Total in Excel: ${data.length}`);
console.log(`Collections with mismatches: ${mismatchCount}`);
console.log(`Unknown watches: ${collectionMap.get('UNKNOWN').length}`);
console.log('');

// Save the reorganized data
const reorganizedData = {
  brand: 'Roamer',
  totalCollections: Object.keys(officialCollections).length,
  totalWatches: totalMapped,
  collections: Array.from(collectionMap.entries())
    .filter(([name]) => name !== 'UNKNOWN')
    .map(([name, watches]) => ({
      name,
      count: watches.length,
      expectedCount: officialCollections[name] || 0,
      watches: watches.map(w => ({
        styleNumber: w.styleNumber,
        description: w.familyDesc,
        rrp: w.rrp,
        cost: w.cost
      }))
    }))
};

fs.writeFileSync(
  path.join(__dirname, 'roamer-collections-reorganized.json'),
  JSON.stringify(reorganizedData, null, 2)
);

console.log('✓ Reorganized collection data saved to: roamer-collections-reorganized.json\n');
