import express from 'express';
import { body, param } from 'express-validator';
import orderController from '../controller/order.controller.js';
import { authorize, authenticate } from '../middleware/auth.js';

const router = express.Router();

const createOrderValidation = [
  body('shippingAddress.street')
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Dirección debe tener entre 5 y 100 caracteres'),
  body('shippingAddress.city')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ciudad debe tener entre 2 y 50 caracteres'),
  body('shippingAddress.state')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Estado/Provincia debe tener entre 2 y 50 caracteres'),
  body('shippingAddress.zipCode')
    .notEmpty()
    .trim()
    .isPostalCode('any')
    .withMessage('Código postal inválido'),
  body('shippingAddress.country')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('País debe tener entre 2 y 50 caracteres'),
  body('paymentMethod')
    .optional()
    .isIn([
      'credit_card',
      'debit_card',
      'paypal',
      'bank_transfer',
      'cash_on_delivery',
    ])
    .withMessage('Método de pago inválido'),
];

const orderIdValidation = [
  param('orderId').isMongoId().withMessage('ID de orden inválido'),
];

const updateOrderStatusValidation = [
  param('orderId').isMongoId().withMessage('ID de orden inválido'),
  body('status')
    .isIn(['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'])
    .withMessage('Estado de orden inválido'),
];

const cancelOrderValidation = [
  param('orderId').isMongoId().withMessage('ID de orden inválido'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Razón no puede exceder 200 caracteres'),
];

router.post(
  '/',
  authenticate,
  createOrderValidation,
  orderController.createOrder
);

router.get('/my-orders', authenticate, orderController.getUserOrders);

router.get(
  '/my-orders/:orderId',
  authenticate,
  orderIdValidation,
  orderController.getUserOrder
);

router.patch(
  '/my-orders/:orderId/cancel',
  authenticate,
  cancelOrderValidation,
  orderController.cancelOrder
);

router.get('/', authenticate, authorize('admin'), orderController.getAllOrders);

router.get(
  '/search',
  authenticate,
  authorize('admin'),
  orderController.searchOrders
);

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  orderController.getOrderStats
);

router.get(
  '/:orderId',
  authenticate,
  authorize('admin'),
  orderIdValidation,
  orderController.getOrderById
);

router.patch(
  '/:orderId/status',
  authenticate,
  authorize('admin'),
  updateOrderStatusValidation,
  orderController.updateOrderStatus
);

export default router;
