import { User } from '../models/index.js';
import bcrypt from 'bcrypt';

class UserService {
  async create(user) {
    try {
      const newUser = await User.create(user);
      const { passwordHash, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = { isActive: true, ...filters };

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');

      if (!user || !user.isActive) {
        throw new Error('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password');

      if (!user || !user.isActive) {
        throw new Error('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      throw new Error(`Error al obtener perfil: ${error.message}`);
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const allowedFields = ['name', 'phone', 'address'];
      const filteredData = {};

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        throw new Error('No hay datos válidos para actualizar');
      }

      const user = await User.findByIdAndUpdate(userId, filteredData, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);

      if (!user || !user.isActive) {
        throw new Error('Usuario no encontrado');
      }

      const isCurrentPasswordValid =
        await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      user.password = newPassword;
      await user.save();

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      throw new Error(`Error al cambiar contraseña: ${error.message}`);
    }
  }

  async updateUser(userId, updateData, isAdmin = false) {
    try {
      let allowedFields = ['name', 'phone', 'address'];
      if (isAdmin) {
        allowedFields = [...allowedFields, 'role', 'emailVerified', 'isActive'];
      }

      const filteredData = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        throw new Error('No hay datos válidos para actualizar');
      }

      const user = await User.findByIdAndUpdate(userId, filteredData, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async deactivateUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return { message: 'Usuario desactivado exitosamente' };
    } catch (error) {
      throw new Error(`Error al desactivar usuario: ${error.message}`);
    }
  }

  async searchUsers(searchTerm, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const query = {
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
        ],
      };

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Error al buscar usuarios: ${error.message}`);
    }
  }
}

export default new UserService();
