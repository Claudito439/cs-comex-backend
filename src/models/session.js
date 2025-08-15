import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
      unique: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
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

sessionSchema.methods.updateLastUsed = function () {
  this.lastUsedAt = new Date();
  return this.save();
};

export const Session = mongoose.model('Session', sessionSchema);
