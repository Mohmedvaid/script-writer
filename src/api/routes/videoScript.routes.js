// src/api/routes/order.routes.js

import express from 'express';
import { generate } from '../controllers/videoScript.controller';
import { validateVideoScript } from '../validators/videoScript.validator';
import expressValidate from '../../middlewares/expressValidate';
// import verifyToken from '../../middlewares/verifyToken';

const router = express.Router();

// router.use(verifyToken);

router.post('/', validateVideoScript, expressValidate, generate);

export default router;
