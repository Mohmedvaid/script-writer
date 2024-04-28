// src/middlewares/standardRes.js

/**
 * Middleware to standardize the response format
 * @param {Express.Request} req - Request object
 * @param {Express.Response} res - Response object
 * @param {Express.NextFunction} next - Next middleware function
 * @returns {Express.NextFunction}
 */

const standardizeResponse = (req, res, next) => {
  res.standardResponse = (statusCode, success, data = null, message = null, error = null) => {
    const response = {
      success: success,
      message: message,
      data: data,
      error: error
    };

    return res.status(statusCode).json(response);
  };

  return next();
};

export default standardizeResponse;
