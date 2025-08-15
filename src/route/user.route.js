import express from 'express';
import { body } from 'express-validator';
import userController from '../controller/user.controller.js';
import { authenticate, authorize, authorizeOwner } from '../middleware/auth.js';

const router = express.Router();

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Número de teléfono inválido'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('La dirección debe tener entre 5 y 100 caracteres'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La ciudad debe tener entre 2 y 50 caracteres'),
  body('address.zipCode')
    .optional()
    .trim()
    .isPostalCode('any')
    .withMessage('Código postal inválido'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
];

const updateUserValidation = [
  ...updateProfileValidation,
  body('role')
    .optional()
    .isIn(['cliente', 'admin'])
    .withMessage('Rol inválido'),
  body('emailVerified')
    .optional()
    .isBoolean()
    .withMessage('emailVerified debe ser booleano'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano'),
];

router.get('/profile', authenticate, userController.getProfile);
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  userController.updateProfile
);

router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  userController.changePassword
);

router.get(
  '/:userId',
  authenticate,
  authorizeOwner(),
  userController.getUserById
);

router.put(
  '/:userId',
  authenticate,
  authorizeOwner(),
  updateUserValidation,
  userController.updateUser
);

router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

router.post('/', authenticate, authorize('admin'), userController.createUser);

router.get(
  '/search/users',
  authenticate,
  authorize('admin'),
  userController.searchUsers
);

router.delete(
  '/:userId',
  authenticate,
  authorize('admin'),
  userController.deactivateUser
);

export default router;
