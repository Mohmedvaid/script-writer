// src/middlewares/credentials.js
import allowedOrigins from '../config/origin.config';

/**
 * Middleware to check if the request origin is allowed
 * @param {Express.Request} req - Request object
 * @param {Express.Response} res - Response object
 * @param {Express.NextFunction} next - Next middleware function
 * @returns {Express.NextFunction}
 */
const credentials = (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Credentials', true);
  }
  return next();
};

export default credentials;
