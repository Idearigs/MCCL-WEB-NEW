# Watch Management Form - Enhancement Plan

## Status: READY FOR IMPLEMENTATION ✅

Database tables have been updated with:
- ✅ `technical_specs` JSONB column added to watches table
- ✅ `watch_videos` table created for video management
- ✅ Relationships configured between Watch and WatchVideo models

## Required Form Enhancements

### 1. Collection Selection
- **Status**: Missing from current form
- **Required**: Add dropdown to select collection based on selected brand
- **Implementation**: Add to watchForm state and API

### 2. Image Upload
- **Status**: Missing from current form
- **Required**: File input for multiple watch images
- **Implementation**:
  - Add file input with preview
  - Upload to `/api/admin/watches/{id}/images`
  - Support: product, lifestyle, detail, packaging image types

### 3. Video Upload
- **Status**: Missing from current form
- **Required**: Support for YouTube, Vimeo, or MP4/WebM uploads
- **Implementation**:
  - Video URL input for YouTube/Vimeo
  - File upload for MP4/WebM
  - Store in watch_videos table

### 4. Brand-Specific Technical Specs

#### ROAMER Brand Technical Specs
```javascript
{
  waterResistance: "5 ATM (50m)",        // Expandable section
  antimagneticProtection: "Yes/No",      // Checkbox
  shockResistance: "Yes/No",             // Checkbox
  luminosity: "Yes/No",                  // Checkbox
  movementAccuracy: "±15 seconds/month", // Text input
  skinCompatibility: "Yes/No"            // Checkbox
}
```

#### BRISTON Brand Technical Specs (Tabbed Interface)
```javascript
{
  movement: {
    quartz_calibre: "Miyota OS21",      // Text
    functions: "2-counter Chronograph & Date", // Text
    counter_60_position: "9 o'clock",   // Text
    counter_24_position: "3 o'clock",   // Text
    date_position: "6 o'clock",         // Text
    power_reserve: "3-5 years"          // Text
  },
  case: {
    material: "Stainless Steel",        // Select
    thickness: "6.65 mm",               // Text with unit
    shape: "Round",                     // Select
    diameter: "26 mm",                  // Text with unit
    weight: "46.32 g"                   // Text with unit
  },
  dial_and_hands: {
    colour: "Nacre",                    // Text
    crystal: "Sapphire",                // Select
    number_of_hands: "2"                // Number
  },
  strap: {
    material: "Stainless Steel",        // Select
    colour: "Silver",                   // Text
    width: "12 mm",                     // Text with unit
    clasp_type: "Double Pusher"         // Text
  }
}
```

#### FESTINA Brand Technical Specs (Categorized Sections)
```javascript
{
  case: {
    material: "Stainless Steel",        // Select
    thickness: "6.65 mm",               // Text with unit
    shape: "Round",                     // Select
    diameter: "26 mm",                  // Text with unit
    weight: "46.32 g"                   // Text with unit
  },
  dial: {
    colour: "Nacre",                    // Text
    crystal: "Sapphire",                // Select
    number_of_hands: "2"                // Number
  },
  strap: {
    material: "Stainless Steel",        // Select
    colour: "Silver",                   // Text
    width: "12 mm",                     // Text with unit
    clasp_type: "Double Pusher"         // Text
  },
  movement: {
    type: "Quartz",                     // Text
    name: "Miyota GI22",                // Text
    manufacturing: "Japan",             // Select
    battery_type: "Sr621sw"             // Text
  },
  functions: {
    main_function: "Hours And Minutes", // Text
    calendar: "No"                      // Yes/No
  },
  features: {
    watertightness: "5 ATM",            // Text
    additional_features: ""             // Text
  }
}
```

## Form Component Structure

```typescript
interface WatchFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingWatch?: Watch | null;
  onSave: (data: any) => Promise<void>;
}

// Sections:
1. Basic Info (name, model, brand, collection, price, sku)
2. Description & Care
3. Images (upload/manage)
4. Videos (upload/manage)
5. Specifications (gender, type, style, warranty)
6. Brand-Specific Technical Specs (dynamic based on brand selection)
7. Inventory (stock quantity)
```

## Implementation Order

1. ✅ Database schema updated
2. ⏳ Enhance AdminWatches component:
   - Add collection selection dropdown
   - Add conditional rendering of technical specs based on brand
3. ⏳ Create image upload section
4. ⏳ Create video upload section
5. ⏳ Add brand-specific spec form sections
6. ⏳ Update watch controller API endpoints to handle images/videos
7. ⏳ Test full workflow

## API Endpoints Required

```
POST   /api/admin/watches                    - Create watch
PUT    /api/admin/watches/:id                - Update watch
POST   /api/admin/watches/:id/images         - Upload images
DELETE /api/admin/watches/:id/images/:imgId  - Delete image
POST   /api/admin/watches/:id/videos         - Upload videos
DELETE /api/admin/watches/:id/videos/:vidId  - Delete video
GET    /api/admin/watch-brands               - Get all brands
GET    /api/admin/watch-brands/:id/collections - Get brand collections
```

## UI Components Needed

1. **FileUpload Component**
   - Multiple file selection
   - Preview
   - Progress indicator
   - Delete functionality

2. **ImageGallery Component**
   - Display uploaded images
   - Set primary image
   - Reorder images
   - Delete images

3. **TechnicalSpecsForm Component**
   - Dynamic form based on brand
   - Tabs for Briston (Movement, Case, Dial, Strap)
   - Sections for Festina (Case, Dial, Strap, Movement, Functions, Features)
   - Simple fields for Roamer

4. **BrandSelector Component**
   - Dropdown with brand list
   - Shows brand details/logo

5. **CollectionSelector Component**
   - Filtered by selected brand
   - Shows collection details

## Notes

- All technical specs stored as JSONB in `watches.technical_specs` column
- Images stored via WatchImage model
- Videos stored via WatchVideo model
- Admin should see only relevant technical spec fields based on brand
- Form should validate that all required fields are filled before save
