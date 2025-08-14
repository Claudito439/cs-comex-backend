import express from 'express';
import { body } from 'express-validator';
import categoryController from '../controller/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres'),
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano'),
];

// Rutas públicas
router.get('/', categoryController.getAllCategories);
router.get('/:categoryId', categoryController.getCategoryById);

// Rutas protegidas (solo admin)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  categoryValidation,
  categoryController.createCategory
);
router.put(
  '/:categoryId',
  authenticate,
  authorize('admin'),
  updateCategoryValidation,
  categoryController.updateCategory
);
router.delete(
  '/:categoryId',
  authenticate,
  authorize('admin'),
  categoryController.deleteCategory
);

export default router;
