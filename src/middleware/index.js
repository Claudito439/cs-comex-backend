import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: {
      error: 'Demasiadas peticiones desde esta IP, inténtalo más tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} ya existe`;
    error = { message, statusCode: 400 };
  }

  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = { message, statusCode: 404 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor',
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const setupMiddlewares = (app) => {
  app.use(helmet());
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? ['https://cs-comex.vercel.app']
          : ['http://localhost:9000', 'http://localhost:9001'],
      credentials: true,
    })
  );

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  /*app.use(
    '/api/',
    createRateLimiter(
      parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      parseInt(process.env.RATE_LIMIT_MAX) || 100
    )
  );*/

  //app.use('/api/auth/', createRateLimiter(15 * 60 * 1000, 5)); // 5 intentos por 15 min
};
