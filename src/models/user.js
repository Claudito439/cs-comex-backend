import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    email: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: Schema.Types.String,
      required: true,
      minlength: 6,
    },
    role: {
      type: Schema.Types.String,
      enum: ["cliente", "admin"],
      default: "cliente",
    },
    emailVerified: {
      type: Schema.Types.Boolean,
      default: false,
    },
    phone: {
      type: Schema.Types.String,
      trim: true,
    },
    address: {
      street: Schema.Types.String,
      city: Schema.Types.String,
      state: Schema.Types.String,
      zipCode: Schema.Types.String,
      country: Schema.Types.String,
    },
    isActive: {
      type: Schema.Types.Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
