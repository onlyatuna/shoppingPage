// apps/backend/src/routes/payment.routes.ts

import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/line-pay/request', authenticateToken, PaymentController.requestLinePay);

// 👇👇👇 這裡絕對不能有 authenticateToken 👇👇👇
router.post('/line-pay/confirm', PaymentController.confirmLinePay);

export default router;