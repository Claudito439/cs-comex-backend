import { Product, Category } from '../models/index.js';

class ProductService {
  async getAllProducts(page = 1, limit = 12, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = { isActive: true };

      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }
      if (filters.inStock) {
        query.stock = { $gt: 0 };
      }
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const products = await Product.find(query)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  async getProductById(productId) {
    try {
      const product = await Product.findById(productId).populate(
        'category',
        'name description'
      );

      if (!product || !product.isActive) {
        throw new Error('Producto no encontrado');
      }

      return product;
    } catch (error) {
      throw new Error(`Error al obtener producto: ${error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      const { name, description, price, stock, category, images, sku } =
        productData;
      const categoryExists = await Category.findById(category);
      if (!categoryExists || !categoryExists.isActive) {
        throw new Error('Categoría no válida');
      }

      if (sku) {
        const existingSku = await Product.findOne({ sku });
        if (existingSku) {
          throw new Error('El SKU ya existe');
        }
      }

      const product = await Product.create({
        name,
        description,
        price,
        stock,
        category,
        images,
        sku,
      });

      await product.populate('category', 'name');
      return product;
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  async updateProduct(productId, updateData) {
    try {
      const {
        name,
        description,
        price,
        stock,
        category,
        images,
        sku,
        isActive,
      } = updateData;

      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists || !categoryExists.isActive) {
          throw new Error('Categoría no válida');
        }
      }

      if (sku) {
        const existingSku = await Product.findOne({
          sku,
          _id: { $ne: productId },
        });
        if (existingSku) {
          throw new Error('El SKU ya existe');
        }
      }

      const product = await Product.findByIdAndUpdate(
        productId,
        { name, description, price, stock, category, images, sku, isActive },
        { new: true, runValidators: true }
      ).populate('category', 'name');

      if (!product) {
        throw new Error('Producto no encontrado');
      }

      return product;
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  async deleteProduct(productId) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        throw new Error('Producto no encontrado');
      }

      return { message: 'Producto eliminado exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  async searchProducts(searchTerm, page = 1, limit = 12, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = {
        isActive: true,
        $text: { $search: searchTerm },
      };

      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }

      const products = await Product.find(query)
        .populate('category', 'name')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Error al buscar productos: ${error.message}`);
    }
  }

  async getProductsByCategory(categoryId, page = 1, limit = 12) {
    try {
      const skip = (page - 1) * limit;

      const products = await Product.find({
        category: categoryId,
        isActive: true,
      })
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments({
        category: categoryId,
        isActive: true,
      });
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Error al obtener productos por categoría: ${error.message}`
      );
    }
  }

  async updateStock(productId, quantity, operation = 'set') {
    try {
      const product = await Product.findById(productId);

      if (!product || !product.isActive) {
        throw new Error('Producto no encontrado');
      }

      let newStock;
      switch (operation) {
        case 'add':
          newStock = product.stock + quantity;
          break;
        case 'subtract':
          newStock = product.stock - quantity;
          if (newStock < 0) {
            throw new Error('Stock insuficiente');
          }
          break;
        case 'set':
        default:
          newStock = quantity;
          break;
      }

      product.stock = newStock;
      await product.save();

      return product;
    } catch (error) {
      throw new Error(`Error al actualizar stock: ${error.message}`);
    }
  }
}

export default new ProductService();
