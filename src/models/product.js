import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    description: {
      type: Schema.Types.String,
    },
    price: {
      type: Schema.Types.Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Schema.Types.Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        type: Schema.Types.Mixed, // URLs, Base64, objetos con metadata, etc.
      },
    ],
    isActive: {
      type: Schema.Types.Boolean,
      default: true,
    },
    sku: {
      type: Schema.Types.String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para búsquedas de texto
productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model("Product", productSchema);
