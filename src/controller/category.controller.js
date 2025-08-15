import categoryService from '../service/category.service.js';
import { validationResult } from 'express-validator';

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const { includeInactive = false } = req.query;

      const categories = await categoryService.getAllCategories(
        includeInactive === 'true'
      );

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
  async getCategoryById(req, res) {
    try {
      const { categoryId } = req.params;

      const category = await categoryService.getCategoryById(categoryId);

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const category = await categoryService.createCategory(req.body);

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: category,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const { categoryId } = req.params;

      const category = await categoryService.updateCategory(
        categoryId,
        req.body
      );

      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: category,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;

      const result = await categoryService.deleteCategory(categoryId);

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
}

export default new CategoryController();
