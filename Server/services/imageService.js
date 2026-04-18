const path = require('path');
const { generateFileUrl } = require('../middleware/upload');

const UUID_PATTERN = /^[a-f0-9-]{36}$/i;

/**
 * Extract a valid metalId from a multer fieldname like "media_metal_<uuid>".
 * Returns null if the fieldname is not metal-specific or the UUID is malformed.
 */
const extractMetalId = (fieldname) => {
  if (!fieldname?.includes('media_metal_')) return null;
  const metalId = fieldname.split('media_metal_')[1]?.trim() || null;
  if (metalId && !UUID_PATTERN.test(metalId)) {
    console.warn(`Invalid metal_id format in fieldname: ${metalId}`);
    return null;
  }
  return metalId || null;
};

/**
 * Process an array of multer files into ProductImage and ProductVideo records.
 *
 * @param {object} opts
 * @param {object}   opts.req          - Express request (for generateFileUrl + req.body preview flags)
 * @param {object[]} opts.files        - req.files array
 * @param {string}   opts.productId    - UUID of the product
 * @param {string}   opts.productName  - Used for alt_text / title defaults
 * @param {object}   opts.ProductImage - Sequelize model
 * @param {object}   opts.ProductVideo - Sequelize model
 * @param {number}   opts.imageOffset  - Starting sort_order for images (default 0)
 * @param {number}   opts.videoOffset  - Starting sort_order for videos (default 0)
 * @param {boolean}  opts.firstIsMain  - Whether the first image should be is_primary (default false)
 */
const processUploadedFiles = async ({
  req, files, productId, productName,
  ProductImage, ProductVideo,
  imageOffset = 0, videoOffset = 0, firstIsMain = false,
}) => {
  if (!files?.length) return;

  const metalImageCounters = {};
  const promises = [];
  let imgIdx = 0;
  let vidIdx = 0;

  for (const file of files) {
    const fileUrl = generateFileUrl(req, path.join('products', file.filename));
    const metalId = extractMetalId(file.fieldname);

    if (file.mimetype.startsWith('image/')) {
      let isMetalPreview = false;
      if (metalId) {
        metalImageCounters[metalId] = metalImageCounters[metalId] ?? 0;
        const flagKey = `image_metal_${metalId}_${metalImageCounters[metalId]}_is_metal_preview`;
        isMetalPreview = req.body[flagKey] === 'true' || req.body[flagKey] === true;
        metalImageCounters[metalId]++;
      }

      promises.push(ProductImage.create({
        product_id:      productId,
        image_url:       fileUrl,
        alt_text:        productName,
        is_primary:      firstIsMain && imgIdx === 0,
        sort_order:      imageOffset + imgIdx,
        metal_id:        metalId,
        is_metal_preview: isMetalPreview,
      }));
      imgIdx++;
    } else if (file.mimetype.startsWith('video/')) {
      promises.push(ProductVideo.create({
        product_id: productId,
        video_url:  fileUrl,
        title:      productName,
        sort_order: videoOffset + vidIdx,
        metal_id:   metalId,
      }));
      vidIdx++;
    }
  }

  await Promise.all(promises);
};

/**
 * Apply metal preview updates sent as { [metalId]: [{id, is_metal_preview}] }.
 * Resets all images for a metal then sets the chosen one as preview.
 */
const applyMetalPreviewUpdates = async (ProductImage, productId, updates) => {
  if (!updates) return;

  for (const metalId of Object.keys(updates)) {
    await ProductImage.update(
      { is_metal_preview: false },
      { where: { product_id: productId, metal_id: metalId } }
    );

    for (const { id, is_metal_preview } of updates[metalId]) {
      if (is_metal_preview === true && id) {
        const img = await ProductImage.findByPk(id);
        if (img) await ProductImage.update({ is_metal_preview: true }, { where: { id } });
      }
    }
  }
};

module.exports = { extractMetalId, processUploadedFiles, applyMetalPreviewUpdates };
