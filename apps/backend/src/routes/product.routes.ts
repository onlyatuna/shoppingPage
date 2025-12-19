//product.routes.ts
import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for admin product endpoints
const adminRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per 15 minutes per IP
    message: { status: 'error', message: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
});

// [新增] 管理員取得所有商品
router.get('/admin/all', adminRateLimiter, authenticateToken, requireAdmin, ProductController.getAdminProducts);
// --- 公開路由 (所有人都能看) ---
router.get('/', ProductController.getProducts);
// 統一入口，Controller 內部判斷是 ID 還是 Slug
router.get('/:key', ProductController.getProduct);

// --- 管理員路由 (需登入 + Admin) ---
// 先過 authenticateToken 確保有登入，再過 requireAdmin 確保身分
router.post('/', adminRateLimiter, authenticateToken, requireAdmin, ProductController.createProduct);
router.put('/:id', adminRateLimiter, authenticateToken, requireAdmin, ProductController.updateProduct);
router.patch('/:id', adminRateLimiter, authenticateToken, requireAdmin, ProductController.updateProduct);
router.delete('/:id', adminRateLimiter, authenticateToken, requireAdmin, ProductController.deleteProduct);

export default router;