import { Cart, Product } from '../models/index.js';

class CartService {
  async getUserCart(userId) {
    try {
      let cart = await Cart.findOne({ user: userId }).populate(
        'items.product',
        'name price stock images isActive'
      );

      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [],
          totalAmount: 0,
        });
      }

      cart.items = cart.items.filter(
        (item) => item.product && item.product.isActive
      );
      if (cart.items.length !== cart.items.length) {
        await cart.save();
      }

      return cart;
    } catch (error) {
      throw new Error(`Error al obtener carrito: ${error.message}`);
    }
  }

  async addToCart(userId, productId, quantity = 1) {
    try {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        throw new Error('Producto no encontrado o no disponible');
      }

      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
      }
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [],
          totalAmount: 0,
        });
      }

      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        if (product.stock < newQuantity) {
          throw new Error(
            `Stock insuficiente. Disponible: ${product.stock}, en carrito: ${cart.items[existingItemIndex].quantity}`
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          price: product.price,
        });
      }

      await cart.save();

      await cart.populate('items.product', 'name price stock images isActive');
      return cart;
    } catch (error) {
      throw new Error(`Error al agregar al carrito: ${error.message}`);
    }
  }

  async updateCartItem(userId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeFromCart(userId, productId);
      }

      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        throw new Error('Producto no encontrado o no disponible');
      }

      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
      }

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        throw new Error('Producto no encontrado en el carrito');
      }

      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.price;

      await cart.save();
      await cart.populate('items.product', 'name price stock images isActive');
      return cart;
    } catch (error) {
      throw new Error(`Error al actualizar carrito: ${error.message}`);
    }
  }

  async removeFromCart(userId, productId) {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );

      await cart.save();
      await cart.populate('items.product', 'name price stock images isActive');
      return cart;
    } catch (error) {
      throw new Error(`Error al remover del carrito: ${error.message}`);
    }
  }

  async clearCart(userId) {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();

      return cart;
    } catch (error) {
      throw new Error(`Error al limpiar carrito: ${error.message}`);
    }
  }

  async validateCart(userId) {
    try {
      const cart = await Cart.findOne({ user: userId }).populate(
        'items.product',
        'name price stock isActive'
      );

      if (!cart || cart.items.length === 0) {
        throw new Error('Carrito vacío');
      }

      const validationErrors = [];
      const updatedItems = [];

      for (const item of cart.items) {
        if (!item.product || !item.product.isActive) {
          validationErrors.push(
            `Producto ${item.product?.name || 'desconocido'} ya no está disponible`
          );
          continue;
        }

        if (item.product.stock < item.quantity) {
          validationErrors.push(
            `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stock}, solicitado: ${item.quantity}`
          );
          continue;
        }

        if (item.price !== item.product.price) {
          item.price = item.product.price;
        }

        updatedItems.push(item);
      }

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('; '));
      }

      cart.items = updatedItems;
      await cart.save();

      return cart;
    } catch (error) {
      throw new Error(`Error al validar carrito: ${error.message}`);
    }
  }

  async applyDiscount(userId, discountCode) {
    try {
      const cart = await this.getUserCart(userId);
      return cart;
    } catch (error) {
      throw new Error(`Error al aplicar descuento: ${error.message}`);
    }
  }

  async getCartSummary(userId) {
    try {
      const cart = await this.getUserCart(userId);

      const summary = {
        itemsCount: cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        subtotal: cart.totalAmount,
        tax: cart.totalAmount * 0.1,
        shipping: cart.totalAmount > 50 ? 0 : 10,
        total: 0,
      };

      summary.total = summary.subtotal + summary.tax + summary.shipping;

      return {
        cart,
        summary,
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }
}

export default new CartService();
