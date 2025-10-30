# Nivoda API Testing Page - Complete Guide

## Overview
A dedicated testing page has been created to help you test and validate the Nivoda API integration with different diamond specifications and parameters.

## Access the Testing Page

**URL**: `http://localhost:3000/test/nivoda`

**Note**: This page is for development/testing only and accessible in development mode.

## Features

### 1. **Price Suggestions Testing**
Test the price suggestion API endpoint with different diamond specifications.

**What it does**:
- Sends a request to the Nivoda API with your selected specifications
- Returns: Minimum, Average, and Maximum prices
- Shows matching diamonds from Nivoda inventory
- Displays full API response in JSON format

**How to use**:
1. Select Carat weight (0.1 - 10.0)
2. Select Clarity grade (FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, SI3, I1, I2, I3)
3. Select Color/Colour (D through N)
4. Select Cut (EX, VG, G, F)
5. Click **"Get Price"** button

**Example Result**:
```
Starting from: £13,463
Average: £19,655
Up to: £31,678
Matching Diamonds: 5 found
```

---

### 2. **Search Diamonds**
Search for actual diamonds from Nivoda's inventory matching your specifications.

**What it does**:
- Searches Nivoda database with ±0.25 carat range
- Returns count of matching diamonds
- Shows real inventory diamonds available

**How to use**:
1. Set your diamond specifications
2. Click **"Search Diamonds"** button
3. View the count of matching diamonds in popup

**Example Result**:
```
Found 42 matching diamonds!
```

---

### 3. **Available Options**
View all valid options supported by Nivoda API.

**What it displays**:
- Valid Carat weights (0.5, 0.75, 1.0, 1.25, etc.)
- Valid Clarity grades
- Valid Color grades
- Valid Cut grades
- Stone types (Natural, Lab-Grown)

**How to use**:
1. Click **"Get Available Options"** button
2. View all valid options

**Important**: Always use these values! Invalid options will cause API errors.

---

## Valid Specification Values

### Clarity (GIA Standard)
- **FL** - Flawless
- **IF** - Internally Flawless
- **VVS1** - Very Very Slightly Included 1
- **VVS2** - Very Very Slightly Included 2
- **VS1** - Very Slightly Included 1
- **VS2** - Very Slightly Included 2
- **SI1** - Slightly Included 1
- **SI2** - Slightly Included 2
- **SI3** - Slightly Included 3
- **I1** - Included 1
- **I2** - Included 2
- **I3** - Included 3

### Color (GIA Standard)
- **D, E, F** - Colorless
- **G, H, I, J** - Near Colorless
- **K, L, M, N** - Faint

### Cut (Nivoda Grades)
- **EX** - Excellent
- **VG** - Very Good
- **G** - Good
- **F** - Fair

### Certificate (Optional)
- **GIA** - Gemological Institute of America (most trusted)
- **AGS** - American Gem Society
- **IGI** - International Gemological Institute
- **EGL** - European Gemological Laboratory
- **HRD** - Hoge Raad voor Diamanthandel
- **Any/All** - Leave blank to see all certificates

### Carat Range
- Minimum: 0.1
- Maximum: 10.0
- Common values: 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 5.0, 10.0

### Stone Types
- **Natural** - Mined diamonds
- **Lab-Grown** - Lab-created diamonds

---

## What the Test Results Mean

### Price Range Components

1. **Starting from (Minimum)**
   - The lowest price available for diamonds matching your specs
   - Usually lower quality within your specifications
   - May include diamonds without high-end certificates

2. **Average**
   - The typical/average price for your specifications
   - Most common price point
   - Recommended for pricing decisions
   - Influenced by certificate type selected

3. **Up to (Maximum)**
   - The highest price available for diamonds matching your specs
   - Usually premium quality within your specifications
   - Often GIA certified diamonds

### Certificate Information

When a certificate filter is applied:
- **GIA**: Usually highest prices (most trusted internationally)
- **AGS**: Competitive with GIA
- **IGI/EGL**: Mid-range pricing
- **HRD**: European standard
- **Any/All**: Shows mix of certified and uncertified

Each matched diamond displays:
- **Certificate Lab**: Who certified it (GIA, AGS, etc.)
- **Certificate Number**: Unique ID for the certificate

### Example Scenario
```
Specifications: 1.0 carat, VS1 clarity, E color, EX cut

Results:
- Starting from: £8,500 (decent quality)
- Average: £12,300 (typical market price)
- Up to: £18,900 (premium quality)
```

---

## Testing Scenarios

### Scenario 1: Popular Diamond (1 Carat, VS1, D Color, EX Cut)
```
Carat: 1.0
Clarity: VS1
Color: D
Cut: EX
Expected: High price, many matches
```

### Scenario 2: Budget Diamond (0.5 Carat, SI1, K Color, G Cut)
```
Carat: 0.5
Clarity: SI1
Color: K
Cut: G
Expected: Lower price, many matches
```

### Scenario 3: High-End Diamond (3.0 Carat, VVS1, D Color, EX Cut)
```
Carat: 3.0
Clarity: VVS1
Color: D
Cut: EX
Expected: Very high price, fewer matches
```

### Scenario 4: Test with GIA Certification
```
Carat: 1.0
Clarity: VS1
Color: D
Cut: EX
Certificate: GIA (Gemological Institute of America)
Expected: GIA certified diamonds, higher prices
```

### Scenario 5: Test Valid Grades
Click "Get Available Options" to see all valid combinations.

---

## Error Handling

### Common Errors

**Error: "Request failed with status code 500"**
- **Cause**: Invalid specification combination
- **Fix**: Use the "Get Available Options" button to verify valid values
- **Check**: Ensure cut is one of: EX, VG, G, F (NOT 8X!)

**Error: "No matching diamonds found"**
- **Cause**: Valid specs but no inventory
- **Fix**: Try different specifications
- **Note**: This is normal - just means that exact combo isn't in stock

**Error: "Failed to fetch options"**
- **Cause**: Nivoda API connectivity issue
- **Fix**: Check your internet connection
- **Check**: Verify Nivoda API is accessible

---

## Integration Checklist

Before deploying to production, test these scenarios:

- [ ] Get price for standard 1 carat VS1 D EX diamond
- [ ] Get price for budget diamond specs
- [ ] Get price for high-end diamond specs
- [ ] View all available options
- [ ] Verify prices are in expected range (£5,000 - £100,000+)
- [ ] Test with different carat weights
- [ ] Test with different clarity grades
- [ ] Test with different colors
- [ ] Test with different cuts
- [ ] Test with GIA certificate filter
- [ ] Test with other certificates (AGS, IGI, EGL, HRD)
- [ ] Test with no certificate filter (Any/All)
- [ ] Verify certificate information displays in matching diamonds
- [ ] Verify search returns matching diamonds
- [ ] Check error handling for invalid specs
- [ ] Verify certificate prices are higher than non-certified

---

## API Endpoints Being Tested

### 1. Price Suggestions Endpoint
```
GET /api/v1/nivoda/diamonds/price-suggestions
Params: carat, clarity, color, cut
```

### 2. Search Diamonds Endpoint
```
GET /api/v1/nivoda/diamonds/search
Params: minCarat, maxCarat, clarity, color, cut, limit
```

### 3. Available Options Endpoint
```
GET /api/v1/nivoda/available-options
```

---

## Current API Environment

**Status**: STAGING (Test Environment)
**URL**: `https://intg-customer-staging.nivodaapi.net/api/diamonds`
**Data**: Test data - prices are NOT real market prices

### To Switch to Production:
1. Get Nivoda production credentials
2. Update `Server/services/nivodaService.js` line 7:
   ```javascript
   const NIVODA_API_URL = NIVODA_PROD_URL;
   ```
3. Update email and password with production credentials
4. Redeploy

---

## Tips for Effective Testing

1. **Start with known values**: Test with 1.0 carat, VS1 clarity, D color, EX cut first
2. **Vary one parameter at a time**: Change only carat to see price impact
3. **Check available options first**: Click "Get Available Options" before testing
4. **Monitor the raw response**: The JSON at the bottom shows exactly what Nivoda returns
5. **Test edge cases**: Very low carats (0.5) and high carats (5.0+)
6. **Note the differences**: Different clarities show big price impacts
7. **Compare with market**: Prices from staging may not match real market

---

## Troubleshooting

### Page not loading?
- Ensure frontend is running: `npm run dev` in Client folder
- Check browser console for errors (F12)
- Clear cache and refresh

### API returning 500 errors?
- Verify the specifications are valid
- Use "Get Available Options" to check valid values
- Check server logs: `npm run dev` in Server folder

### Prices seem wrong?
- Verify you're using STAGING (test data)
- Different clarity/color combinations have large price ranges
- Larger carats significantly increase price

### No diamonds matching?
- Try with different specifications
- Expand the search (try slightly different carat)
- This is normal - some combinations may have no current inventory

---

## Production Deployment

Before going live:

1. ✅ Switch to Nivoda production API
2. ✅ Update with production credentials
3. ✅ Test all diamond specifications
4. ✅ Verify prices are realistic
5. ✅ Test performance with real API
6. ✅ Test error handling
7. ✅ Deploy to staging first
8. ✅ Test on staging environment
9. ✅ Deploy to production

---

## Contact & Support

For issues with the testing page or Nivoda API:
- Check this guide for troubleshooting
- Review Nivoda API documentation
- Check server logs for detailed error messages
