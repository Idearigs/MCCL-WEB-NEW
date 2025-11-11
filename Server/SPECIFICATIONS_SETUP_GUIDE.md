# Watch Specifications System - Setup Guide

This guide explains the technical specifications system for watches and how to set it up in your development environment.

## Overview

The watch specifications system now supports comprehensive technical details for luxury watches. All watch brands (Festina, Briston, Roamer) can store detailed specifications organized by categories:

- **Case**: Shape, Material, Weight, Diameter, Thickness
- **Dial**: Colour, Crystal Type, Number of Hands
- **Strap**: Material, Colour, Width, Clasp Type
- **Movement**: Name, Type, Battery Type, Manufacturing Details
- **Functions**: Special functions (Chronograph, Calendar, etc.)
- **Features**: Additional features and watertightness

## Quick Start

### 1. Run Database Migration

The 500 error when fetching watch details is caused by missing database columns. Run the migration to add the new specification fields:

```bash
cd Server
npm run migrate:run
```

This will automatically add all required columns to the `watch_specifications` table.

### 2. Restart the Server

```bash
npm run dev
```

The server should now connect without database schema errors.

### 3. Update a Watch in Admin Panel

1. Go to Admin Panel → Watch Management
2. Click "Edit" on any watch
3. Scroll down to "Technical Specifications"
4. Fill in the specification details for your watch brand
5. Click "Save"

All specifications will be saved to the database and displayed on the product detail page.

## Database Schema Changes

### New Columns Added to `watch_specifications` Table

| Column | Type | Purpose |
|--------|------|---------|
| `case_shape` | VARCHAR(100) | Case shape (Round, Square, etc.) |
| `case_weight` | VARCHAR(50) | Watch case weight |
| `dial_colour` | VARCHAR(100) | Dial colour |
| `dial_crystal` | VARCHAR(100) | Crystal type on dial |
| `dial_hands_count` | VARCHAR(50) | Number of hands |
| `strap_width` | VARCHAR(50) | Strap width specification |
| `movement_name` | VARCHAR(100) | Specific movement name |
| `movement_battery_type` | VARCHAR(100) | Battery type |
| `movement_manufacturing` | VARCHAR(255) | Manufacturing details |
| `additional_features` | TEXT | Extra features |
| `watertightness` | VARCHAR(100) | Watertightness rating |

## How Specifications Are Stored

When an admin saves watch specifications, the form sends nested data:

```javascript
{
  technical_specs: {
    case: { shape, weight, diameter, material, thickness },
    dial: { colour, crystal, number_of_hands },
    strap: { material, width, colour, clasp_type },
    movement: { name, type, battery_type, manufacturing },
    functions: { main_function, calendar, ... },
    features: { watertightness, additional_features }
  }
}
```

The backend **flattens** this structure and stores it in the database:

```sql
UPDATE watch_specifications SET
  case_shape = 'Round',
  case_weight = '45g',
  dial_colour = 'Blue',
  movement_name = 'ETA 2824',
  ...
WHERE watch_id = 'uuid-here'
```

## How Specifications Are Displayed

The frontend displays specifications based on **brand-specific configuration**:

### Festina Watches
Shows: Case, Dial, Strap, Movement, Functions, Features

### Briston Watches
Shows: Movement, Case, Dial & Hands, Strap

### Roamer Watches
Shows: Movement, Water Resistance, Antimagnetic Protection, Shock Resistance, Luminosity, Movement Accuracy

## Troubleshooting

### Error: "500 Internal Server Error" when fetching watch details

**Cause**: Database schema doesn't have the new specification columns yet.

**Solution**:
```bash
cd Server
npm run migrate:run
npm run dev
```

### Error: "Watch not found" when clicking Edit

**Cause**: The admin endpoint needs the database to be synced.

**Solution**: Ensure migration has been run (see above).

### Specifications not saving

**Possible causes**:
1. Database connection issue - check `PG_HOST`, `PG_PORT`, `PG_USERNAME`, `PG_PASSWORD` in `.env`
2. Migration hasn't been run - run `npm run migrate:run`
3. Form validation error - check browser console for details

**Solution**:
```bash
# Check database connection
npm run check-db

# Run migration
npm run migrate:run

# Restart server
npm run dev
```

## Migration Commands

| Command | Purpose |
|---------|---------|
| `npm run migrate:run` | Run all pending migrations (UP) |
| `npm run migrate:rollback` | Rollback all migrations (DOWN) |
| `npm run sync-db` | Sync database schema using ALTER (existing method) |
| `npm run sync-db:force` | Drop and recreate all tables (destructive!) |

## Development Workflow

### Option 1: Using Migrations (Recommended)

1. Start fresh or update existing database with migrations
2. Run: `npm run migrate:run`
3. Run: `npm run dev`

### Option 2: Using Full Sync

For development only (loses data):

```bash
cd Server
SYNC_DATABASE=true npm run dev
```

This will automatically sync schema on startup and clear all data.

## API Endpoints

### Admin - Get Watch Details
```
GET /api/v1/watches/admin/{watchId}
Returns: Watch with all specifications
```

### Admin - Update Watch
```
PUT /api/v1/watches/{watchId}
Body: { ...watchData, technical_specs: {...} }
Saves: All specifications to database
```

### Public - Get Watch Details
```
GET /api/v1/watches/{watchSlug}
Returns: Watch with specifications formatted for display
```

## File Structure

```
Server/
├── migrations/
│   └── add-watch-spec-fields.js    # Migration file
├── run-migrations.js               # Migration runner
├── models/
│   └── watchModels.js              # Updated WatchSpecification model
├── controllers/
│   └── watchController.js          # Updated flattening logic
└── package.json                    # Updated npm scripts

Client/
└── src/pages/
    └── WatchDetail.tsx             # Updated specification display
```

## Next Steps

1. **Run Migration**: `npm run migrate:run`
2. **Restart Server**: `npm run dev`
3. **Test in Admin**: Go to Admin → Watches → Edit any watch
4. **Verify on Frontend**: Check that specifications display correctly

## Support

If you encounter issues:

1. Check server logs for errors
2. Verify database connection with: `npm run check-db`
3. Ensure all migrations are run: `npm run migrate:run`
4. Check that browser console shows no TypeScript errors

For detailed technical information about the flattening logic, see the comments in `controllers/watchController.js` lines 937-1053.
