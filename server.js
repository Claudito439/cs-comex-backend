import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

import router from './src/route/index.js';
import connectDB from './src/config/database.js';
import { errorHandler, notFound } from './src/middleware/index.js';

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://cs-comex.vercel.app',
      'http://localhost:9000',
      'http://localhost:9001',
    ];

    console.log('🌐 Origin recibido:', origin);
    console.log('🔧 Environment:', process.env.NODE_ENV);

    // ✅ En producción, ser más permisivo para debugging
    if (process.env.NODE_ENV === 'production') {
      // Permitir cualquier subdominio de vercel
      if (
        !origin ||
        origin.includes('cs-comex.vercel.app') ||
        origin.includes('vercel.app') ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        console.log('❌ Origin bloqueado:', origin);
        callback(new Error(`CORS: Origin ${origin} no permitido`));
      }
    } else {
      // En desarrollo, más estricto
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200, // ✅ Para navegadores legacy
};

app.use(cors(corsOptions));

// ✅ Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/', (req, res) => {
  res.json({
    message: 'API CS-Comex funcionando correctamente',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', router);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT} - ${process.env.NODE_ENV}`);
});

export default app;
