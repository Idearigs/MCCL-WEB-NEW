const express = require('express');
const router = express.Router();
const path = require('path');
const { uploadSingle, uploadMultiple, generateFileUrl, deleteFile } = require('../middleware/upload');

// Upload single file
router.post('/single', uploadSingle('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = generateFileUrl(req, path.join('products', req.file.filename));

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Upload multiple files
router.post('/multiple', uploadMultiple('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: generateFileUrl(req, path.join('products', file.filename)),
      path: file.path
    }));

    res.json({
      message: `${files.length} files uploaded successfully`,
      files: files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Upload product images
router.post('/product-images', uploadMultiple('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const images = req.files.map((file, index) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: generateFileUrl(req, path.join('products', file.filename)),
      alt_text: req.body.alt_text ? req.body.alt_text[index] || '' : '',
      is_primary: index === 0, // First image is primary by default
      sort_order: index
    }));

    res.json({
      message: `${images.length} product images uploaded successfully`,
      images: images
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Upload category image
router.post('/category-image', uploadSingle('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imageUrl = generateFileUrl(req, path.join('categories', req.file.filename));

    res.json({
      message: 'Category image uploaded successfully',
      image: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: imageUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Delete file
// Resolve a client-supplied file name strictly inside uploads/products (no ../ or
// encoded separators), or null.
const PRODUCTS_DIR = path.resolve(__dirname, '..', 'uploads', 'products');
const safeProductPath = (name) => {
  const base = path.basename(String(name || ''));
  if (!base || base === '.' || base === '..') return null;
  const full = path.resolve(PRODUCTS_DIR, base);
  return full.startsWith(PRODUCTS_DIR + path.sep) ? full : null;
};

router.delete('/file/:filename', (req, res) => {
  try {
    const filePath = safeProductPath(req.params.filename);
    if (!filePath) return res.status(400).json({ message: 'Invalid file name' });

    const deleted = deleteFile(filePath);

    if (deleted) {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

// Get file info
router.get('/info/:filename', (req, res) => {
  try {
    const filePath = safeProductPath(req.params.filename);
    if (!filePath) return res.status(400).json({ message: 'Invalid file name' });
    const filename = path.basename(filePath);

    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const stats = require('fs').statSync(filePath);
    const fileUrl = generateFileUrl(req, path.join('products', filename));

    res.json({
      filename: filename,
      size: stats.size,
      url: fileUrl,
      created: stats.birthtime,
      modified: stats.mtime
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ message: 'Failed to get file info', error: error.message });
  }
});

module.exports = router;