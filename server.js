import express from 'express';
import dotenv from 'dotenv';
import router from './src/route/index.js';

// Cargar variables de entorno
dotenv.config();

// Importar configuraciones
import connectDB from './src/config/database.js';
import {
  setupMiddlewares,
  errorHandler,
  notFound,
} from './src/middleware/index.js';

// Crear aplicación Express
const app = express();

// Conectar a la base de datos
connectDB();

// Configurar middlewares
setupMiddlewares(app);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API E-commerce funcionando correctamente',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas de la API
app.use('/api', router);

// Aquí irán las rutas de la API
// import authRoutes from './routes/auth.js';
// import userRoutes from './routes/users.js';
// import productRoutes from './routes/products.js';
// import orderRoutes from './routes/orders.js';
// import cartRoutes from './routes/cart.js';

// app.use('/api/auth', authRoutes);
// app.use('/api/users', authenticate, userRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', authenticate, orderRoutes);
// app.use('/api/cart', authenticate, cartRoutes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(
    `Servidor ejecutándose en puerto ${PORT} en modo ${process.env.NODE_ENV}`
  );
});

// Manejo de promesas no capturadas
process.on('unhandledRejection', (err, promise) => {
  console.log('Error no capturado:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
