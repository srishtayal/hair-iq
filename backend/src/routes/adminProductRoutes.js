const express = require('express');
const multer = require('multer');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  addProductMedia,
} = require('../controllers/productController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware, requireAdmin);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.post('/products/:id/variants', createVariant);
router.put('/products/:id/variants/:variantId', updateVariant);

router.post('/products/:id/media', upload.single('file'), addProductMedia);

module.exports = router;
