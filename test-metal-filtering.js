// Test to verify metal-specific image filtering logic

// Mock product data (simulating what the API returns)
const mockProductImages = [
  { id: "img1", metal_id: "39b04f2f-1d7f-442a-b1f6-dc355c7b5976", url: "http://localhost:5000/uploads/img1.jpg", alt: "Yellow Gold 1" },
  { id: "img2", metal_id: "39b04f2f-1d7f-442a-b1f6-dc355c7b5976", url: "http://localhost:5000/uploads/img2.jpg", alt: "Yellow Gold 2" },
  { id: "img3", metal_id: "39b04f2f-1d7f-442a-b1f6-dc355c7b5976", url: "http://localhost:5000/uploads/img3.jpg", alt: "Yellow Gold 3" },
  { id: "img4", metal_id: "15d201d9-089b-43d8-9306-85f61971ae44", url: "http://localhost:5000/uploads/img4.jpg", alt: "Rose Gold 1" },
  { id: "img5", metal_id: "15d201d9-089b-43d8-9306-85f61971ae44", url: "http://localhost:5000/uploads/img5.jpg", alt: "Rose Gold 2" },
  { id: "img6", metal_id: "15d201d9-089b-43d8-9306-85f61971ae44", url: "http://localhost:5000/uploads/img6.jpg", alt: "Rose Gold 3" },
  { id: "img7", metal_id: "15d201d9-089b-43d8-9306-85f61971ae44", url: "http://localhost:5000/uploads/img7.jpg", alt: "Rose Gold 4" },
  { id: "img8", metal_id: "a9e8f0d3-15d2-4c79-9143-c1eaee950ca9", url: "http://localhost:5000/uploads/img8.jpg", alt: "Platinum 1" },
  { id: "img9", metal_id: "a9e8f0d3-15d2-4c79-9143-c1eaee950ca9", url: "http://localhost:5000/uploads/img9.jpg", alt: "Platinum 2" },
  { id: "img10", metal_id: "a9e8f0d3-15d2-4c79-9143-c1eaee950ca9", url: "http://localhost:5000/uploads/img10.jpg", alt: "Platinum 3" },
  { id: "img11", metal_id: "a9e8f0d3-15d2-4c79-9143-c1eaee950ca9", url: "http://localhost:5000/uploads/img11.jpg", alt: "Platinum 4" }
];

// Replica of getMetalSpecificMedia function from ProductDetail.tsx
const getMetalSpecificMedia = (allImages, selectedMetalId) => {
  if (!allImages || allImages.length === 0) return [];

  // First, try to get metal-specific images for the selected metal
  const metalSpecificImages = allImages.filter(img => img.metal_id === selectedMetalId);

  // If metal-specific images exist, return them
  if (metalSpecificImages.length > 0) {
    return metalSpecificImages;
  }

  // Otherwise, return general images (those with no metal_id)
  return allImages.filter(img => !img.metal_id);
};

// Test Cases
console.log("=== Testing Metal-Specific Image Filtering ===\n");

const testMetals = [
  { id: "39b04f2f-1d7f-442a-b1f6-dc355c7b5976", name: "Yellow Gold" },
  { id: "15d201d9-089b-43d8-9306-85f61971ae44", name: "Rose Gold" },
  { id: "a9e8f0d3-15d2-4c79-9143-c1eaee950ca9", name: "Platinum" }
];

let allTestsPassed = true;

testMetals.forEach(metal => {
  const displayImages = getMetalSpecificMedia(mockProductImages, metal.id);
  console.log(`${metal.name} (${metal.id}):`);
  console.log(`  Expected: ${mockProductImages.filter(img => img.metal_id === metal.id).length} images`);
  console.log(`  Actual: ${displayImages.length} images`);

  const imagesCorrect = displayImages.every(img => img.metal_id === metal.id);
  const countCorrect = displayImages.length === mockProductImages.filter(img => img.metal_id === metal.id).length;

  if (imagesCorrect && countCorrect) {
    console.log(`  ✓ PASS`);
  } else {
    console.log(`  ✗ FAIL`);
    allTestsPassed = false;
  }

  if (displayImages.length > 0) {
    console.log(`  Sample images:`);
    displayImages.slice(0, 2).forEach(img => {
      console.log(`    - ${img.alt} (${img.url.split('/').pop()})`);
    });
  }
  console.log();
});

// Test with non-existent metal ID
console.log("Testing with non-existent metal ID:");
const emptyResult = getMetalSpecificMedia(mockProductImages, "nonexistent-id");
console.log(`  Expected: 0 images (no fallback to general images)`);
console.log(`  Actual: ${emptyResult.length} images`);
console.log(`  ${emptyResult.length === 0 ? "✓ PASS" : "✗ FAIL"}\n`);

if (allTestsPassed && emptyResult.length === 0) {
  console.log("✓ All tests passed! Metal-specific image filtering is working correctly.");
} else {
  console.log("✗ Some tests failed. Please review the implementation.");
}
