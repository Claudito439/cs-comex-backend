import authService from '../service/auth.service.js';
import { validationResult } from 'express-validator';

class AuthController {
  async initiateRegistration(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.initiateRegistration(email);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { verificationCode, ...userData } = req.body;
      const result = await authService.register(userData, verificationCode);

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { email, password } = req.body;
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.login(
        email,
        password,
        userAgent,
        ipAddress
      );

      // Configurar cookie httpOnly para session ID (opcional)
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          user: result.user,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { refreshToken } = req.body;
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID requerido',
        });
      }

      const result = await authService.refreshToken(refreshToken, sessionId);

      res.json({
        success: true,
        message: 'Token actualizado exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  async logout(req, res) {
    try {
      const encryptedToken = req.headers.authorization?.split(' ')[1];
      const sessionId = req.sessionId;

      if (!encryptedToken || !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Datos de sesión requeridos',
        });
      }

      const result = await authService.logout(sessionId, encryptedToken);

      // Limpiar cookie
      res.clearCookie('sessionId');

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async logoutAllSessions(req, res) {
    try {
      const result = await authService.logoutAllSessions(req.user._id);

      // Limpiar cookie
      res.clearCookie('sessionId');

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async sendVerificationCode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { email, type = 'email_verification' } = req.body;

      const result = await authService.sendVerificationCode(email, type);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { email, code } = req.body;

      const result = await authService.verifyEmail(email, code);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async requestPasswordReset(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { email } = req.body;

      const result = await authService.requestPasswordReset(email);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { email, code, newPassword } = req.body;

      const result = await authService.resetPassword(email, code, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMe(req, res) {
    try {
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getActiveSessions(req, res) {
    try {
      const sessions = await authService.getUserActiveSessions(req.user._id);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async sendContact(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        timestamp,
        source,
      } = req.body;
      if (!firstName || !lastName || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos',
        });
      }

      const result = await authService.sendContact({
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        timestamp,
        source,
      });

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error sending contact form:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new AuthController();
