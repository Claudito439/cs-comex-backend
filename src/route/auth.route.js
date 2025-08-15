import express from 'express';
import { body } from 'express-validator';
import authController from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const emailValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
];

const initiateRegistrationValidation = [...emailValidation];

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Número de teléfono inválido'),
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Código debe ser de 6 dígitos'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

const verifyEmailValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Código debe ser de 6 dígitos'),
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Código debe ser de 6 dígitos'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token requerido'),
];

// Rutas públicas
// Agregar estas validaciones al archivo de rutas de auth

// Validación para formulario de contacto
const sendContactValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Número de teléfono inválido'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('El asunto debe tener entre 5 y 100 caracteres'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('El mensaje debe tener entre 10 y 1000 caracteres'),
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Formato de fecha inválido'),
  body('source')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Origen demasiado largo'),
];

// Agregar esta ruta a las rutas públicas (antes de las rutas protegidas):
router.post('/send-contact', sendContactValidation, authController.sendContact);
// Proceso de registro en dos pasos
router.post(
  '/initiate-registration',
  initiateRegistrationValidation,
  authController.initiateRegistration
);
router.post('/register', registerValidation, authController.register);

// Autenticación
router.post('/login', loginValidation, authController.login);
router.post(
  '/refresh-token',
  refreshTokenValidation,
  authController.refreshToken
);

// Verificación y recuperación
router.post(
  '/send-verification-code',
  emailValidation,
  authController.sendVerificationCode
);
router.post('/verify-email', verifyEmailValidation, authController.verifyEmail);
router.post(
  '/request-password-reset',
  emailValidation,
  authController.requestPasswordReset
);
router.post(
  '/reset-password',
  resetPasswordValidation,
  authController.resetPassword
);

// Rutas protegidas
router.post('/logout', authenticate, authController.logout);
router.post(
  '/logout-all-sessions',
  authenticate,
  authController.logoutAllSessions
);
router.get('/me', authenticate, authController.getMe);
router.get('/sessions', authenticate, authController.getActiveSessions);

export default router;
