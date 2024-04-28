// src/api/middlewares/verifyToken.js

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/app.config';
import CustomError from '../utils/CustomError';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return next(new CustomError('Unauthorized', 401));

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    return next();
  } catch (error) {
    return next(new CustomError('Unauthorized', 401));
  }
};

export default verifyToken;
