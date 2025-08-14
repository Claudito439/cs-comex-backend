import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Session, OTP } from '../models/index.js';
import createEmailTransporter from '../config/email.js';
import encryptionService from '../utils/encryption.js';

class AuthService {
  // Generar JWT token
  generateToken(userId, type = 'access') {
    const payload = { id: userId, type };
    const expiresIn =
      type === 'refresh' ? '30d' : process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  // Crear sesión con tokens encriptados
  async createSession(userId, userAgent, ipAddress) {
    try {
      // Generar tokens
      const accessToken = this.generateToken(userId, 'access');
      const refreshToken = this.generateToken(userId, 'refresh');

      // Encriptar tokens
      const encryptedAccessToken = encryptionService.encryptToken(accessToken);
      const encryptedRefreshToken =
        encryptionService.encryptToken(refreshToken);

      // Generar session ID único
      const sessionId = encryptionService.generateSessionHash(
        `${userId}-${Date.now()}-${Math.random()}`
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

      const session = await Session.create({
        user: userId,
        token: sessionId, // Guardamos el session ID, no el JWT
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        userAgent,
        ipAddress,
        isActive: true,
      });

      return {
        sessionId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      };
    } catch (error) {
      throw new Error(`Error al crear sesión: ${error.message}`);
    }
  }

  // Verificar email antes del registro
  async initiateRegistration(email) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Enviar código de verificación
      await this.sendVerificationCode(email, 'registration');

      return {
        message:
          'Código de verificación enviado. Verifica tu email para continuar con el registro.',
      };
    } catch (error) {
      throw new Error(`Error al iniciar registro: ${error.message}`);
    }
  }

  // Registrar usuario (solo después de verificar email)
  async register(userData, verificationCode) {
    try {
      const { name, email, password, phone, address } = userData;

      // Verificar código OTP
      const otp = await OTP.findOne({
        email,
        code: verificationCode,
        type: 'registration',
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otp) {
        throw new Error('Código de verificación inválido o expirado');
      }

      // Verificar que no existe el usuario
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Marcar código como usado
      otp.used = true;
      await otp.save();

      // Crear usuario con email ya verificado
      const user = await User.create({
        name,
        email,
        password,
        phone,
        address,
        emailVerified: true, // Ya verificado durante el registro
      });

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        message: 'Usuario registrado exitosamente',
      };
    } catch (error) {
      throw new Error(`Error en registro: ${error.message}`);
    }
  }

  // Iniciar sesión con sesión completa
  async login(email, password, userAgent, ipAddress) {
    try {
      // Buscar usuario
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar email
      if (!user.emailVerified) {
        throw new Error('Debes verificar tu email antes de iniciar sesión');
      }

      // Invalidar sesiones anteriores del usuario (opcional)
      await Session.updateMany(
        { user: user._id, isActive: true },
        { isActive: false }
      );

      // Crear nueva sesión
      const sessionData = await this.createSession(
        user._id,
        userAgent,
        ipAddress
      );

      return {
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        sessionId: sessionData.sessionId,
        expiresAt: sessionData.expiresAt,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      throw new Error(`Error en login: ${error.message}`);
    }
  }

  // Refresh token
  async refreshToken(encryptedRefreshToken, sessionId) {
    try {
      // Buscar sesión activa
      const session = await Session.findOne({
        token: sessionId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).populate('user');

      if (!session) {
        throw new Error('Sesión inválida o expirada');
      }

      // Verificar que el refresh token coincide
      if (session.refreshToken !== encryptedRefreshToken) {
        throw new Error('Token de actualización inválido');
      }

      // Desencriptar y verificar refresh token
      const decryptedRefreshToken = encryptionService.decryptToken(
        encryptedRefreshToken
      );
      const decoded = jwt.verify(decryptedRefreshToken, process.env.JWT_SECRET);

      if (decoded.type !== 'refresh') {
        throw new Error('Tipo de token inválido');
      }

      // Generar nuevo access token
      const newAccessToken = this.generateToken(session.user._id, 'access');
      const encryptedNewAccessToken =
        encryptionService.encryptToken(newAccessToken);

      // Actualizar sesión
      session.accessToken = encryptedNewAccessToken;
      await session.save();

      return {
        accessToken: encryptedNewAccessToken,
        user: {
          id: session.user._id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          emailVerified: session.user.emailVerified,
        },
      };
    } catch (error) {
      throw new Error(`Error al refrescar token: ${error.message}`);
    }
  }

  // Cerrar sesión con session ID
  async logout(sessionId, encryptedAccessToken) {
    try {
      const session = await Session.findOneAndUpdate(
        {
          token: sessionId,
          accessToken: encryptedAccessToken,
          isActive: true,
        },
        { isActive: false },
        { new: true }
      );

      if (!session) {
        throw new Error('Sesión no encontrada');
      }

      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
  }

  // Cerrar todas las sesiones del usuario
  async logoutAllSessions(userId) {
    try {
      await Session.updateMany(
        { user: userId, isActive: true },
        { isActive: false }
      );

      return { message: 'Todas las sesiones han sido cerradas' };
    } catch (error) {
      throw new Error(`Error al cerrar todas las sesiones: ${error.message}`);
    }
  }

  // Enviar código de verificación (mejorado)
  async sendVerificationCode(email, type = 'email_verification') {
    try {
      // Invalidar códigos anteriores del mismo tipo
      await OTP.updateMany({ email, type, used: false }, { used: true });

      // Crear nuevo código
      const otp = await OTP.create({
        email,
        type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      // Configurar mensaje según el tipo
      let subject, message;
      switch (type) {
        case 'registration':
          subject = 'Verificación de registro';
          message = 'Para completar tu registro, usa el siguiente código:';
          break;
        case 'email_verification':
          subject = 'Verificación de email';
          message = 'Para verificar tu email, usa el siguiente código:';
          break;
        case 'password_reset':
          subject = 'Restablecer contraseña';
          message = 'Para restablecer tu contraseña, usa el siguiente código:';
          break;
        default:
          subject = 'Código de verificación';
          message = 'Tu código de verificación es:';
      }

      // Enviar email
      const transporter = createEmailTransporter();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p>${message}</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 3px;">${otp.code}</span>
            </div>
            <p style="color: #666; font-size: 14px;">Este código expira en 10 minutos.</p>
            <p style="color: #666; font-size: 14px;">Si no solicitaste este código, ignora este mensaje.</p>
          </div>
        `,
      });

      return { message: 'Código enviado al email' };
    } catch (error) {
      throw new Error(`Error al enviar código: ${error.message}`);
    }
  }

  // Verificar email
  async verifyEmail(email, code) {
    try {
      const otp = await OTP.findOne({
        email,
        code,
        type: 'email_verification',
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otp) {
        throw new Error('Código inválido o expirado');
      }

      // Marcar código como usado
      otp.used = true;
      await otp.save();

      // Verificar usuario
      await User.findOneAndUpdate({ email }, { emailVerified: true });

      return { message: 'Email verificado exitosamente' };
    } catch (error) {
      throw new Error(`Error al verificar email: ${error.message}`);
    }
  }

  // Solicitar reset de contraseña
  async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        // Por seguridad, no revelar si el email existe
        return { message: 'Si el email existe, recibirás un código de reset' };
      }

      await this.sendVerificationCode(email, 'password_reset');

      return { message: 'Código de reset enviado al email' };
    } catch (error) {
      throw new Error(`Error al solicitar reset: ${error.message}`);
    }
  }

  // Reset de contraseña
  async resetPassword(email, code, newPassword) {
    try {
      const otp = await OTP.findOne({
        email,
        code,
        type: 'password_reset',
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otp) {
        throw new Error('Código inválido o expirado');
      }

      // Marcar código como usado
      otp.used = true;
      await otp.save();

      // Actualizar contraseña
      const user = await User.findOne({ email });
      user.password = newPassword;
      await user.save();

      // Invalidar todas las sesiones del usuario
      await Session.updateMany({ user: user._id }, { isActive: false });

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      throw new Error(`Error al resetear contraseña: ${error.message}`);
    }
  }

  // Obtener sesiones activas del usuario
  async getUserActiveSessions(userId) {
    try {
      const sessions = await Session.find({
        user: userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
        .select('createdAt userAgent ipAddress')
        .sort({ createdAt: -1 });

      return sessions;
    } catch (error) {
      throw new Error(`Error al obtener sesiones: ${error.message}`);
    }
  }
}

export default new AuthService();
