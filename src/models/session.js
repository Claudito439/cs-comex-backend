import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// ... (otros modelos permanecen igual)

// Modelo de Sesión (ACTUALIZADO)
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true, // Este será el session ID
    },
    accessToken: {
      type: String,
      required: true, // JWT access token encriptado
    },
    refreshToken: {
      type: String,
      required: true, // JWT refresh token encriptado
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB eliminará automáticamente
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userAgent: String,
    ipAddress: String,
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hook para actualizar lastUsedAt cuando se accede a la sesión
sessionSchema.methods.updateLastUsed = function () {
  this.lastUsedAt = new Date();
  return this.save();
};

export const Session = mongoose.model('Session', sessionSchema);
