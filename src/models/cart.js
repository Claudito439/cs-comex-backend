import mongoose from "mongoose";
const { Schema } = mongoose;
const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Schema.Types.Number,
          required: true,
          min: 1,
        },
        price: {
          type: Schema.Types.Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Schema.Types.Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hook para calcular el total antes de guardar
cartSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  next();
});

export const Cart = mongoose.model("Cart", cartSchema);
