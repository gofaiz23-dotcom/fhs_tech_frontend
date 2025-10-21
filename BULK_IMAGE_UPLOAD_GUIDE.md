# 📸 Bulk Image Upload Guide

## ✅ Issue Fixed: "Excel must contain sku column with image URLs"

The error was occurring because the Excel file format didn't match the backend expectations. Here's the correct format:

## 📋 Required Excel/CSV Format

### **Required Columns:**
- ✅ **`sku`** (required) - Must match existing listing SKUs in the database
- ✅ **`mainImageUrl`** (optional) - Single image URL
- ✅ **`galleryImages`** (optional) - Multiple image URLs separated by commas

### **Example CSV Format:**
```csv
sku,subSku,mainImageUrl,galleryImages
SKU-001,SUB-001,https://images.pexels.com/photos/1148955/pexels-photo-1148955.jpeg,"https://images.pexels.com/photos/4352247/pexels-photo-4352247.jpeg,https://images.pexels.com/photos/4352247/pexels-photo-4352247.jpeg"
SKU-002,SUB-002,https://images.pexels.com/photos/4352247/pexels-photo-4352247.jpeg,"https://images.pexels.com/photos/1148955/pexels-photo-1148955.jpeg"
SKU-003,SUB-003,https://images.pexels.com/photos/1148955/pexels-photo-1148955.jpeg,
```

## 🔧 What Was Fixed

### **1. Backend API Structure**
- ✅ Backend expects: `sku` column (required)
- ✅ Backend expects: `mainImageUrl` and `galleryImages` columns (optional)
- ✅ Backend processes: CSV and Excel files
- ✅ Backend validates: SKU must exist in listings table

### **2. Frontend Error Handling**
- ✅ Better error messages for different failure scenarios
- ✅ Specific guidance when "sku column" error occurs
- ✅ Clear instructions in the upload modal
- ✅ Toast notifications instead of browser alerts

### **3. User Experience Improvements**
- ✅ Added format requirements in the upload modal
- ✅ Clear instructions about required columns
- ✅ Tip to download template first
- ✅ Better error messages with actionable guidance

## 📝 Step-by-Step Process

### **1. Download Template**
1. Click "Download Template" button in Listings page
2. This downloads a CSV with the correct format
3. Use this as your starting point

### **2. Prepare Your Data**
1. **Required:** Add `sku` column with existing listing SKUs
2. **Optional:** Add `mainImageUrl` column with single image URLs
3. **Optional:** Add `galleryImages` column with comma-separated URLs
4. Save as CSV or Excel format

### **3. Upload Images**
1. Click "Bulk Images Upload" button
2. Select your prepared file
3. Click "Upload Images"
4. Wait for processing to complete

## 🚨 Common Errors & Solutions

### **Error: "Excel must contain sku column with image URLs"**
- **Cause:** Missing or incorrectly named `sku` column
- **Solution:** Ensure your file has a column named exactly `sku` (case-sensitive)

### **Error: "Listing not found"**
- **Cause:** SKU in your file doesn't exist in the database
- **Solution:** Use only SKUs that exist in your listings

### **Error: "Invalid file format"**
- **Cause:** Unsupported file type
- **Solution:** Use CSV (.csv) or Excel (.xlsx, .xls) files only

## 📊 File Format Examples

### **Minimal Format (Required Only):**
```csv
sku
SKU-001
SKU-002
SKU-003
```

### **With Main Images:**
```csv
sku,mainImageUrl
SKU-001,https://example.com/image1.jpg
SKU-002,https://example.com/image2.jpg
```

### **With Gallery Images:**
```csv
sku,mainImageUrl,galleryImages
SKU-001,https://example.com/main1.jpg,"https://example.com/gallery1.jpg,https://example.com/gallery2.jpg"
SKU-002,https://example.com/main2.jpg,"https://example.com/gallery3.jpg,https://example.com/gallery4.jpg"
```

## 🎯 Best Practices

1. **Always download the template first** to see the correct format
2. **Use existing SKUs only** - don't create new ones in the file
3. **Test with a small file first** (2-3 rows) before uploading large datasets
4. **Use high-quality image URLs** that are publicly accessible
5. **Keep gallery images reasonable** (5-10 images max per listing)

## 🔍 Troubleshooting

### **If upload fails:**
1. Check that your SKUs exist in the listings table
2. Verify your file has the correct column names
3. Ensure image URLs are accessible
4. Try with a smaller file first

### **If images don't appear:**
1. Check that image URLs are valid and accessible
2. Verify the URLs don't require authentication
3. Ensure the images are in supported formats (JPG, PNG, etc.)

## 📞 Support

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your file format matches the examples above
3. Try downloading and using the template file
4. Contact support with your file format and error message

---

**✅ The bulk image upload feature is now working correctly with proper error handling and user guidance!**
