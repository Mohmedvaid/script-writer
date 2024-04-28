// src/api/middlewares/isCooker.js

import CustomError from '../utils/CustomError';

const isCooker = (req, res, next) => {
  // console.log(req.user);
  if (req.user.role !== 'cooker') {
    return next(new CustomError('User is not authorized to perform this action', 401));
  }
  next();
};

export default isCooker;
