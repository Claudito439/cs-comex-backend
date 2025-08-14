import cartService from '../service/cart.service.js';
import { validationResult } from 'express-validator';

class CartController {
  // Obtener carrito del usuario
  async getCart(req, res) {
    try {
      const cart = await cartService.getUserCart(req.user._id);

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Agregar producto al carrito
  async addToCart(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { productId, quantity = 1 } = req.body;

      const cart = await cartService.addToCart(
        req.user._id,
        productId,
        quantity
      );

      res.json({
        success: true,
        message: 'Producto agregado al carrito',
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Actualizar cantidad de producto
  async updateCartItem(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      const cart = await cartService.updateCartItem(
        req.user._id,
        productId,
        quantity
      );

      res.json({
        success: true,
        message: 'Carrito actualizado',
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Remover producto del carrito
  async removeFromCart(req, res) {
    try {
      const { productId } = req.params;

      const cart = await cartService.removeFromCart(req.user._id, productId);

      res.json({
        success: true,
        message: 'Producto removido del carrito',
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Limpiar carrito
  async clearCart(req, res) {
    try {
      const cart = await cartService.clearCart(req.user._id);

      res.json({
        success: true,
        message: 'Carrito vaciado',
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Obtener resumen del carrito
  async getCartSummary(req, res) {
    try {
      const result = await cartService.getCartSummary(req.user._id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Validar carrito
  async validateCart(req, res) {
    try {
      const cart = await cartService.validateCart(req.user._id);

      res.json({
        success: true,
        message: 'Carrito válido',
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Aplicar descuento
  async applyDiscount(req, res) {
    try {
      const { discountCode } = req.body;

      const cart = await cartService.applyDiscount(req.user._id, discountCode);

      res.json({
        success: true,
        message: 'Descuento aplicado',
        data: cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new CartController();
