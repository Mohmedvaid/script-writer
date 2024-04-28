// src/api/validators/videoScriptValidator.js
import { body } from 'express-validator';

/**
 * Validation rules for generating a video script
 */
const validateVideoScript = [
  body('content')
    .isString()
    .withMessage('Content must be a string')
    .notEmpty()
    .withMessage('Content cannot be empty') // Ensure the content is not empty
];

export { validateVideoScript };
