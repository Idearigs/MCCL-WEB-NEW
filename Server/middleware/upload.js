const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const productsDir = path.join(uploadDir, 'products');
const categoriesDir = path.join(uploadDir, 'categories');

[uploadDir, productsDir, categoriesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = productsDir; // default

    // Determine upload path based on route
    if (req.baseUrl.includes('/categories')) {
      uploadPath = categoriesDir;
    } else if (req.baseUrl.includes('/products')) {
      uploadPath = productsDir;
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogg'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG) are allowed.'), false);
  }
};

// Configure multer
// Increased file limit to 100 to support metal-specific media uploads
// (up to 4 images + 2 videos per metal, for multiple metals)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
    files: 100 // Maximum 100 files per upload (supports multiple metals with media)
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'File too large',
            maxSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 104857600) / 1024 / 1024}MB`
          });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// Middleware for multiple file upload from a single field
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'File too large',
            maxSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 104857600) / 1024 / 1024}MB`
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            message: `Too many files. Maximum ${maxCount} files allowed.`
          });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// Middleware for flexible multi-field file upload (for metal-specific media)
const uploadMultipleFields = (maxCount = 50) => {
  // Create a FRESH multer instance specifically for metal variations with higher limits
  const metalUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024,
      files: 100 // Support multiple metals with multiple images/videos each
    }
  });

  // Return the middleware that handles any files
  return (req, res, next) => {
    console.log('DEBUG: uploadMultipleFields middleware called');
    console.log('  Content-Type:', req.get('content-type'));

    // Use metalUpload.any() to accept files from any field
    metalUpload.any()(req, res, (err) => {
      console.log('DEBUG: multer processing complete, err:', err ? err.message : 'none');

      if (err instanceof multer.MulterError) {
        console.error('DEBUG: Multer error detected');
        console.error('  Code:', err.code);
        console.error('  Message:', err.message);
        console.error('  Field:', err.field);

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'File too large',
            maxSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 104857600) / 1024 / 1024}MB`
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            message: `Too many files. Maximum ${maxCount} files allowed.`
          });
        }
        return res.status(400).json({ message: err.message, code: err.code });
      } else if (err) {
        console.error('DEBUG: Non-multer error:', err.message);
        return res.status(400).json({ message: err.message });
      }

      console.log('DEBUG: Files uploaded successfully, count:', req.files ? req.files.length : 0);

      if (req.files && req.files.length > 0) {
        console.log('DEBUG: All files received by middleware:');
        req.files.forEach((file, index) => {
          console.log(`  [${index}] fieldname: "${file.fieldname}", originalname: "${file.originalname}"`);
        });
      }

      // Filter to only accept files from fields that start with 'media'
      if (req.files) {
        req.files = req.files.filter(file =>
          file.fieldname === 'media' || file.fieldname.startsWith('media_')
        );
        console.log('DEBUG: After filtering, files count:', req.files.length);
        if (req.files.length > 0) {
          console.log('DEBUG: Filtered files:');
          req.files.forEach((file, index) => {
            console.log(`  [${index}] fieldname: "${file.fieldname}"`);
          });
        }
      }

      next();
    });
  };
};

// Helper function to generate file URL
const generateFileUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadMultipleFields,
  generateFileUrl,
  deleteFile,
  upload
};