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

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/', (req, res) => {
  res.json({
    message: 'API CS-Comex funcionando correctamente',
    environment: process.env.NODE_ENV,
  });
});

app.use('/api', router);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});

export default app;
