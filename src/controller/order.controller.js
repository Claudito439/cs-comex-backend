import orderService from '../service/order.service.js';
import { validationResult } from 'express-validator';

class OrderController {
  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { shippingAddress, paymentMethod } = req.body;

      const order = await orderService.createOrderFromCart(
        req.user._id,
        shippingAddress,
        paymentMethod
      );

      res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente',
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getUserOrders(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const result = await orderService.getUserOrders(
        req.user._id,
        parseInt(page),
        parseInt(limit),
        status
      );

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

  async getUserOrder(req, res) {
    try {
      const { orderId } = req.params;

      const order = await orderService.getOrderById(orderId, req.user._id);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await orderService.cancelOrder(
        orderId,
        req.user._id,
        reason
      );

      res.json({
        success: true,
        message: 'Orden cancelada exitosamente',
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        userId,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
      } = req.query;

      const filters = {
        status,
        userId,
        dateFrom,
        dateTo,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      };

      const result = await orderService.getAllOrders(
        parseInt(page),
        parseInt(limit),
        filters
      );

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

  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;

      const order = await orderService.getOrderById(orderId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { orderId } = req.params;
      const { status } = req.body;

      const order = await orderService.updateOrderStatus(orderId, status);

      res.json({
        success: true,
        message: 'Estado de orden actualizado',
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async searchOrders(req, res) {
    try {
      const { orderNumber } = req.query;

      if (!orderNumber) {
        return res.status(400).json({
          success: false,
          error: 'Número de orden requerido',
        });
      }

      const orders = await orderService.searchOrdersByNumber(orderNumber);

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getOrderStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await orderService.getOrderStats(startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new OrderController();
