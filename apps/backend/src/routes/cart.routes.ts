//cart.routes.ts
import { Router } from 'express';
import * as CartController from '../controllers/cart.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// 所有購物車操作都需要登入
router.use(authenticateToken);

router.get('/', CartController.getMyCart);           // 查詢目前購物車
router.post('/items', CartController.addItemToCart); // 加入商品
router.patch('/items/:id', CartController.updateItem); // 修改數量 (id 是 CartItem 的 id)
router.delete('/items/:id', CartController.removeItem); // 移除商品

export default router;