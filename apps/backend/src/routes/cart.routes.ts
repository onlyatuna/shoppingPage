//cart.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as CartController from '../controllers/cart.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rate limiter for cart operations (database access)
const cartLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many cart requests, please try again later.' },
});

// 所有購物車操作都需要登入和限流
router.use(cartLimiter);
router.use(authenticateToken);

router.get('/', CartController.getMyCart);           // 查詢目前購物車
router.post('/items', CartController.addItemToCart); // 加入商品
router.patch('/items/:id', CartController.updateItem); // 修改數量 (id 是 CartItem 的 id)
router.delete('/items/:id', CartController.removeItem); // 移除商品

export default router;