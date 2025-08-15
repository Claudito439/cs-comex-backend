import userService from '../service/user.service.js';
import { validationResult } from 'express-validator';

class UserController {
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array(),
        });
      }

      const user = await userService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, emailVerified } = req.query;

      const filters = {};
      if (role) filters.role = role;
      if (emailVerified !== undefined)
        filters.emailVerified = emailVerified === 'true';

      const result = await userService.getAllUsers(
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

  async getUserById(req, res) {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await userService.getUserProfile(req.user._id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await userService.updateUserProfile(req.user._id, req.body);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const result = await userService.changePassword(
        req.user._id,
        currentPassword,
        newPassword
      );

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

  // Actualizar usuario (solo admin)
  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const isAdmin = req.user.role === 'admin';

      const user = await userService.updateUser(userId, req.body, isAdmin);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Desactivar usuario
  async deactivateUser(req, res) {
    try {
      const { userId } = req.params;

      const result = await userService.deactivateUser(userId);

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

  // Buscar usuarios
  async searchUsers(req, res) {
    try {
      const { q: searchTerm, page = 1, limit = 10 } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: 'Término de búsqueda requerido',
        });
      }

      const result = await userService.searchUsers(
        searchTerm,
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
}

export default new UserController();
