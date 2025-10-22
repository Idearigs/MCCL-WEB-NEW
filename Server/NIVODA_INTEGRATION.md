# Nivoda Integration Documentation

## Overview

This project includes integration with Nivoda's diamond API to provide dynamic diamond specifications and pricing on product detail pages.

## Features

✅ **Dynamic Diamond Specifications**
- Stone Type selection (Natural/Lab-Grown)
- Carat weight options
- Clarity grades (VS, VVS, IF, etc.)
- Color grades (D-E, F-G, H-I, etc.)
- Cut quality (Good, Very Good, Excellent)
- Certificate information (GIA, IGI, etc.)

✅ **Automatic Price Updates**
- Product prices update automatically based on current diamond prices from Nivoda
- Metal prices (if supported by Nivoda API)
- Configurable price markup for ring settings and labor

✅ **Admin Panel Controls**
- Enable/disable Nivoda integration per product
- Toggle visibility of each diamond specification field
- Set certificate information

## Setup Instructions

### 1. Get Nivoda API Credentials

1. Sign up for a Nivoda account at [https://www.nivoda.net](https://www.nivoda.net)
2. Navigate to your account settings
3. Generate API credentials (API Key and API Secret)
4. Save these credentials securely

### 2. Configure Environment Variables

Add the following variables to your `.env` file in the Server directory:

```env
# Nivoda API Configuration
NIVODA_API_URL=https://api.nivoda.net/graphql
NIVODA_API_KEY=your_api_key_here
NIVODA_API_SECRET=your_api_secret_here
```

### 3. Test the Connection

Run the test script to verify your Nivoda API credentials:

```bash
cd Server
node scripts/test-nivoda-connection.js
```

## Using Nivoda Integration

### Enable for a Product

1. Log in to the admin panel
2. Edit a product or create a new one
3. Navigate to the **Nivoda Integration** tab
4. Toggle "Enable Nivoda Integration" to ON
5. Select which diamond specifications to display:
   - Show Stone Type (Natural/Lab-Grown)
   - Show Carat Weight Options
   - Show Clarity Options
   - Show Colour Options
   - Show Cut Quality Options
   - Show Certificate Information
6. If showing certificate, enter the certificate authority (e.g., "GIA", "IGI")
7. Save the product

### Frontend Display

When a product has Nivoda integration enabled, customers will see a "YOUR STONE" section on the product detail page with:

- Interactive selectors for each enabled specification
- Real-time price updates based on selections
- Collapsible sections for each specification
- Certificate information display

## API Service Methods

### `nivodaService.searchDiamonds(filters)`

Search for diamonds matching specific criteria.

**Parameters:**
```javascript
{
  stoneType: 'natural' | 'lab_grown',
  caratFrom: number,
  caratTo: number,
  clarity: Array<string>,
  color: Array<string>,
  cut: Array<string>,
  shapes: Array<string>
}
```

**Returns:** Array of matching diamonds with pricing

### `nivodaService.getDiamondPrice(diamondId)`

Get current price for a specific diamond by ID.

### `nivodaService.getMetalPrices()`

Get current metal prices (Gold, Platinum, Silver) if supported.

### `nivodaService.calculateProductPrice(product, selections)`

Calculate total product price based on diamond + metal + markup.

**Parameters:**
```javascript
{
  stoneType: string,
  carat: number,
  clarity: string,
  color: string,
  cut: string,
  shape: string,
  metalType: string,
  metalWeight: number
}
```

**Returns:**
```javascript
{
  diamondPrice: number,
  metalCost: number,
  markup: number,
  totalPrice: number,
  currency: string,
  diamond: Object
}
```

## Automatic Price Updates

The system includes a cron job that automatically updates prices for all Nivoda-enabled products:

- Runs daily at 2:00 AM
- Fetches latest prices from Nivoda API
- Updates product prices in the database
- Logs all price changes for audit trail

To manually trigger a price update:

```bash
cd Server
node scripts/update-nivoda-prices.js
```

## Database Schema

### Products Table (Nivoda Fields)

| Column | Type | Description |
|--------|------|-------------|
| `nivoda_enabled` | BOOLEAN | Whether Nivoda integration is enabled |
| `show_stone_type` | BOOLEAN | Display stone type selector |
| `show_carat` | BOOLEAN | Display carat options |
| `show_clarity` | BOOLEAN | Display clarity options |
| `show_colour` | BOOLEAN | Display color options |
| `show_cut` | BOOLEAN | Display cut options |
| `show_certificate` | BOOLEAN | Display certificate info |
| `certificate` | VARCHAR(255) | Certificate authority/number |

## Troubleshooting

### "Nivoda API credentials are not configured"

**Solution:** Ensure you have set `NIVODA_API_KEY` and `NIVODA_API_SECRET` in your `.env` file.

### "No matching diamonds found"

**Solution:** The search criteria may be too restrictive. Try broadening the carat range or adjusting clarity/color filters.

### "Authentication failed"

**Solution:**
1. Verify your API credentials are correct
2. Check if your Nivoda account is active
3. Ensure you have API access enabled in your Nivoda account settings

### Price Updates Not Working

**Solution:**
1. Check if the cron job is running: `pm2 list`
2. Review cron job logs: `pm2 logs nivoda-price-updater`
3. Manually run the update script to see detailed error messages

## API Rate Limits

Nivoda API has rate limits. The service includes:
- Automatic retry with exponential backoff
- Request caching (30-minute TTL)
- Batch processing for price updates

**Recommended limits:**
- Search requests: Max 100/minute
- Price updates: Process in batches of 50 products
- Use caching to reduce API calls

## Support

For Nivoda API support:
- Documentation: [https://api-docs.nivoda.net](https://api-docs.nivoda.net)
- Support Email: support@nivoda.net

For implementation support:
- Review the service file: `Server/services/nivodaService.js`
- Check admin panel implementation: `Client/src/admin/components/ProductFormModal.tsx`
- Frontend display: `Client/src/pages/ProductDetail.tsx`
