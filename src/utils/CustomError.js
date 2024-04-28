// src/utils/CustomError.js

class CustomError extends Error {
  /**
   * Custom error class
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */

  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 400;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) Error.captureStackTrace(this, CustomError);

    // Custom debugging information
    this.date = new Date();
  }
}

export default CustomError;
