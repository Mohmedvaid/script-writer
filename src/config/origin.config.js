// src/config/origin.config.js
import { ALLOWED_ORIGINS } from './app.config';

const allowedOrigins = ALLOWED_ORIGINS?.split(',');
if (!allowedOrigins || !allowedOrigins.length) {
  console.error('ALLOWED_ORIGINS is not set in the environment variables');
  process.exit(1);
}

export default allowedOrigins;
