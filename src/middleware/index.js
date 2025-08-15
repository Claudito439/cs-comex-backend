import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Middleware de rate limiting
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs: windowMs, // 15 minutos por defecto
    max: max, // límite de requests por ventana por IP
    message: {
      error: 'Demasiadas peticiones desde esta IP, inténtalo más tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Middleware de manejo de errores
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  // Error de clave duplicada de Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} ya existe`;
    error = { message, statusCode: 400 };
  }

  // Error de ObjectId inválido de Mongoose
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = { message, statusCode: 404 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor',
  });
};

// Middleware para rutas no encontradas
export const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Configurar todos los middlewares
export const setupMiddlewares = (app) => {
  // Seguridad
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? ['https://cs-comex.vercel.app']
          : ['http://localhost:9000', 'http://localhost:9001'],
      credentials: true,
    })
  );

  // Logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  /*app.use(
    '/api/',
    createRateLimiter(
      parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      parseInt(process.env.RATE_LIMIT_MAX) || 100
    )
  );*/

  // Rate limiting más estricto para autenticación
  //app.use('/api/auth/', createRateLimiter(15 * 60 * 1000, 5)); // 5 intentos por 15 min
};
