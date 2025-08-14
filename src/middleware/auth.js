import jwt from 'jsonwebtoken';
import { User, Session } from '../models/index.js';
import encryptionService from '../utils/encryption.js';

// Middleware para verificar JWT y sesión (mejorado)
export const authenticate = async (req, res, next) => {
  try {
    let encryptedToken, sessionId;

    // Obtener token del header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      encryptedToken = req.headers.authorization.split(' ')[1];
    }

    // Obtener session ID del header o cookie
    sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!encryptedToken || !sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso y session ID requeridos',
      });
    }

    try {
      // Buscar sesión activa
      const session = await Session.findOne({
        token: sessionId,
        accessToken: encryptedToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Sesión inválida o expirada',
        });
      }

      // Desencriptar token
      const decryptedToken = encryptionService.decryptToken(encryptedToken);
      // Verificar JWT
      const decoded = jwt.verify(decryptedToken, process.env.JWT_SECRET);

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          error: 'Tipo de token inválido',
        });
      }

      // Obtener usuario actual
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado o inactivo',
        });
      }

      // Agregar usuario y sesión al request
      req.user = user;
      req.session = session;
      req.sessionId = sessionId;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      success: false,
      error: 'Error del servidor',
    });
  }
};

// Middleware para verificar roles específicos
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
};

// Middleware para verificar que el usuario es propietario del recurso
export const authorizeOwner = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado',
      });
    }

    // Si es admin, permitir acceso
    if (req.user.role === 'admin') {
      return next();
    }

    // Verificar que el usuario es propietario del recurso
    const resourceUserId =
      req.params.userId || req.body[resourceUserField] || req.query.userId;

    if (
      resourceUserId &&
      resourceUserId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'No puedes acceder a recursos de otros usuarios',
      });
    }

    next();
  };
};

// Middleware para verificar email verificado
export const requireEmailVerified = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Debes verificar tu email para continuar',
    });
  }
  next();
};
