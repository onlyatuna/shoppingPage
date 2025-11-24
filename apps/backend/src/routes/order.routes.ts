import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { prisma } from '../utils/prisma';
import { StatusCodes } from 'http-status-codes';

const router = Router();

router.use(authenticateToken); // 全部需要登入

// [新增] 管理員路由 (注意路徑順序，不要被 :id 攔截)
router.get('/admin/all', authenticateToken, requireAdmin, OrderController.getAllOrders);
router.patch('/:id/status', authenticateToken, requireAdmin, OrderController.updateOrderStatus);

router.post('/', OrderController.createOrder);    // 結帳 (下單)
router.get('/', OrderController.getMyOrders);     // 訂單列表
router.get('/:id', OrderController.getOrderById); // 訂單詳情

router.patch('/:id/pay', async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user!.userId;

        // 簡單驗證該訂單是否屬於該用戶
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.userId !== userId) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: '訂單不存在' });
        }

        if (order.status !== 'PENDING') {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: '訂單狀態不正確' });
        }

        // 更新狀態
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
        });

        res.json({ status: 'success', message: '付款成功' });
    } catch (error) {
        res.status(500).json({ message: '付款失敗' });
    }
});

export default router;