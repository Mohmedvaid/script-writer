import { validationResult } from 'express-validator';
import CustomError from '../utils/CustomError';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new CustomError(
        errors
          .array()
          .map((err) => err.msg)
          .join(', '),
        422
      )
    );
  }
  next();
};

export default validate;
