import { Category } from '../models/index.js';

class CategoryService {
  async getAllCategories(includeInactive = false) {
    try {
      const query = includeInactive ? {} : { isActive: true };

      const categories = await Category.find(query).sort({ name: 1 });

      return categories;
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  async getCategoryById(categoryId) {
    try {
      const category = await Category.findById(categoryId);

      if (!category || !category.isActive) {
        throw new Error('Categoría no encontrada');
      }

      return category;
    } catch (error) {
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }
  }

  async createCategory(categoryData) {
    try {
      const { name, description } = categoryData;
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(name, 'i') },
      });

      if (existingCategory) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      const category = await Category.create({
        name,
        description,
      });

      return category;
    } catch (error) {
      throw new Error(`Error al crear categoría: ${error.message}`);
    }
  }

  async updateCategory(categoryId, updateData) {
    try {
      const { name, description, isActive } = updateData;
      if (name) {
        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(name, 'i') },
          _id: { $ne: categoryId },
        });

        if (existingCategory) {
          throw new Error('Ya existe una categoría con ese nombre');
        }
      }

      const category = await Category.findByIdAndUpdate(
        categoryId,
        { name, description, isActive },
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      return category;
    } catch (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }
  }

  async deleteCategory(categoryId) {
    try {
      const category = await Category.findByIdAndUpdate(
        categoryId,
        { isActive: false },
        { new: true }
      );

      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      return { message: 'Categoría eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar categoría: ${error.message}`);
    }
  }
}

export default new CategoryService();
