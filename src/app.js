// src/index.js
import 'dotenv/config';

// External imports
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Local imports
import { ENV } from './config/app.config';
import corsOptions from './config/cors.config';
import rateLimiter from './middlewares/rateLimiter';
import credentials from './middlewares/credentials.js';
import standardResponse from './middlewares/stdRes.js';
import standardError from './middlewares/stdError';
import routes from './api/routes';
import { connect, disconnect } from './config/db.config';
import validateEnv from './utils/validateEnv';
import cookieParser from 'cookie-parser';

// validateEnv.js - validate the required environment variables
validateEnv();

const app = express();

if (ENV !== 'TEST') {
  // Connect to the database
  connect()
    .then(() => console.log('Database connected'))
    .catch((err) => {
      console.error('Database connection error', err);
      process.exit(1);
    });
}

// Rate limiting
app.use(rateLimiter);

// Global response handler
app.use(standardResponse);

// Middleware for CORS
app.use(credentials);
app.use(cors(corsOptions));

if (ENV === 'DEVELOPMENT') app.use(morgan('dev'));
if (ENV === 'PRODUCTION') app.use(morgan('combined'));

// Parse incoming requests with JSON payloads
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/', (req, res) => res.json({ message: 'UP' }));

// API routes
app.use('/api', routes);

// Global error handler
app.use(standardError);

// 404 route handler
app.all('*', (req, res) => res.status(404).json({ message: 'Not Found' }));

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('---- NODE EXITING ----: Terminating Node.js process');
  console.log('Closing database connection');

  try {
    await disconnect();
  } catch (err) {
    console.error('Database disconnection error', err);
    process.exit(1);
  }

  process.exit(0);
});

export default app;
