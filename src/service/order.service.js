import { Order, Product, Cart, User } from '../models/index.js';
import cartService from './cart.service.js';
import mongoose from 'mongoose';

class OrderService {
  async createOrderFromCart(
    userId,
    shippingAddress,
    paymentMethod = 'pending'
  ) {
    try {
      const cart = await cartService.validateCart(userId);

      if (!cart || cart.items.length === 0) {
        throw new Error('Carrito vacío');
      }

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw new Error('Usuario no válido');
      }
      const orderItems = [];
      let totalAmount = 0;

      for (const cartItem of cart.items) {
        const product = cartItem.product;

        const currentProduct = await Product.findById(product._id);
        if (currentProduct.stock < cartItem.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}`);
        }

        const itemTotal = cartItem.price * cartItem.quantity;

        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          totalPrice: itemTotal,
        });

        totalAmount += itemTotal;
      }

      const order = await Order.create({
        user: userId,
        items: orderItems,
        totalAmount,
        shippingAddress,
        status: 'pendiente',
      });

      await cartService.clearCart(userId);

      await order.populate('user', 'name email');
      await order.populate('items.product', 'name images');

      return order;
    } catch (error) {
      throw new Error(`Error al crear orden: ${error.message}`);
    }
  }

  async getUserOrders(userId, page = 1, limit = 10, status = null) {
    try {
      const skip = (page - 1) * limit;
      const query = { user: userId };

      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Error al obtener órdenes: ${error.message}`);
    }
  }

  async getOrderById(orderId, userId = null) {
    try {
      const query = { _id: orderId };
      if (userId) {
        query.user = userId;
      }

      const order = await Order.findOne(query)
        .populate('user', 'name email phone')
        .populate('items.product', 'name images sku');

      if (!order) {
        throw new Error('Orden no encontrada');
      }

      return order;
    } catch (error) {
      throw new Error(`Error al obtener orden: ${error.message}`);
    }
  }

  async updateOrderStatus(orderId, newStatus, userId = null) {
    try {
      const validStatuses = [
        'pendiente',
        'confirmado',
        'enviado',
        'entregado',
        'cancelado',
      ];

      if (!validStatuses.includes(newStatus)) {
        throw new Error('Estado de orden inválido');
      }

      const query = { _id: orderId };

      if (userId) {
        query.user = userId;
        if (newStatus !== 'cancelado') {
          throw new Error('Solo puedes cancelar tus órdenes');
        }
      }

      const order = await Order.findOne(query);

      if (!order) {
        throw new Error('Orden no encontrada');
      }

      if (order.status === 'cancelado') {
        throw new Error('No se puede modificar una orden cancelada');
      }

      if (order.status === 'entregado') {
        throw new Error('No se puede modificar una orden entregada');
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        if (order.status === 'pendiente' && newStatus === 'confirmado') {
          for (const item of order.items) {
            const product = await Product.findById(item.product).session(
              session
            );

            if (product.stock < item.quantity) {
              throw new Error(
                `Stock insuficiente para el producto: ${product.name}`
              );
            }

            product.stock -= item.quantity;
            await product.save({ session });
          }
        } else if (newStatus === 'cancelado' && order.status === 'confirmado') {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.quantity } },
              { session }
            );
          }
        } else if (newStatus === 'pendiente' && order.status === 'confirmado') {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.quantity } },
              { session }
            );
          }
        }

        order.status = newStatus;
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        await order.populate('user', 'name email');
        await order.populate('items.product', 'name images');

        return order;
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      throw new Error(`Error al actualizar orden: ${error.message}`);
    }
  }

  async getAllOrders(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.userId) {
        query.user = filters.userId;
      }
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }
      if (filters.minAmount || filters.maxAmount) {
        query.totalAmount = {};
        if (filters.minAmount) query.totalAmount.$gte = filters.minAmount;
        if (filters.maxAmount) query.totalAmount.$lte = filters.maxAmount;
      }

      const orders = await Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Error al obtener todas las órdenes: ${error.message}`);
    }
  }

  async searchOrdersByNumber(orderNumber, userId = null) {
    try {
      const query = {
        orderNumber: { $regex: orderNumber, $options: 'i' },
      };

      if (userId) {
        query.user = userId;
      }

      const orders = await Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .limit(10);

      return orders;
    } catch (error) {
      throw new Error(`Error al buscar órdenes: ${error.message}`);
    }
  }

  async getOrderStats(startDate = null, endDate = null) {
    try {
      const matchStage = {};

      if (startDate || endDate) {
        matchStage.createdAt = {};

        if (startDate) {
          const [year, month, day] = startDate.split('-').map(Number);
          const start = new Date(year, month - 1, day, 0, 0, 0, 0);
          matchStage.createdAt.$gte = start;
        }

        if (endDate) {
          const [year, month, day] = endDate.split('-').map(Number);
          const end = new Date(year, month - 1, day, 23, 59, 59, 999);
          matchStage.createdAt.$lte = end;
        }
      }

      const testCount = await Order.countDocuments(matchStage);

      const allOrdersStats = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]);

      const confirmedSalesMatchStage = {
        ...matchStage,
        status: { $in: ['confirmado', 'enviado', 'entregado'] },
      };

      const confirmedSalesStats = await Order.aggregate([
        { $match: confirmedSalesMatchStage },
        {
          $group: {
            _id: null,
            confirmedOrders: { $sum: 1 },
            confirmedRevenue: { $sum: '$totalAmount' },
            confirmedAverageOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]);

      const statusStats = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ]);

      const additionalStats = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pendiente'] }, 1, 0] },
            },
            pendingRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pendiente'] }, '$totalAmount', 0],
              },
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelado'] }, 1, 0] },
            },
            cancelledRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelado'] }, '$totalAmount', 0],
              },
            },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'entregado'] }, 1, 0] },
            },
            deliveredRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'entregado'] }, '$totalAmount', 0],
              },
            },
          },
        },
      ]);

      const allStats = allOrdersStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };
      const confirmedStats = confirmedSalesStats[0] || {
        confirmedOrders: 0,
        confirmedRevenue: 0,
        confirmedAverageOrderValue: 0,
      };
      const additional = additionalStats[0] || {};

      const conversionRate =
        allStats.totalOrders > 0
          ? (
              ((additional.deliveredOrders || 0) / allStats.totalOrders) *
              100
            ).toFixed(2)
          : 0;

      const cancellationRate =
        allStats.totalOrders > 0
          ? (
              ((additional.cancelledOrders || 0) / allStats.totalOrders) *
              100
            ).toFixed(2)
          : 0;

      const salesConversionRate =
        allStats.totalOrders > 0
          ? (
              (confirmedStats.confirmedOrders / allStats.totalOrders) *
              100
            ).toFixed(2)
          : 0;

      return {
        general: {
          totalOrders: allStats.totalOrders,
          totalRevenue: allStats.totalRevenue || 0,
          averageOrderValue: allStats.averageOrderValue || 0,
          confirmedOrders: confirmedStats.confirmedOrders || 0,
          confirmedRevenue: confirmedStats.confirmedRevenue || 0,
          confirmedAverageOrderValue:
            confirmedStats.confirmedAverageOrderValue || 0,

          conversionRate: parseFloat(conversionRate),
          cancellationRate: parseFloat(cancellationRate),

          pendingOrders: additional.pendingOrders || 0,
          pendingRevenue: additional.pendingRevenue || 0,
          cancelledOrders: additional.cancelledOrders || 0,
          cancelledRevenue: additional.cancelledRevenue || 0,
          deliveredOrders: additional.deliveredOrders || 0,
          deliveredRevenue: additional.deliveredRevenue || 0,
        },
        byStatus: statusStats || [],

        sales: {
          totalSales: confirmedStats.confirmedRevenue || 0,
          totalSalesOrders: confirmedStats.confirmedOrders || 0,
          averageSaleValue: confirmedStats.confirmedAverageOrderValue || 0,
          salesConversionRate: parseFloat(salesConversionRate),
        },
      };
    } catch (error) {
      console.error('Error en getOrderStats:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  async cancelOrder(orderId, userId, reason = '') {
    try {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
      });

      if (!order) {
        throw new Error('Orden no encontrada');
      }

      if (order.status === 'cancelado') {
        throw new Error('La orden ya está cancelada');
      }

      if (order.status === 'entregado') {
        throw new Error('No se puede cancelar una orden entregada');
      }

      if (order.status === 'enviado') {
        throw new Error('No se puede cancelar una orden que ya fue enviada');
      }

      if (order.status === 'confirmado') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }

      order.status = 'cancelado';
      if (reason) {
        order.cancellationReason = reason;
      }
      await order.save();

      return order;
    } catch (error) {
      throw new Error(`Error al cancelar orden: ${error.message}`);
    }
  }
}

export default new OrderService();
