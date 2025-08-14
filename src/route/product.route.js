import express from 'express';
import { body } from 'express-validator';
import productController from '../controller/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número mayor o igual a 0'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('category').isMongoId().withMessage('ID de categoría inválido'),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El SKU debe tener entre 3 y 50 caracteres'),
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número mayor o igual a 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('ID de categoría inválido'),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El SKU debe tener entre 3 y 50 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano'),
];

const updateStockValidation = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('La cantidad debe ser un número entero mayor o igual a 0'),
  body('operation')
    .optional()
    .isIn(['set', 'add', 'subtract'])
    .withMessage('Operación debe ser: set, add o subtract'),
];

// Rutas públicas
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:productId', productController.getProductById);

// Rutas protegidas (solo admin)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  productValidation,
  productController.createProduct
);
router.put(
  '/:productId',
  authenticate,
  authorize('admin'),
  updateProductValidation,
  productController.updateProduct
);
router.delete(
  '/:productId',
  authenticate,
  authorize('admin'),
  productController.deleteProduct
);
router.patch(
  '/:productId/stock',
  authenticate,
  authorize('admin'),
  updateStockValidation,
  productController.updateStock
);

export default router;
