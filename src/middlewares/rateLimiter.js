// src/middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '../config/app.config';

const fifteenMinutes = 15 * 60 * 1000;

const rateLimitWindowMs = parseInt(RATE_LIMIT_WINDOW_MS, 10) || fifteenMinutes;
const rateLimitMaxRequests = parseInt(RATE_LIMIT_MAX_REQUESTS, 10) || 100; 

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMaxRequests
});

export default limiter;
