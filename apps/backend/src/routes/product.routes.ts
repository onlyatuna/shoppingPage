//product.routes.ts
import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// [新增] 管理員取得所有商品
router.get('/admin/all', authenticateToken, requireAdmin, ProductController.getAdminProducts);
// --- 公開路由 (所有人都能看) ---
router.get('/', ProductController.getProducts);
// 統一入口，Controller 內部判斷是 ID 還是 Slug
router.get('/:key', ProductController.getProduct);

// --- 管理員路由 (需登入 + Admin) ---
// 先過 authenticateToken 確保有登入，再過 requireAdmin 確保身分
router.post('/', authenticateToken, requireAdmin, ProductController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, ProductController.updateProduct);
router.patch('/:id', authenticateToken, requireAdmin, ProductController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, ProductController.deleteProduct);

export default router;