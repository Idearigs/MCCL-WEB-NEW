# Metal/Material Variations Feature - Implementation Guide

## Overview
This document outlines the implementation of metal-specific media (images/videos) in the product management system. This allows admins to:
1. Select which metals are available for a product
2. Upload separate images/videos for each metal variation
3. Allow customers to switch between metals and see different images for each

## Database Changes ✅ COMPLETED

### Models Updated:
- **ProductImage**: Added optional `metal_id` field (lines 352-360 in models/index.js)
- **ProductVideo**: Added optional `metal_id` field (lines 397-405 in models/index.js)
- **Relationships**: Added metal-specific relationships for images and videos

## Frontend Changes - STEP BY STEP

### Phase 1: Admin Form - Metals Management UI

#### Location: `Client/src/admin/components/ProductFormModal.tsx`

**Step 1: Enhance ProductFormData Interface**
```typescript
// ADD to ProductFormData interface around line 26
selectedMetals: Array<{
  metalId: string;
  metalName: string;
  images: Array<{ file: File | null; url: string; alt_text: string; metalId: string }>;
  videos: Array<{ file: File | null; url: string; title: string; metalId: string }>;
}>;
```

**Step 2: Initialize Selected Metals State**
```typescript
// In formData initialization (around line 118), ADD:
selectedMetals: [],
```

**Step 3: Create Metals Management Tab Content**

Add this after the 'media' tab rendering (around line 1060), before closing the tabs section:

```typescript
{activeTab === 'metals' && (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">
        Available Metals for this Product
      </h3>
      <p className="text-sm text-gray-600 mb-4 font-satoshi">
        Select which metals this product is available in. You can then upload different images/videos for each metal.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {metals.map((metal) => (
          <label key={metal.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.metal_ids.includes(metal.id)}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  metal_ids: e.target.checked
                    ? [...prev.metal_ids, metal.id]
                    : prev.metal_ids.filter(id => id !== metal.id)
                }));
              }}
              className="w-4 h-4 rounded border-gray-300"
            />
            <div className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: metal.color_code || '#cccccc' }}
                title={metal.color_code}
              />
              <span className="text-sm font-satoshi">{metal.name}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  </div>
)}
```

**Step 4: Update Tabs Array**

Find the tabs array (around line 395) and add 'metals' tab:
```typescript
const tabs = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'metals', label: 'Metals' },  // ADD THIS LINE
  { id: 'media', label: 'Media' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'inventory', label: 'Inventory' }
];
```

### Phase 2: Update Media Tab for Metal-Specific Uploads

#### Location: `Client/src/admin/components/ProductFormModal.tsx`

Replace the Media tab section (lines 811-1100) with enhanced version that shows metal-specific sections:

```typescript
{activeTab === 'media' && (
  <div className="space-y-6">
    {formData.metal_ids.length === 0 ? (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500 font-satoshi">No metals selected yet</p>
        <p className="text-sm text-gray-400 font-satoshi mb-3">
          Go to the <strong>Metals</strong> tab to select metals for this product first
        </p>
      </div>
    ) : (
      <>
        {/* General Images Section (applicable to all metals) */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-blue-900 font-cormorant mb-2">
              General Product Images (All Metals)
            </h3>
            <p className="text-sm text-blue-700 font-satoshi">
              Upload images that apply to all metal variations. Metal-specific images can be added below.
            </p>
          </div>

          {/* Current image upload UI here - keep existing code */}
          {/* Upload buttons and image grid from original implementation */}
        </div>

        {/* Metal-Specific Images Section */}
        <div className="space-y-6 border-t pt-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 font-cormorant mb-4">
              Metal-Specific Images
            </h3>

            {formData.metal_ids.map((metalId) => {
              const metal = metals.find(m => m.id === metalId);
              if (!metal) return null;

              return (
                <div key={metalId} className="border border-gray-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: metal.color_code || '#cccccc' }}
                    />
                    <h4 className="font-medium text-gray-900 font-satoshi">{metal.name} Images</h4>
                  </div>

                  {/* Image upload UI for this metal */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg cursor-pointer w-fit mb-3 font-satoshi">
                      <Upload className="h-4 w-4" />
                      <span>Upload Images for {metal.name}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          // Handle metal-specific image uploads
                          // Save to formData.selectedMetals[metalId].images
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Display uploaded images for this metal */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Render images specific to this metal */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}
  </div>
)}
```

### Phase 3: Backend API Updates

#### Location: `Server/controllers/adminProductController.js`

**Update createProduct function to handle metal_id in images:**

```javascript
// When creating product images, include metal_id:
const imageData = {
  product_id: product.id,
  metal_id: image.metal_id || null,  // Add this
  image_url: imageUrl,
  alt_text: image.alt_text,
  is_primary: index === 0
};
```

**Update addProductImage endpoint:**
```javascript
router.post('/products/:id/images', async (req, res) => {
  const { image_url, alt_text, metal_id } = req.body;
  // metal_id parameter allows linking image to specific metal
});
```

### Phase 4: Frontend Product Detail Page

#### Location: `Client/src/pages/ProductDetail.tsx`

**Add Metal Selector Component:**

```typescript
// After loading the product, add:
const [selectedMetal, setSelectedMetal] = useState<string | null>(null);

// In the product details rendering, add before images section:
{product.metals && product.metals.length > 0 && (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-900 mb-3 font-satoshi">
      Select Metal/Material
    </h3>
    <div className="flex flex-wrap gap-2">
      {product.metals.map((metal: any) => (
        <button
          key={metal.id}
          onClick={() => setSelectedMetal(metal.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
            selectedMetal === metal.id
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white text-gray-900 hover:border-gray-900'
          }`}
        >
          <div
            className="w-4 h-4 rounded-full border border-current"
            style={{ backgroundColor: metal.color_code }}
          />
          <span className="font-satoshi text-sm">{metal.name}</span>
        </button>
      ))}
    </div>
  </div>
)}

// Filter images/videos based on selected metal:
const displayImages = selectedMetal
  ? product.images.filter((img: any) => img.metal_id === selectedMetal)
  : product.images.filter((img: any) => !img.metal_id); // Show general images by default
```

## Implementation Order

1. ✅ Database: Add metal_id fields to ProductImage and ProductVideo
2. ⏳ Admin Form: Add Metals selection tab
3. ⏳ Admin Form: Enhance Media tab for metal-specific uploads
4. ⏳ Backend API: Update image/video endpoints to accept metal_id
5. ⏳ Frontend: Add metal selector to product detail page
6. ⏳ Frontend: Filter and display metal-specific images

## Key Files to Modify

| File | Changes |
|------|---------|
| `Server/models/index.js` | ✅ Add metal_id fields |
| `Client/src/admin/components/ProductFormModal.tsx` | ⏳ Add metals tab & metal-specific media |
| `Server/controllers/adminProductController.js` | ⏳ Handle metal_id in image/video creation |
| `Client/src/pages/ProductDetail.tsx` | ⏳ Add metal selector & filtering |
| `Server/routes/adminProductRoutes.js` | ⏳ Update endpoints if needed |

## UI/UX Design

### Metal Selector (Product Detail):
```
Select Metal/Material:
┌────────────┐  ┌────────────┐  ┌────────────┐
│ ◯ Rose Gold│  │ ◯ White Gold│ │ ◯ Platinum │
└────────────┘  └────────────┘  └────────────┘
```

### Metal-Specific Images in Admin:
```
Metal-Specific Images

┌─────────────────────────────────┐
│ ◯ Rose Gold Images              │
│ [Upload Images] [Upload Videos]  │
│ [Image 1] [Image 2] [Image 3]   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ◯ White Gold Images             │
│ [Upload Images] [Upload Videos]  │
│ [Image 1] [Image 2]              │
└─────────────────────────────────┘
```

## Database Structure
```
products
├── id
├── name
├── metal_ids (JSON array of metal IDs)
└── ...

product_images
├── id
├── product_id
├── metal_id (optional - links to specific metal)
├── image_url
└── ...

product_videos
├── id
├── product_id
├── metal_id (optional - links to specific metal)
├── video_url
└── ...

product_metals
├── id
├── name (Rose Gold, White Gold, etc.)
├── color_code (#FFD700, etc.)
└── ...
```

## Notes

- If an image has no metal_id, it's displayed for all metals
- If an image has a metal_id, it's only displayed when that metal is selected
- General images should be shown alongside metal-specific images
- Metal color codes should be displayed as visual indicators for better UX

