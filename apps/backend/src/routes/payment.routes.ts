//payment.routes.ts
import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware'; // [修正] 改為相對路徑

const router = Router();

// 1. 發起付款 (需登入)
router.post('/line-pay/request', authenticateToken, PaymentController.requestLinePay);

// 2. 確認付款 (需登入，驗證訂單所有權)
router.post('/line-pay/confirm', authenticateToken, PaymentController.confirmLinePay);

// 3. 查詢交易狀態 (輪詢用，需登入)
router.get('/line-pay/requests/:transactionId/check', authenticateToken, PaymentController.checkLinePayStatus);

// 4. 請款 (Capture) - 僅限管理員
router.post('/line-pay/capture', authenticateToken, requireAdmin, PaymentController.captureLinePay);

// 5. 查詢明細 (Details) - 僅限管理員
router.get('/line-pay/details', authenticateToken, requireAdmin, PaymentController.getLinePayDetails);

export default router;