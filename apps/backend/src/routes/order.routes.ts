//order.routes.ts
import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin, requireDeveloper } from '../middlewares/admin.middleware';

const router = Router();

router.use(authenticateToken); // 全部需要登入

// [新增] 管理員路由 (注意路徑順序，不要被 :id 攔截)
router.get('/admin/all', authenticateToken, requireAdmin, OrderController.getAllOrders);
router.patch('/:id/status', authenticateToken, requireAdmin, OrderController.updateOrderStatus);

// [新增] 開發者專用：刪除單個訂單
router.delete('/:id', requireDeveloper, OrderController.deleteOrder);

router.post('/', OrderController.createOrder);    // 結帳 (下單)
router.get('/', OrderController.getMyOrders);     // 訂單列表
router.get('/:id', OrderController.getOrderById); // 訂單詳情

// [新增] 模擬付款 (緊急修復：限制僅限管理員調用，防止付款繞過漏洞)
router.patch('/:id/pay', requireAdmin, OrderController.payOrder);

export default router;