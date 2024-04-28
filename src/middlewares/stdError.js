//  src/middlewares/standardErr.js
import logger from '../utils/logger';
import CustomError from '../utils/CustomError';
import { ENV } from '../config/app.config';

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Express.Request} req - Request object
 * @param {Express.Response} res - Response object
 * @param {Express.NextFunction} next - Next middleware function
 * @returns {Express.Response}
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for server side tracking
  let statusCode = err.statusCode || 500,
    success = false,
    data = null,
    message = err.message || 'An error occurred.',
    error = true;

  if (err instanceof CustomError)
    return res.standardResponse(statusCode, success, data, message, error);

  logger.error(err.message);
  logger.error(err.stack);

  if (ENV === 'DEVELOPMENT') console.error(err);

  statusCode = 500;
  message = 'An internal error occurred.';

  return res.standardResponse(statusCode, success, data, message, error);
};

export default errorHandler;
