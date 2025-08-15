import productService from '../service/product.service.js';
import { validationResult } from 'express-validator';

class ProductController {
  async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        inStock,
        search,
      } = req.query;

      const filters = {
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        inStock: inStock === 'true',
        search,
      };

      const result = await productService.getAllProducts(
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

  async getProductById(req, res) {
    try {
      const { productId } = req.params;

      const product = await productService.getProductById(productId);

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const product = await productService.createProduct(req.body);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateProduct(req, res) {
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

      const product = await productService.updateProduct(productId, req.body);

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;

      const result = await productService.deleteProduct(productId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async searchProducts(req, res) {
    try {
      const {
        q: searchTerm,
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
      } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: 'Término de búsqueda requerido',
        });
      }

      const filters = {
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      };

      const result = await productService.searchProducts(
        searchTerm,
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

  async getProductsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 12 } = req.query;

      const result = await productService.getProductsByCategory(
        categoryId,
        parseInt(page),
        parseInt(limit)
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

  async updateStock(req, res) {
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
      const { quantity, operation = 'set' } = req.body;

      const product = await productService.updateStock(
        productId,
        quantity,
        operation
      );

      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new ProductController();
