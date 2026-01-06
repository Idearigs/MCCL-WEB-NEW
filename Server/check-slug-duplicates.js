const fs = require('fs');
const path = require('path');

const collectionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'briston-collections-extracted.json'), 'utf8')
);

function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const failedSKUs = [
  '21536.SA.UB.25.NIB',
  '21536.SA.UB.33.NMB',
  '21536.SA.UBR.30.NT',
  '21536.SA.UG.26.NOL',
  '21536.SA.UGW.29.NGW',
  '17536.SA.T.1.NB',
  '17536.SA.T.2.NT',
  '15140.SA.T.10.NBG',
  '19140.SA.T.25.NIB',
  '19140.SA.T.30.NT',
  '20140.PYA.T.38.NTC',
  '20140.PYAT.37.NTCH',
  '20140.SA.T.37.NTCH',
  '20140.SA.T.38.NTC',
  '19140.PYA.T.26.NOL',
  '19140.SA.T.26.NOL'
];

console.log('═══════════════════════════════════════════');
console.log('ANALYZING SLUG GENERATION FOR FAILED SKUS');
console.log('═══════════════════════════════════════════\n');

// Collect all watches with their slugs
const allWatchesWithSlugs = [];
collectionsData.collections.forEach(collection => {
  collection.watches.forEach(watch => {
    const slug = createSlug(watch.description || watch.styleNumber);
    allWatchesWithSlugs.push({
      sku: watch.styleNumber,
      description: watch.description,
      slug: slug,
      isFailed: failedSKUs.includes(watch.styleNumber)
    });
  });
});

// Find duplicate slugs
const slugMap = new Map();
allWatchesWithSlugs.forEach(watch => {
  if (!slugMap.has(watch.slug)) {
    slugMap.set(watch.slug, []);
  }
  slugMap.get(watch.slug).push(watch);
});

const duplicateSlugs = Array.from(slugMap.entries())
  .filter(([slug, watches]) => watches.length > 1);

console.log('DUPLICATE SLUGS FOUND:\n');

duplicateSlugs.forEach(([slug, watches]) => {
  const hasFailedWatch = watches.some(w => w.isFailed);

  if (hasFailedWatch) {
    console.log(`🔴 SLUG: "${slug}" (${watches.length} watches - HAS FAILED IMPORTS)`);
  } else {
    console.log(`SLUG: "${slug}" (${watches.length} watches)`);
  }

  watches.forEach((watch, i) => {
    const marker = watch.isFailed ? '❌ FAILED' : '✓ Success';
    console.log(`  ${i + 1}. [${marker}] ${watch.sku}`);
    console.log(`     ${watch.description}`);
  });
  console.log('');
});

console.log('═══════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════\n');
console.log(`Total watches: ${allWatchesWithSlugs.length}`);
console.log(`Duplicate slug groups: ${duplicateSlugs.length}`);
console.log(`Failed SKUs with duplicate slugs: ${duplicateSlugs.filter(([slug, watches]) => watches.some(w => w.isFailed)).length}`);
console.log('');
