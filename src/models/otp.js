import mongoose from 'mongoose';
const { Schema } = mongoose;
const otpSchema = new Schema(
  {
    email: {
      type: Schema.Types.String,
      required: true,
      lowercase: true,
    },
    code: {
      type: Schema.Types.String,
      length: 6,
    },
    type: {
      type: Schema.Types.String,
      enum: ['registration', 'email_verification', 'password_reset', 'login'],
      required: true,
    },
    expiresAt: {
      type: Schema.Types.Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      index: { expireAfterSeconds: 0 },
    },
    used: {
      type: Schema.Types.Boolean,
      default: false,
    },
    attempts: {
      type: Schema.Types.Number,
      default: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Hook para generar código OTP antes de guardar
otpSchema.pre('save', function (next) {
  if (this.isNew) {
    this.code = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

export const OTP = mongoose.model('OTP', otpSchema);
