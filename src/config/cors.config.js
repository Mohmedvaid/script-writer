// src/config/corsOptions.config.js
import allowedOrigins from './origin.config';

// CORS options - only allow requests from the allowed origins
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

export default corsOptions;
