# 📖 Product Addition Guide for Client

## 🎯 Quick Start - Adding Ring Products

### Step 1: Login to Admin Panel
1. Go to: `http://your-website.com/admin/login`
2. Enter your admin credentials
3. Click "Login"

---

### Step 2: Navigate to Products
1. Click **"Products"** in the left sidebar
2. Click the blue **"Add Product"** button (top right)

---

### Step 3: Fill Basic Information

#### Required Fields:
- **Product Name**: e.g., "Elegant Solitaire Diamond Ring"
- **SKU**: Will auto-generate (or enter manually)
- **Description**: Full product description
- **Short Description**: Brief summary
- **Base Price**: e.g., 1200.00
- **Sale Price**: (Optional) e.g., 1000.00
- **Currency**: GBP (default)
- **Stock Quantity**: e.g., 15

#### Product Status:
- ✅ **Active**: Check this box
- ✅ **In Stock**: Check this box
- ⬜ **Featured**: Optional (for homepage)

---

### Step 4: Select Category & Specifications

#### Category:
- Select: **"Rings"** from dropdown

#### Ring Specifications:
- **Ring Type**: Select from dropdown
  - Options: Solitaire, Halo, Three Stone, Vintage, etc.
- **Gemstone**: Select primary gemstone
  - Options: Diamond, Sapphire, Ruby, Emerald, etc.
- **Metal**: Select metal type
  - Options: White Gold, Yellow Gold, Rose Gold, Platinum, etc.
- **Collection**: (Optional) Select if part of a collection

---

### Step 5: Upload Images

#### Image Requirements:
- **Format**: JPG, PNG, or WebP
- **Size**: Under 5MB per image
- **Recommended**: At least 2-3 images per product
- **First image**: Will be the main product image

#### How to Upload:
1. Click **"Choose Files"** or drag & drop
2. Select multiple images
3. Wait for upload to complete
4. Set one image as "Primary" (main image)

---

### Step 6: Additional Details (Optional)

- **Weight**: Product weight in grams
- **Dimensions**: Enter if needed
- **Care Instructions**: How to care for the product
- **Warranty Info**: Warranty details
- **SEO**:
  - Meta Title
  - Meta Description

---

### Step 7: Save Product
1. Review all information
2. Click the blue **"Create Product"** button
3. Wait for success message
4. Product will appear in products list

---

## ✅ Verification Checklist

After adding a product:
- [ ] Product appears in admin products list
- [ ] Images are visible in admin
- [ ] Product shows on website frontend
- [ ] All specifications are correct
- [ ] Price is correct

---

## 🔧 Editing Products

To edit an existing product:
1. Go to **Products** list
2. Click the **pencil icon** (Edit) on any product
3. Make your changes
4. Click **"Update Product"**

---

## 🗑️ Deleting Products

To delete a product:
1. Go to **Products** list
2. Click the **trash icon** (Delete) on any product
3. Confirm deletion
4. Product will be removed (images stay in system)

---

## ⚠️ Important Tips

### DO:
✅ Fill all required fields
✅ Upload high-quality images
✅ Use descriptive product names
✅ Double-check prices
✅ Select correct specifications

### DON'T:
❌ Leave required fields empty
❌ Upload very large images (over 5MB)
❌ Use special characters in product names
❌ Forget to mark product as "Active"
❌ Skip image uploads

---

## 🆘 Common Issues & Solutions

### Issue 1: "Product not saving"
**Solution**: Check that all required fields are filled

### Issue 2: "Images not uploading"
**Solution**:
- Check image size (under 5MB)
- Check file format (JPG, PNG, WebP only)
- Try uploading one image at a time

### Issue 3: "Product not showing on website"
**Solution**:
- Make sure "Active" checkbox is checked
- Make sure "In Stock" is checked
- Refresh the website

### Issue 4: "Can't find specifications dropdowns"
**Solution**:
- Make sure you selected "Rings" category first
- Dropdowns appear after category selection

---

## 📊 Product Data Structure

```
Product
├── Basic Info (Name, SKU, Description, Price)
├── Category (Rings)
├── Specifications
│   ├── Ring Type
│   ├── Gemstone
│   ├── Metal
│   └── Collection (optional)
├── Images (Multiple)
├── Stock Info (Quantity, Status)
└── SEO (Meta Title, Description)
```

---

## 💡 Best Practices

### Product Names:
- Be descriptive: "Elegant Solitaire Diamond Ring" ✅
- Not: "Ring 1" ❌

### Descriptions:
- Include material details
- Mention gemstone quality
- Describe design features
- Add size information

### Images:
- Show from multiple angles
- Include close-up details
- Use consistent lighting
- White background preferred

### Pricing:
- Use consistent currency (GBP)
- Include VAT if applicable
- Set sale price for promotions

---

## 📞 Need Help?

If you encounter any issues:
1. Check this guide first
2. Try refreshing the page
3. Check browser console (F12) for errors
4. Contact technical support

---

## ✨ Quick Reference

| Action | Location | Button |
|--------|----------|--------|
| Add Product | Products → Add Product | Blue "Add Product" |
| Edit Product | Products List | Pencil Icon |
| Delete Product | Products List | Trash Icon |
| Upload Images | Product Form | "Choose Files" |
| Save Product | Product Form | "Create Product" |

---

**Happy Product Adding! 🎉**
