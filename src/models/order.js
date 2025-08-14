import mongoose from 'mongoose';
const { Schema } = mongoose;
const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: Schema.Types.String,
      unique: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: Schema.Types.String, // Guardar nombre por si se elimina el producto
        quantity: {
          type: Schema.Types.Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Schema.Types.Number,
          required: true,
        },
        totalPrice: {
          type: Schema.Types.Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Schema.Types.Number,
      required: true,
    },
    status: {
      type: Schema.Types.String,
      enum: ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'],
      default: 'pendiente',
    },
    shippingAddress: {
      street: Schema.Types.String,
      city: Schema.Types.String,
      state: Schema.Types.String,
      zipCode: Schema.Types.String,
      country: Schema.Types.String,
    },
  },
  {
    timestamps: true,
  }
);

// Hook para generar número de orden antes de guardar
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
