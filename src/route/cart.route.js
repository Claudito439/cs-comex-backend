import express from 'express';
import { body, param } from 'express-validator';
import cartController from '../controller/cart.controller.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

// Validaciones
const addToCartValidation = [
  body('productId').isMongoId().withMessage('ID de producto inválido'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Cantidad debe ser entre 1 y 100'),
];

const updateCartValidation = [
  param('productId').isMongoId().withMessage('ID de producto inválido'),
  body('quantity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Cantidad debe ser entre 0 y 100'),
];

const productIdValidation = [
  param('productId').isMongoId().withMessage('ID de producto inválido'),
];

// Rutas del carrito (todas requieren autenticación)

// Obtener carrito
router.get('/', authenticate, cartController.getCart);

// Obtener resumen del carrito
router.get('/summary', authenticate, cartController.getCartSummary);

// Validar carrito
router.get('/validate', authenticate, cartController.validateCart);

// Agregar producto al carrito
router.post(
  '/add',
  authenticate,
  addToCartValidation,
  cartController.addToCart
);

// Actualizar cantidad de producto
router.put(
  '/item/:productId',
  authenticate,
  updateCartValidation,
  cartController.updateCartItem
);

// Remover producto del carrito
router.delete(
  '/item/:productId',
  authenticate,
  productIdValidation,
  cartController.removeFromCart
);

// Limpiar carrito
router.delete('/clear', authenticate, cartController.clearCart);

// Aplicar descuento
router.post(
  '/discount',
  authenticate,
  [
    body('discountCode')
      .notEmpty()
      .withMessage('Código de descuento requerido'),
  ],
  cartController.applyDiscount
);

export default router;
