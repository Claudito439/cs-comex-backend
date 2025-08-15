import express from 'express';
import { body, param } from 'express-validator';
import cartController from '../controller/cart.controller.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

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

router.get('/', authenticate, cartController.getCart);
router.get('/summary', authenticate, cartController.getCartSummary);
router.get('/validate', authenticate, cartController.validateCart);

router.post(
  '/add',
  authenticate,
  addToCartValidation,
  cartController.addToCart
);

router.put(
  '/item/:productId',
  authenticate,
  updateCartValidation,
  cartController.updateCartItem
);

router.delete(
  '/item/:productId',
  authenticate,
  productIdValidation,
  cartController.removeFromCart
);

router.delete('/clear', authenticate, cartController.clearCart);

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
